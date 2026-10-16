import axios, { AxiosError } from 'axios'
import type { ValidationErrors } from '../types'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  // Cal activar-ho explícitament: axios només envia X-XSRF-TOKEN per defecte
  // en peticions del mateix origen, i ací l'API viu en un altre port (:8080).
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

/** URL base del backend (sense el sufix /api), on viu /sanctum/csrf-cookie. */
export const backendUrl = baseURL.replace(/\/api\/?$/, '')

/**
 * Establix la cookie XSRF-TOKEN de Laravel (Sanctum SPA).
 * Cal cridar-la abans del primer POST/PUT/PATCH/DELETE.
 * Axios envia el header X-XSRF-TOKEN automàticament (withCredentials activat).
 */
export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(`${backendUrl}/sanctum/csrf-cookie`, { withCredentials: true })
}

/** Extreu els errors de validació (422) d'un error d'Axios. */
export function validationErrors(error: unknown): ValidationErrors {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: ValidationErrors } | undefined
    return data?.errors ?? {}
  }
  return {}
}

/** Missatge útil per a mostrar a l'usuari. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>
    const data = axiosError.response?.data
    const first = Object.values(validationErrors(error))[0]?.[0]
    return data?.message ?? first ?? 'Error inesperat en comunicar amb el servidor.'
  }
  if (error instanceof Error) return error.message
  return 'Error inesperat.'
}

/** El backend ha respost 401 (sessió caducada o inexistent). */
export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}

// Si la sessió caduca (401), neteja l'estat d'autenticació i torna al login.
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isUnauthorized(error)) {
      const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
      if (!url.includes('/auth/login')) {
        const [{ useAuthStore }, { default: router }] = await Promise.all([
          import('../stores/auth'),
          import('../router'),
        ])
        useAuthStore().reset()
        if (router.currentRoute.value.meta.requiresAuth) {
          await router.push({ name: 'login' })
        }
      }
    }
    return Promise.reject(error)
  },
)
