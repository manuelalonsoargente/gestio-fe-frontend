<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputPassword from 'primevue/inputpassword'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import { createUser, deleteUser, fetchUsers, updateUser, type UserPayload } from '../api/users'
import { fetchRoles } from '../api/roles'
import PageHeader from '../components/PageHeader.vue'
import TableEmpty from '../components/TableEmpty.vue'
import TableError from '../components/TableError.vue'
import { usePerPage } from '../composables/usePerPage'
import type { PaginatedMeta, Role, User } from '../types'

const toast = useToast()
const confirm = useConfirm()

const users = ref<User[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const loadError = ref<string | null>(null)
const sortField = ref('name')
const sortOrder = ref(1)
const { perPage, perPageOptions } = usePerPage()

const roleOptions = ref<Role[]>([])

const dialogVisible = ref(false)
const editing = ref<User | null>(null)
const saving = ref(false)
const formErrors = ref<Record<string, string[]>>({})
const form = reactive({
  name: '',
  email: '',
  password: '',
  roles: [] as string[],
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
    const result = await fetchUsers({
      page: page.value,
      search: search.value,
      perPage: perPage.value,
      sort: sortField.value,
      direction: sortOrder.value === -1 ? 'desc' : 'asc',
    })
    users.value = result.data
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
  form.email = ''
  form.password = ''
  form.roles = []
  formErrors.value = {}
  dialogVisible.value = true
}

function openEdit(user: User): void {
  editing.value = user
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.roles = [...user.roles]
  formErrors.value = {}
  dialogVisible.value = true
}

function validateForm(): boolean {
  const errors: Record<string, string[]> = {}

  if (!form.name.trim()) errors.name = ['El nom és obligatori.']
  if (!form.email.trim()) errors.email = ['El correu electrònic és obligatori.']
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = ['El correu electrònic no té un format vàlid.']

  if (!editing.value) {
    if (!form.password) errors.password = ['La contrasenya és obligatòria.']
    else if (form.password.length < 8) errors.password = ['La contrasenya ha de tindre 8 caràcters com a mínim.']
  } else if (form.password && form.password.length < 8) {
    errors.password = ['La contrasenya ha de tindre 8 caràcters com a mínim.']
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function save(): Promise<void> {
  if (!validateForm()) return

  saving.value = true
  try {
    if (editing.value) {
      const payload: Partial<UserPayload> = {
        name: form.name.trim(),
        email: form.email.trim(),
        roles: form.roles,
      }
      if (form.password) payload.password = form.password

      await updateUser(editing.value.id, payload)
      toast.add({ severity: 'success', summary: 'Usuari actualitzat', life: 2500 })
    } else {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roles: form.roles,
      })
      toast.add({ severity: 'success', summary: 'Usuari creat', life: 2500 })
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

function confirmDelete(user: User): void {
  confirm.require({
    header: 'Eliminar usuari',
    message: `Segur que vols eliminar «${user.name}»? Aquesta acció no es pot desfer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Elimina',
    rejectLabel: 'Cancel·la',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await deleteUser(user.id)
        toast.add({ severity: 'success', summary: 'Usuari eliminat', life: 2500 })
        if (users.value.length === 1 && page.value > 1) page.value -= 1
        await load()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'No s\'ha pogut eliminar', detail: errorMessage(e), life: 4000 })
      }
    },
  })
}

onMounted(async () => {
  await load()
  try {
    roleOptions.value = (await fetchRoles({ perPage: 100 })).data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
  }
})
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <PageHeader title="Usuaris" subtitle="Gestió dels comptes i els seus rols.">
      <Button class="justify-center" @click="openCreate">
        <i class="pi pi-plus" />
        <span>Nou usuari</span>
      </Button>
    </PageHeader>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex justify-end">
        <IconField class="w-full sm:w-72">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Cerca per nom o correu"
            fluid
            @update:model-value="onSearchInput"
          />
        </IconField>
      </div>

      <TableError v-if="loadError" :message="loadError" @retry="load" />

      <DataTable
        v-else
        :value="users"
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
          <TableEmpty message="No s'han trobat usuaris." />
        </template>

        <Column field="name" header="Nom" sortable class="min-w-40">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700"
              >
                {{ (data as User).name.slice(0, 1).toUpperCase() }}
              </span>
              <span class="font-medium text-slate-700">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="email" header="Correu electrònic" sortable class="min-w-52">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.email }}</span>
          </template>
        </Column>

        <Column header="Rols" class="min-w-36">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="role in (data as User).roles"
                :key="role"
                :value="role"
                :severity="role === 'admin' ? 'danger' : 'info'"
              />
              <span v-if="(data as User).roles.length === 0" class="text-slate-400">—</span>
            </div>
          </template>
        </Column>

        <Column field="created_at" header="Creat" sortable class="min-w-40">
          <template #body="{ data }">
            <span class="text-slate-500">{{ formatDate((data as User).created_at) }}</span>
          </template>
        </Column>


        <Column header="Accions" :exportable="false" class="w-28">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                severity="secondary"
                text
                rounded
                aria-label="Edita l'usuari"
                @click="openEdit(data as User)"
              >
                <i class="pi pi-pencil" />
              </Button>
              <Button
                severity="danger"
                text
                rounded
                aria-label="Elimina l'usuari"
                @click="confirmDelete(data as User)"
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
      :header="editing ? 'Edita usuari' : 'Nou usuari'"
      :style="{ width: '28rem' }"
      :closable="!saving"
    >
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label for="user-name" class="text-sm font-medium text-slate-700">Nom</label>
          <InputText id="user-name" v-model="form.name" fluid :invalid="Boolean(formErrors.name)" />
          <small v-if="formErrors.name" class="text-red-600">{{ formErrors.name[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="user-email" class="text-sm font-medium text-slate-700">Correu electrònic</label>
          <InputText
            id="user-email"
            v-model="form.email"
            type="email"
            fluid
            :invalid="Boolean(formErrors.email)"
          />
          <small v-if="formErrors.email" class="text-red-600">{{ formErrors.email[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="user-password" class="text-sm font-medium text-slate-700">
            Contrasenya
            <span class="font-normal text-slate-400">
              {{ editing ? `buida per a mantindre l'actual` : 'mínim 8 caràcters' }}
            </span>
          </label>
          <InputPassword
            id="user-password"
            v-model="form.password"
            fluid
            :invalid="Boolean(formErrors.password)"
            autocomplete="new-password"
          />
          <small v-if="formErrors.password" class="text-red-600">{{ formErrors.password[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="user-roles" class="text-sm font-medium text-slate-700">Rols</label>
          <MultiSelect
            id="user-roles"
            v-model="form.roles"
            :options="roleOptions"
            option-label="name"
            option-value="name"
            placeholder="Selecciona rols"
            filter
            fluid
            :show-clear="true"
          />
        </div>
      </form>

      <template #footer>
        <Button severity="secondary" variant="text" :disabled="saving" @click="dialogVisible = false">
          <span>Cancel·la</span>
        </Button>
        <Button :disabled="saving" class="justify-center" @click="save">
          <i v-if="saving" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          <span>{{ editing ? 'Desa els canvis' : 'Crea l\'usuari' }}</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>
