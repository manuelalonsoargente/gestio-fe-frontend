import { api } from './http'
import type { User } from '../types'

export interface ProfilePayload {
  name?: string
  email?: string
  current_password?: string
  password?: string
  password_confirmation?: string
}

export async function updateProfile(payload: ProfilePayload): Promise<User> {
  const { data } = await api.put<{ data: User }>('/profile', payload)
  return data.data
}
