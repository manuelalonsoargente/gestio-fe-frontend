import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/http', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  ensureCsrfCookie: vi.fn(),
}))

import { api, ensureCsrfCookie } from '../api/http'
import { useAuthStore } from './auth'
import type { AuthUser } from '../types'

const adminUser: AuthUser = {
  id: 1,
  name: 'Ada Admin',
  email: 'admin@gestiofe.local',
  roles: ['admin'],
  permissions: ['gestionar-usuaris', 'veure-panell'],
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('can() autoritza només els permisos que posseeix', () => {
    const store = useAuthStore()
    store.user = adminUser

    expect(store.can('gestionar-usuaris')).toBe(true)
    expect(store.can('gestionar-permisos')).toBe(false)
  })

  it('can() és fals sense usuari', () => {
    expect(useAuthStore().can('gestionar-usuaris')).toBe(false)
  })

  it('isAdmin i initials es calculen a partir de lusuari', () => {
    const store = useAuthStore()
    store.user = adminUser

    expect(store.isAdmin).toBe(true)
    expect(store.initials).toBe('AA')
  })

  it('login desa lusuari i marca la sessió', async () => {
    const user = { ...adminUser, roles: [] }
    vi.mocked(api.post).mockResolvedValue({ data: { user } })

    const store = useAuthStore()
    const result = await store.login('admin@gestiofe.local', 'admin1234')

    expect(ensureCsrfCookie).toHaveBeenCalledOnce()
    expect(result).toEqual(user)
    expect(store.user).toEqual(user)
    expect(store.status).toBe('authenticated')
  })

  it('fetchMe marca guest si la crida falla', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('401'))

    const store = useAuthStore()
    const result = await store.fetchMe()

    expect(result).toBeNull()
    expect(store.status).toBe('guest')
  })

  it('logout neteja lusuari encara que la crida falla', async () => {
    const store = useAuthStore()
    store.user = adminUser
    store.status = 'authenticated'
    vi.mocked(api.post).mockRejectedValue(new Error('xarxa'))

    await expect(store.logout()).rejects.toThrow()

    expect(store.user).toBeNull()
    expect(store.status).toBe('guest')
  })
})
