import { api, ensureCsrfCookie } from './http'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ResetPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export async function requestPasswordReset(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
  return data.message
}

export async function resetPassword(payload: ResetPayload): Promise<string> {
  await ensureCsrfCookie()
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
  return data.message
}
