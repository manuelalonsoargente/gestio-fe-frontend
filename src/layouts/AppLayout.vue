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

interface NavSection {
  label?: string
  items: NavItem[]
}

const allSections: NavSection[] = [
  {
    items: [{ name: 'dashboard', label: 'Panell', icon: 'pi pi-home' }],
  },
  {
    label: 'Administració',
    items: [
      { name: 'users', label: 'Usuaris', icon: 'pi pi-users', permission: 'gestionar-usuaris' },
      { name: 'roles', label: 'Rols', icon: 'pi pi-shield', permission: 'gestionar-rols' },
      { name: 'permissions', label: 'Permisos', icon: 'pi pi-key', permission: 'gestionar-permisos' },
    ],
  },
  {
    label: 'Formació en Empresa',
    items: [
      { name: 'students', label: 'Alumnat', icon: 'pi pi-graduation-cap', permission: 'gestionar-alumnat' },
      { name: 'courses', label: 'Cursos', icon: 'pi pi-book', permission: 'gestionar-alumnat' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'activity', label: 'Activitat', icon: 'pi pi-history', permission: 'veure-auditoria' },
      { name: 'profile', label: 'El meu perfil', icon: 'pi pi-user' },
    ],
  },
]

const sections = computed<NavSection[]>(() =>
  allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || auth.can(item.permission)),
    }))
    .filter((section) => section.items.length > 0),
)

const flatItems = computed<NavItem[]>(() => sections.value.flatMap((section) => section.items))

function isActive(name: string) {
  return route.name === name
}

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
      <div class="mb-2 flex items-center gap-2.5 px-2 py-1">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm shadow-teal-600/25"
        >
          <i class="pi pi-briefcase text-lg" />
        </div>
        <div>
          <p class="text-sm leading-tight font-semibold text-slate-900">Gestió FE</p>
          <p class="text-[11px] text-slate-500">Formació en Empresa</p>
        </div>
      </div>

      <nav class="flex flex-1 flex-col">
        <template v-for="section in sections" :key="section.label ?? 'main'">
          <p
            v-if="section.label"
            class="mt-5 mb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
          >
            {{ section.label }}
          </p>
          <RouterLink
            v-for="item in section.items"
            :key="item.name"
            :to="{ name: item.name }"
            class="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="
              isActive(item.name)
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            "
          >
            <span
              v-if="isActive(item.name)"
              class="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-teal-600"
            />
            <i :class="item.icon" />
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <div class="mt-auto border-t border-slate-200 pt-4">
        <RouterLink
          :to="{ name: 'profile' }"
          class="mb-3 flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-slate-100"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white ring-2 ring-teal-100"
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
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white"
          >
            <i class="pi pi-briefcase text-sm" />
          </div>
          <span class="font-semibold text-slate-800">Gestió FE</span>
        </div>
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
          v-for="item in flatItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            isActive(item.name)
              ? 'bg-teal-50 text-teal-800'
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
