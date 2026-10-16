<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

interface NavItem {
  name: string
  label: string
  icon: string
  permission?: string
}

const navItems = computed<NavItem[]>(() =>
  (
    [
      { name: 'dashboard', label: 'Panell', icon: 'pi pi-home' },
      { name: 'users', label: 'Usuaris', icon: 'pi pi-users', permission: 'gestionar-usuaris' },
      { name: 'students', label: 'Alumnat', icon: 'pi pi-graduation-cap', permission: 'gestionar-alumnat' },
      { name: 'courses', label: 'Cursos', icon: 'pi pi-book', permission: 'gestionar-alumnat' },
      { name: 'roles', label: 'Rols', icon: 'pi pi-shield', permission: 'gestionar-rols' },
      { name: 'permissions', label: 'Permisos', icon: 'pi pi-key', permission: 'gestionar-permisos' },
      { name: 'activity', label: 'Activitat', icon: 'pi pi-history', permission: 'veure-auditoria' },
      { name: 'profile', label: 'El meu perfil', icon: 'pi pi-user' },
    ] as NavItem[]
  ).filter((item) => !item.permission || auth.can(item.permission)),
)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex"
    >
      <div class="mb-8 flex items-center gap-2 px-2 py-1">
        <i class="pi pi-briefcase text-2xl text-teal-600" />
        <span class="text-lg font-semibold text-slate-800">Gestió FE</span>
      </div>

      <nav class="flex flex-1 flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="
            route.name === item.name
              ? 'bg-teal-50 text-teal-700'
              : 'text-slate-600 hover:bg-slate-100'
          "
        >
          <i :class="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-auto border-t border-slate-200 pt-4">
        <RouterLink
          :to="{ name: 'profile' }"
          class="mb-3 flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-slate-100"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white"
          >
            {{ auth.initials }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-800">{{ auth.user?.name }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
          </div>
        </RouterLink>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out" />
          Tanca la sessió
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden"
      >
        <span class="font-semibold text-slate-800">Gestió FE</span>
        <button
          type="button"
          class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Tanca la sessió"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out" />
        </button>
      </header>

      <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="
            route.name === item.name
              ? 'bg-teal-50 text-teal-700'
              : 'text-slate-600 hover:bg-slate-100'
          "
        >
          <i :class="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <main class="flex-1 p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
