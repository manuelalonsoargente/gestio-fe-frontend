<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { onMounted, ref } from 'vue'
import { fetchActivity } from '../api/activity'
import { errorMessage } from '../api/http'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'
import type { ActivityLog, PaginatedMeta } from '../types'

const logs = ref<ActivityLog[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const actionFilter = ref<string | null>(null)
const modelFilter = ref<string | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('created_at')
const sortOrder = ref(-1)
const { perPage, perPageOptions } = usePerPage()

const selected = ref<ActivityLog | null>(null)
const detailVisible = ref(false)

const actionOptions = [
  { label: 'Creació', value: 'created' },
  { label: 'Modificació', value: 'updated' },
  { label: 'Esborrat', value: 'deleted' },
  { label: 'Inici de sessió', value: 'login' },
  { label: 'Tancament de sessió', value: 'logout' },
]

const modelOptions = [
  { label: 'Usuari', value: 'User' },
  { label: 'Rol', value: 'Role' },
  { label: 'Permís', value: 'Permission' },
]

const actionLabels: Record<string, string> = {
  created: 'Creat',
  updated: 'Actualitzat',
  deleted: 'Eliminat',
  login: 'Inici de sessió',
  logout: 'Tancament',
}

function actionSeverity(action: string): 'success' | 'info' | 'danger' | 'warn' | 'secondary' {
  switch (action) {
    case 'created':
      return 'success'
    case 'updated':
      return 'info'
    case 'deleted':
      return 'danger'
    case 'login':
      return 'warn'
    default:
      return 'secondary'
  }
}

function modelLabel(model: string | null): string {
  return ({ User: 'Usuari', Role: 'Rol', Permission: 'Permís' } as Record<string, string>)[model ?? ''] ?? '—'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchActivity({
      page: page.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
      search: search.value,
      action: actionFilter.value ?? '',
      modelType: modelFilter.value ?? '',
    })
    logs.value = result.data
    meta.value = result.meta
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

function reload(): void {
  page.value = 1
  void load()
}

function onPage(event: DataTablePageEvent): void {
  perPage.value = event.rows
  page.value = event.page + 1
  void load()
}

function onSort(event: DataTableSortEvent): void {
  sortField.value = typeof event.sortField === 'string' ? event.sortField : 'created_at'
  sortOrder.value = event.sortOrder ?? -1
  page.value = 1
  void load()
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
function onSearchInput(): void {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

function openDetail(log: ActivityLog): void {
  selected.value = log
  detailVisible.value = true
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <PageHeader title="Activitat" subtitle="Registre d'auditoria de les operacions del sistema." />

    <div class="card">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <IconField class="w-full sm:w-64">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca per descripció o usuari"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
        <Select
          v-model="actionFilter"
          :options="actionOptions"
          option-label="label"
          option-value="value"
          placeholder="Totes les accions"
          show-clear
          class="w-full sm:w-48"
          @change="reload"
        />
        <Select
          v-model="modelFilter"
          :options="modelOptions"
          option-label="label"
          option-value="value"
          placeholder="Tots els tipus"
          show-clear
          class="w-full sm:w-44"
          @change="reload"
        />
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="logs"
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
          <TableEmpty message="No hi ha activitat registrada." />
        </template>

        <Column field="created_at" header="Data" sortable class="min-w-40">
          <template #body="{ data }">
            <span class="text-slate-500">{{ formatDate((data as ActivityLog).created_at) }}</span>
          </template>
        </Column>

        <Column field="action" header="Acció" sortable class="w-36">
          <template #body="{ data }">
            <Tag
              :value="actionLabels[(data as ActivityLog).action] ?? (data as ActivityLog).action"
              :severity="actionSeverity((data as ActivityLog).action)"
            />
          </template>
        </Column>

        <Column field="model_type" header="Tipus" sortable class="w-32">
          <template #body="{ data }">
            <span class="text-slate-600">{{ modelLabel((data as ActivityLog).model_type) }}</span>
          </template>
        </Column>

        <Column header="Descripció" class="min-w-52">
          <template #body="{ data }">
            <span class="text-slate-700">{{ (data as ActivityLog).description }}</span>
          </template>
        </Column>

        <Column header="Usuari" class="min-w-44">
          <template #body="{ data }">
            <span v-if="(data as ActivityLog).user" class="text-slate-600">
              {{ (data as ActivityLog).user?.name }}
            </span>
            <span v-else class="text-slate-400">Sistema</span>
          </template>
        </Column>

        <Column header="" class="w-16">
          <template #body="{ data }">
            <Button
              v-if="(data as ActivityLog).changes"
              severity="secondary"
              text
              rounded
              aria-label="Veure els canvis"
              @click="openDetail(data as ActivityLog)"
            >
              <i class="pi pi-list" />
            </Button>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="detailVisible" modal header="Detall del canvi" :style="{ width: '32rem' }">
      <dl v-if="selected?.changes" class="flex flex-col gap-2 text-sm">
        <div
          v-for="(value, key) in selected.changes"
          :key="key"
          class="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2"
        >
          <dt class="font-medium text-slate-500">{{ key }}</dt>
          <dd class="col-span-2 break-words text-slate-700">{{ value }}</dd>
        </div>
      </dl>
      <p v-else class="text-sm text-slate-500">Sense canvis registrats.</p>

      <template #footer>
        <Button severity="secondary" variant="text" @click="detailVisible = false">
          <span>Tanca</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>
