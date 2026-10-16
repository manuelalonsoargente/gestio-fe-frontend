<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import {
  createPermission,
  deletePermission,
  fetchPermissions,
  updatePermission,
} from '../api/permissions'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'
import type { PaginatedMeta, Permission } from '../types'

const toast = useToast()
const confirm = useConfirm()

const permissions = ref<Permission[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('name')
const sortOrder = ref(1)
const { perPage, perPageOptions } = usePerPage()

const dialogVisible = ref(false)
const editing = ref<Permission | null>(null)
const saving = ref(false)
const name = ref('')
const nameError = ref('')

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ca-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchPermissions({
      page: page.value,
      search: search.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
    })
    permissions.value = result.data
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
  sortField.value = typeof event.sortField === 'string' ? event.sortField : 'name'
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
  name.value = ''
  nameError.value = ''
  dialogVisible.value = true
}

function openEdit(permission: Permission): void {
  editing.value = permission
  name.value = permission.name
  nameError.value = ''
  dialogVisible.value = true
}

async function save(): Promise<void> {
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = 'El nom del permís és obligatori.'
    return
  }

  saving.value = true
  try {
    if (editing.value) {
      await updatePermission(editing.value.id, name.value.trim())
      toast.add({ severity: 'success', summary: 'Permís actualitzat', life: 2500 })
    } else {
      await createPermission(name.value.trim())
      toast.add({ severity: 'success', summary: 'Permís creat', life: 2500 })
    }

    dialogVisible.value = false
    await load()
  } catch (e) {
    const errors = validationErrors(e)
    if (errors.name) {
      nameError.value = errors.name[0]
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete(permission: Permission): void {
  confirm.require({
    header: 'Eliminar permís',
    message: `Segur que vols eliminar el permís «${permission.name}»? Aquesta acció no es pot desfer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Elimina',
    rejectLabel: 'Cancel·la',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await deletePermission(permission.id)
        toast.add({ severity: 'success', summary: 'Permís eliminat', life: 2500 })
        if (permissions.value.length === 1 && page.value > 1) page.value -= 1
        await load()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: "No s'ha pogut eliminar",
          detail: errorMessage(e),
          life: 4000,
        })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-4">
    <PageHeader title="Permisos" subtitle="Permisos del sistema i els rols que els utilitzen.">
      <Button class="justify-center" @click="openCreate">
        <i class="pi pi-plus" />
        <span>Nou permís</span>
      </Button>
    </PageHeader>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex justify-end">
        <IconField class="w-full sm:w-72">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca un permís"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="permissions"
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
          <TableEmpty message="No s'han trobat permisos." />
        </template>

        <Column field="name" header="Nom" sortable class="min-w-52">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-key text-slate-400" />
              <span class="font-medium text-slate-700">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column header="Rols" class="min-w-44">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="role in (data as Permission).roles ?? []"
                :key="role"
                :value="role"
                :severity="role === 'admin' ? 'danger' : 'info'"
              />
              <span v-if="((data as Permission).roles ?? []).length === 0" class="text-slate-400">—</span>
            </div>
          </template>
        </Column>

        <Column field="created_at" header="Creat" sortable class="min-w-40">
          <template #body="{ data }">
            <span class="text-slate-500">{{ formatDate((data as Permission).created_at) }}</span>
          </template>
        </Column>

        <Column header="Accions" :exportable="false" class="w-28">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                severity="secondary"
                text
                rounded
                aria-label="Edita el permís"
                @click="openEdit(data as Permission)"
              >
                <i class="pi pi-pencil" />
              </Button>
              <Button
                severity="danger"
                text
                rounded
                aria-label="Elimina el permís"
                @click="confirmDelete(data as Permission)"
              >
                <i class="pi pi-trash" />
              </Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editing ? 'Edita permís' : 'Nou permís'"
      :style="{ width: '26rem' }"
      :closable="!saving"
    >
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label for="permission-name" class="text-sm font-medium text-slate-700">Nom del permís</label>
          <InputText
            id="permission-name"
            v-model="name"
            fluid
            placeholder="per exemple: gestionar-informes"
            :invalid="Boolean(nameError)"
          />
          <small v-if="nameError" class="text-red-600">{{ nameError }}</small>
        </div>
      </form>

      <template #footer>
        <Button severity="secondary" variant="text" :disabled="saving" @click="dialogVisible = false">
          <span>Cancel·la</span>
        </Button>
        <Button :disabled="saving" class="justify-center" @click="save">
          <i v-if="saving" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          <span>{{ editing ? 'Desa els canvis' : 'Crea el permís' }}</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>
