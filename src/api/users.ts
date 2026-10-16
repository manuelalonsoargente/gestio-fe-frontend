import { api } from './http'
import type { Paginated, User } from '../types'

export interface UsersQuery {
  page?: number
  search?: string
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface UserPayload {
  name: string
  email: string
  password?: string | null
  roles: string[]
}

export async function fetchUsers({
  page = 1,
  search = '',
  perPage = 15,
  sort = 'name',
  direction = 'asc',
}: UsersQuery = {}): Promise<Paginated<User>> {
  const { data } = await api.get<Paginated<User>>('/users', {
    params: {
      page,
      per_page: perPage,
      sort,
      direction,
      ...(search ? { search } : {}),
    },
  })
  return data
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await api.post<{ data: User }>('/users', payload)
  return data.data
}

export async function updateUser(id: number, payload: Partial<UserPayload>): Promise<User> {
  const { data } = await api.put<{ data: User }>(`/users/${id}`, payload)
  return data.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}
