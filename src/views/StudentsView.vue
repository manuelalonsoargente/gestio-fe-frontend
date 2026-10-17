<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadUploaderEvent } from 'primevue/fileupload'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import { fetchCourses } from '../api/courses'
import {
  createStudent,
  deleteStudent,
  fetchStudents,
  importStudents,
  updateStudent,
  type ImportResult,
  type StudentPayload,
} from '../api/students'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'
import type { Course, PaginatedMeta, Student } from '../types'

const toast = useToast()
const confirm = useConfirm()

const students = ref<Student[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const courseFilter = ref<number | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('surnames')
const sortOrder = ref(1)
const { perPage, perPageOptions } = usePerPage()

const courseOptions = ref<Course[]>([])
const coursesLoaded = ref(false)

const dialogVisible = ref(false)
const editing = ref<Student | null>(null)
const saving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const form = reactive({
  name: '',
  surnames: '',
  courseId: null as number | null,
})

const importVisible = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)

async function loadCourses(): Promise<void> {
  try {
    const result = await fetchCourses({ perPage: 100 })
    courseOptions.value = result.data
    coursesLoaded.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
  }
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchStudents({
      page: page.value,
      search: search.value,
      courseId: courseFilter.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
    })
    students.value = result.data
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
  sortField.value = typeof event.sortField === 'string' ? event.sortField : 'surnames'
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

function onCourseFilter(): void {
  page.value = 1
  void load()
}

function openCreate(): void {
  editing.value = null
  form.name = ''
  form.surnames = ''
  form.courseId = courseOptions.value[0]?.id ?? null
  formErrors.value = {}
  dialogVisible.value = true
}

function openEdit(student: Student): void {
  editing.value = student
  form.name = student.name
  form.surnames = student.surnames
  form.courseId = student.course_id
  formErrors.value = {}
  dialogVisible.value = true
}

function validateForm(): boolean {
  const errors: Record<string, string[]> = {}

  if (!form.name.trim()) errors.name = ['El nom és obligatori.']
  if (!form.surnames.trim()) errors.surnames = ['Els cognoms són obligatoris.']
  if (!form.courseId) errors.course_id = ['Cal seleccionar un curs.']

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function save(): Promise<void> {
  if (!validateForm()) return

  saving.value = true
  const payload: StudentPayload = {
    name: form.name.trim(),
    surnames: form.surnames.trim(),
    course_id: form.courseId as number,
  }

  try {
    if (editing.value) {
      await updateStudent(editing.value.id, payload)
      toast.add({ severity: 'success', summary: 'Alumne actualitzat', life: 2500 })
    } else {
      await createStudent(payload)
      toast.add({ severity: 'success', summary: 'Alumne creat', life: 2500 })
    }

    dialogVisible.value = false
    await Promise.all([load(), loadCourses()])
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

function confirmDelete(student: Student): void {
  confirm.require({
    header: 'Eliminar alumne',
    message: `Segur que vols eliminar «${student.full_name}»? Aquesta acció no es pot desfer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancel·lar',
    accept: async () => {
      try {
        await deleteStudent(student.id)
        toast.add({ severity: 'success', summary: 'Alumne eliminat', life: 2500 })
        await Promise.all([load(), loadCourses()])
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
      }
    },
  })
}

function openImport(): void {
  importResult.value = null
  importVisible.value = true
}

async function onFileSelected(event: FileUploadUploaderEvent): Promise<void> {
  const file = Array.isArray(event.files) ? event.files[0] : event.files
  if (!file) return

  importing.value = true
  importResult.value = null
  try {
    importResult.value = await importStudents(file)
    toast.add({
      severity: 'success',
      summary: 'Importació completada',
      detail: importResult.value.message,
      life: 3000,
    })
    await Promise.all([load(), loadCourses()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  void loadCourses()
  void load()
})
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <PageHeader title="Alumnat" subtitle="Alumnes de Formació en Empresa i el seu curs.">
      <Button severity="secondary" outlined class="justify-center" @click="openImport">
        <i class="pi pi-upload" />
        <span>Importar</span>
      </Button>
      <Button class="justify-center" @click="openCreate">
        <i class="pi pi-plus" />
        <span>Nou alumne</span>
      </Button>
    </PageHeader>

    <div class="card">
      <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Select
          v-model="courseFilter"
          :options="courseOptions"
          option-label="name"
          option-value="id"
          placeholder="Tots els cursos"
          show-clear
          class="w-full sm:w-64"
          @change="onCourseFilter"
        />
        <IconField class="w-full sm:w-72">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca per nom o cognoms"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="students"
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
          <TableEmpty message="No s'han trobat alumnes." />
        </template>

        <Column field="name" header="Nom" sortable class="min-w-40">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
              >
                {{ (data as Student).name.slice(0, 1).toUpperCase() }}
              </span>
              <span class="font-medium text-slate-700">{{ (data as Student).name }}</span>
            </div>
          </template>
        </Column>

        <Column field="surnames" header="Cognoms" sortable class="min-w-48">
          <template #body="{ data }">
            <span class="text-slate-600">{{ (data as Student).surnames }}</span>
          </template>
        </Column>

        <Column header="Curs" class="min-w-36">
          <template #body="{ data }">
            <span class="text-slate-600">{{ (data as Student).course?.name ?? '—' }}</span>
          </template>
        </Column>

        <Column header="Accions" :exportable="false" class="w-28">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openEdit(data as Student)" />
              <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data as Student)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editing ? 'Editar alumne' : 'Nou alumne'"
      modal
      :style="{ width: '28rem' }"
    >
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label for="student-name" class="text-sm font-medium text-slate-700">Nom</label>
          <InputText id="student-name" v-model="form.name" fluid :invalid="Boolean(formErrors.name)" />
          <small v-if="formErrors.name" class="text-red-600">{{ formErrors.name[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="student-surnames" class="text-sm font-medium text-slate-700">Cognoms</label>
          <InputText
            id="student-surnames"
            v-model="form.surnames"
            fluid
            :invalid="Boolean(formErrors.surnames)"
          />
          <small v-if="formErrors.surnames" class="text-red-600">{{ formErrors.surnames[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="student-course" class="text-sm font-medium text-slate-700">Curs</label>
          <Select
            id="student-course"
            v-model="form.courseId"
            :options="courseOptions"
            option-label="name"
            option-value="id"
            placeholder="Selecciona un curs"
            :invalid="Boolean(formErrors.course_id)"
          />
          <small v-if="formErrors.course_id" class="text-red-600">{{ formErrors.course_id[0] }}</small>
          <small v-if="coursesLoaded && courseOptions.length === 0" class="text-amber-600">
            Encara no hi ha cap curs. Crea'n un des de la secció «Cursos».
          </small>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" label="Cancel·lar" severity="secondary" text @click="dialogVisible = false" />
          <Button type="submit" label="Guardar" :loading="saving" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="importVisible" header="Importar alumnat" :style="{ width: '32rem' }">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-slate-600">
          Puja un fitxer <strong>.xlsx</strong> o <strong>.csv</strong> amb les columnes
          <strong>Nom</strong>, <strong>Cognoms</strong> i <strong>Curs</strong>. Els cursos que no
          existisquen es crearan automàticament.
        </p>

        <FileUpload
          mode="basic"
          accept=".xlsx,.csv"
          :auto="true"
          custom-upload
          choose-label="Selecciona el fitxer"
          :disabled="importing"
          @uploader="onFileSelected"
        />

        <Message v-if="importing" severity="info" :closable="false">Important els alumnes…</Message>

        <Message v-if="importResult" severity="success" :closable="false">
          {{ importResult.message }} ({{ importResult.courses_created }} cursos creats,
          {{ importResult.skipped }} files omeses)
        </Message>

        <div v-if="importResult && importResult.errors.length > 0" class="text-sm">
          <p class="mb-1 font-medium text-amber-700">Incidències:</p>
          <ul class="list-inside list-disc text-slate-600">
            <li v-for="(error, index) in importResult.errors" :key="index">{{ error }}</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <Button label="Tanca" text @click="importVisible = false" />
      </template>
    </Dialog>
  </div>
</template>
