<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { errorMessage } from '../api/http'
import { fetchRoles } from '../api/roles'
import { fetchUsers } from '../api/users'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

const usersTotal = ref(0)
const rolesTotal = ref(0)
const error = ref('')

const canViewUsers = computed(() => auth.can('gestionar-usuaris'))
const canViewRoles = computed(() => auth.can('gestionar-rols'))
const showStats = computed(() => canViewUsers.value || canViewRoles.value)

onMounted(async () => {
  try {
    if (canViewUsers.value) {
      usersTotal.value = (await fetchUsers({ perPage: 1 })).meta.total
    }
    if (canViewRoles.value) {
      rolesTotal.value = (await fetchRoles({ perPage: 1 })).meta.total
    }
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6">
    <header class="flex items-center gap-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-semibold text-white shadow-sm shadow-brand-600/25"
      >
        {{ auth.initials }}
      </div>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
          Hola, {{ auth.user?.name }}
        </h1>
        <p class="mt-0.5 text-sm text-slate-500">
          Benvingut/da al panell de gestió de <span class="font-medium text-slate-600">Gestió FE</span>.
        </p>
      </div>
    </header>

    <section class="flex flex-wrap gap-2">
      <Tag
        v-for="role in auth.user?.roles ?? []"
        :key="role"
        :value="role"
        severity="info"
        class="text-sm"
      />
    </section>

    <section v-if="showStats" class="grid gap-4 sm:grid-cols-2">
      <div
        v-if="canViewUsers"
        class="card transition-shadow hover:shadow-card-hover"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-500">Usuaris</span>
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
          >
            <i class="pi pi-users" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{{ usersTotal }}</p>
        <RouterLink
          :to="{ name: 'users' }"
          class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Gestionar usuaris
          <i class="pi pi-arrow-right text-xs" />
        </RouterLink>
      </div>

      <div
        v-if="canViewRoles"
        class="card transition-shadow hover:shadow-card-hover"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-500">Rols</span>
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
          >
            <i class="pi pi-shield" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{{ rolesTotal }}</p>
        <RouterLink
          :to="{ name: 'roles' }"
          class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Gestionar rols
          <i class="pi pi-arrow-right text-xs" />
        </RouterLink>
      </div>
    </section>

    <section class="card">
      <h2 class="font-medium text-slate-800">Els teus permisos</h2>
      <div class="mt-3 flex flex-wrap gap-1">
        <Tag
          v-for="permission in auth.user?.permissions ?? []"
          :key="permission"
          :value="permission"
          severity="success"
        />
        <span v-if="(auth.user?.permissions ?? []).length === 0" class="text-sm text-slate-400">
          Sense permisos assignats.
        </span>
      </div>
    </section>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <section class="card">
      <h2 class="font-medium text-slate-800">Compte</h2>
      <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-slate-500">Correu electrònic</dt>
          <dd class="font-medium text-slate-700">{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Identificador</dt>
          <dd class="font-medium text-slate-700">{{ auth.user?.id }}</dd>
        </div>
      </dl>
      <div class="mt-4 flex gap-2">
        <Button severity="secondary" outlined @click="handleLogout">
          <i class="pi pi-sign-out" />
          <span>Tanca la sessió</span>
        </Button>
      </div>
    </section>
  </div>
</template>
