<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import { createCourse, deleteCourse, fetchCourses, updateCourse } from '../api/courses'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'
import type { Course, PaginatedMeta } from '../types'

const toast = useToast()
const confirm = useConfirm()

const courses = ref<Course[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('order')
const sortOrder = ref(1)
const { perPage, perPageOptions } = usePerPage()

const dialogVisible = ref(false)
const editing = ref<Course | null>(null)
const saving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const form = reactive({
  name: '',
  order: 0,
})

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchCourses({
      page: page.value,
      search: search.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
    })
    courses.value = result.data
    meta.value = result.meta
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

function onPage(event: DataTablePageEvent): void {
  perPage.value = event.rows
  page.value = event.page + 1
  void load()
}

function onSort(event: DataTableSortEvent): void {
  sortField.value = typeof event.sortField === 'string' ? event.sortField : 'order'
  sortOrder.value = event.sortOrder ?? 1
  page.value = 1
  void load()
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
function onSearchInput(): void {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void load()
  }, 350)
}

function openCreate(): void {
  editing.value = null
  form.name = ''
  form.order = courses.value.length
  formErrors.value = {}
  dialogVisible.value = true
}

function openEdit(course: Course): void {
  editing.value = course
  form.name = course.name
  form.order = course.order
  formErrors.value = {}
  dialogVisible.value = true
}

async function save(): Promise<void> {
  if (!form.name.trim()) {
    formErrors.value = { name: ['El nom del curs és obligatori.'] }
    return
  }

  saving.value = true
  const payload = { name: form.name.trim(), order: form.order || 0 }

  try {
    if (editing.value) {
      await updateCourse(editing.value.id, payload)
      toast.add({ severity: 'success', summary: 'Curs actualitzat', life: 2500 })
    } else {
      await createCourse(payload)
      toast.add({ severity: 'success', summary: 'Curs creat', life: 2500 })
    }

    dialogVisible.value = false
    await load()
  } catch (e) {
    const errors = validationErrors(e)
    if (Object.keys(errors).length > 0) {
      formErrors.value = errors
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete(course: Course): void {
  confirm.require({
    header: 'Eliminar curs',
    message: `Segur que vols eliminar «${course.name}»? Aquesta acció no es pot desfer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancel·lar',
    accept: async () => {
      try {
        await deleteCourse(course.id)
        toast.add({ severity: 'success', summary: 'Curs eliminat', life: 2500 })
        await load()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
      }
    },
  })
}

function openCreateDialog(): void {
  openCreate()
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <PageHeader title="Cursos" subtitle="Catàleg de cursos de Formació en Empresa.">
      <Button class="justify-center" @click="openCreateDialog">
        <i class="pi pi-plus" />
        <span>Nou curs</span>
      </Button>
    </PageHeader>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex justify-end">
        <IconField class="w-full sm:w-72">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca per nom"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="courses"
        :loading="loading"
        :paginator="true"
        :rows="perPage"
        :rows-per-page-options="perPageOptions"
        :first="(page - 1) * perPage"
        :total-records="meta?.total ?? 0"
        :lazy="true"
        :sort-field="sortField"
        :sort-order="sortOrder"
        removable-sort
        striped-rows
        class="text-sm"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        @page="onPage"
        @sort="onSort"
      >
        <template #empty>
          <TableEmpty message="No s'han trobat cursos." />
        </template>

        <Column field="order" header="Ordre" sortable class="w-24">
          <template #body="{ data }">
            <span class="text-slate-500">{{ (data as Course).order }}</span>
          </template>
        </Column>

        <Column field="name" header="Curs" sortable class="min-w-48">
          <template #body="{ data }">
            <span class="font-medium text-slate-700">{{ (data as Course).name }}</span>
          </template>
        </Column>

        <Column header="Alumnes" class="min-w-28">
          <template #body="{ data }">
            <Tag :value="String((data as Course).students_count ?? 0)" severity="info" />
          </template>
        </Column>

        <Column header="Accions" :exportable="false" class="w-28">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEdit(data as Course)" />
              <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data as Course)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editing ? 'Editar curs' : 'Nou curs'"
      :style="{ width: '26rem' }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="course-name" class="text-sm font-medium text-slate-700">Nom</label>
          <InputText id="course-name" v-model="form.name" fluid :invalid="Boolean(formErrors.name)" />
          <small v-if="formErrors.name" class="text-red-600">{{ formErrors.name[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="course-order" class="text-sm font-medium text-slate-700">Ordre</label>
          <InputNumber id="course-order" v-model="form.order" :min="0" fluid />
          <small class="text-slate-400">S'usa per a ordenar els cursos a les llistes.</small>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" label="Cancel·lar" severity="secondary" text @click="dialogVisible = false" />
          <Button type="button" label="Guardar" :loading="saving" @click="save" />
        </div>
      </div>
    </Dialog>
  </div>
</template>
