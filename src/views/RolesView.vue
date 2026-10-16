<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import { createRole, deleteRole, fetchRoles, updateRole } from '../api/roles'
import { fetchPermissions } from '../api/permissions'
import type { PaginatedMeta, Permission, Role } from '../types'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'

const toast = useToast()
const confirm = useConfirm()

const roles = ref<Role[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('name')
const sortOrder = ref(1)
const { perPage, perPageOptions } = usePerPage()

const permissionOptions = ref<Permission[]>([])

const dialogVisible = ref(false)
const editing = ref<Role | null>(null)
const saving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const form = reactive({
  name: '',
  permissions: [] as string[],
})

function formatDate(value: string | null): string {
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
    const result = await fetchRoles({
      page: page.value,
      search: search.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
    })
    roles.value = result.data
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
  form.name = ''
  form.permissions = []
  formErrors.value = {}
  dialogVisible.value = true
}

function openEdit(role: Role): void {
  editing.value = role
  form.name = role.name
  form.permissions = [...role.permissions]
  formErrors.value = {}
  dialogVisible.value = true
}

async function save(): Promise<void> {
  formErrors.value = {}
  if (!form.name.trim()) {
    formErrors.value = { name: ['El nom del rol és obligatori.'] }
    return
  }

  saving.value = true
  try {
    const payload = { name: form.name.trim(), permissions: form.permissions }

    if (editing.value) {
      await updateRole(editing.value.id, payload)
      toast.add({ severity: 'success', summary: 'Rol actualitzat', life: 2500 })
    } else {
      await createRole(payload)
      toast.add({ severity: 'success', summary: 'Rol creat', life: 2500 })
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

function confirmDelete(role: Role): void {
  confirm.require({
    header: 'Eliminar rol',
    message: `Segur que vols eliminar el rol «${role.name}»? Aquesta acció no es pot desfer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Elimina',
    rejectLabel: 'Cancel·la',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await deleteRole(role.id)
        toast.add({ severity: 'success', summary: 'Rol eliminat', life: 2500 })
        if (roles.value.length === 1 && page.value > 1) page.value -= 1
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

onMounted(async () => {
  await load()
  try {
    permissionOptions.value = (await fetchPermissions({ perPage: 100 })).data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
  }
})
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <PageHeader title="Rols" subtitle="Rols del sistema i els seus permisos.">
      <Button class="justify-center" @click="openCreate">
        <i class="pi pi-plus" />
        <span>Nou rol</span>
      </Button>
    </PageHeader>

    <div class="card">
      <div class="mb-3 flex justify-end">
        <IconField class="w-full sm:w-72">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca un rol"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="roles"
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
          <TableEmpty message="No s'han trobat rols." />
        </template>

        <Column field="name" header="Nom" sortable class="min-w-44">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-shield text-slate-400" />
              <span class="font-medium text-slate-700">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column header="Permisos" class="min-w-64">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="permission in (data as Role).permissions"
                :key="permission"
                :value="permission"
                severity="success"
              />
              <span v-if="(data as Role).permissions.length === 0" class="text-slate-400">
                Cap permís assignat
              </span>
            </div>
          </template>
        </Column>

        <Column field="created_at" header="Creat" sortable class="min-w-40">
          <template #body="{ data }">
            <span class="text-slate-500">{{ formatDate((data as Role).created_at) }}</span>
          </template>
        </Column>

        <Column header="Accions" :exportable="false" class="w-28">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                severity="secondary"
                text
                rounded
                aria-label="Edita el rol"
                @click="openEdit(data as Role)"
              >
                <i class="pi pi-pencil" />
              </Button>
              <Button
                severity="danger"
                text
                rounded
                aria-label="Elimina el rol"
                @click="confirmDelete(data as Role)"
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
      :header="editing ? 'Edita rol' : 'Nou rol'"
      :style="{ width: '28rem' }"
      :closable="!saving"
    >
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label for="role-name" class="text-sm font-medium text-slate-700">Nom del rol</label>
          <InputText
            id="role-name"
            v-model="form.name"
            fluid
            placeholder="per exemple: editor"
            :invalid="Boolean(formErrors.name)"
          />
          <small v-if="formErrors.name" class="text-red-600">{{ formErrors.name[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="role-permissions" class="text-sm font-medium text-slate-700">Permisos</label>
          <MultiSelect
            id="role-permissions"
            v-model="form.permissions"
            :options="permissionOptions"
            option-label="name"
            option-value="name"
            placeholder="Selecciona permisos"
            filter
            fluid
            :show-clear="true"
            :disabled="permissionOptions.length === 0"
          />
          <small class="text-slate-400">
            {{ permissionOptions.length === 0 ? 'No hi ha permisos definits al sistema.' : 'Els permisos determinen a quines funcions pot accedir el rol.' }}
          </small>
        </div>
      </form>

      <template #footer>
        <Button severity="secondary" variant="text" :disabled="saving" @click="dialogVisible = false">
          <span>Cancel·la</span>
        </Button>
        <Button :disabled="saving" class="justify-center" @click="save">
          <i v-if="saving" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          <span>{{ editing ? 'Desa els canvis' : 'Crea el rol' }}</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>
