import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import AppLayout from './AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import type { AuthUser } from '../types'

const routeNames = ['dashboard', 'users', 'students', 'courses', 'roles', 'permissions', 'activity', 'profile']

function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      ...routeNames.map((name) => ({
        path: `/${name}`,
        name,
        component: { template: '<div />' },
      })),
      { path: '/', redirect: { name: 'dashboard' } },
    ],
  })
}

async function mountLayout(user: AuthUser) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().user = user
  useAuthStore().status = 'authenticated'

  const router = buildRouter()
  await router.push({ name: 'dashboard' })
  await router.isReady()

  return mount(AppLayout, { global: { plugins: [pinia, router] } })
}

describe('AppLayout', () => {
  it('mostra només els enllaços permesos per lusuari', async () => {
    const wrapper = await mountLayout({
      id: 1,
      name: 'Ada Admin',
      email: 'ada@gestiofe.local',
      roles: ['admin'],
      permissions: ['gestionar-usuaris'],
    })

    const text = wrapper.text()
    expect(text).toContain('Usuaris')
    expect(text).not.toContain('Alumnat')
    expect(text).not.toContain('Rols')
    expect(text).not.toContain('Permisos')
    expect(text).not.toContain('Activitat')
  })

  it('mostra tots els enllaços per a un usuari amb tots els permisos', async () => {
    const wrapper = await mountLayout({
      id: 2,
      name: 'Super Admin',
      email: 'super@gestiofe.local',
      roles: ['admin'],
      permissions: [
        'gestionar-usuaris',
        'gestionar-alumnat',
        'gestionar-rols',
        'gestionar-permisos',
        'veure-auditoria',
      ],
    })

    const text = wrapper.text()
    expect(text).toContain('Usuaris')
    expect(text).toContain('Alumnat')
    expect(text).toContain('Cursos')
    expect(text).toContain('Rols')
    expect(text).toContain('Permisos')
    expect(text).toContain('Activitat')
  })

  it('mostra les inicials de lusuari', async () => {
    const wrapper = await mountLayout({
      id: 3,
      name: 'Maria López',
      email: 'maria@gestiofe.local',
      roles: [],
      permissions: [],
    })

    expect(wrapper.text()).toContain('ML')
  })
})
