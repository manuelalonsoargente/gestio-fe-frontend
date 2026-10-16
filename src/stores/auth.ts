import { defineStore } from 'pinia'
import { api, ensureCsrfCookie } from '../api/http'
import type { AuthUser } from '../types'

type AuthStatus = 'unknown' | 'authenticated' | 'guest'

interface State {
  user: AuthUser | null
  status: AuthStatus
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    user: null,
    status: 'unknown',
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    isAdmin: (state): boolean => state.user?.roles.includes('admin') ?? false,
    initials: (state): string =>
      (state.user?.name ?? '')
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase(),
  },

  actions: {
    reset(): void {
      this.user = null
      this.status = 'guest'
    },

    hasRole(role: string): boolean {
      return this.user?.roles.includes(role) ?? false
    },

    /** Comprova si l'usuari té un permís concret (el rol admin té tots). */
    can(permission: string): boolean {
      return this.user?.permissions?.includes(permission) ?? false
    },

    /** Recupera l'usuari de la sessió actual (cookie de Sanctum). */
    async fetchMe(): Promise<AuthUser | null> {
      try {
        const { data } = await api.get<{ user: AuthUser | null }>('/auth/me')
        this.user = data.user
        this.status = data.user ? 'authenticated' : 'guest'
        return this.user
      } catch {
        this.reset()
        return null
      }
    },

    async login(email: string, password: string): Promise<AuthUser> {
      await ensureCsrfCookie()
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', { email, password })
      this.user = data.user
      this.status = 'authenticated'
      return data.user
    },

    async logout(): Promise<void> {
      try {
        await ensureCsrfCookie()
        await api.post('/auth/logout')
      } finally {
        this.reset()
      }
    },
  },
})
