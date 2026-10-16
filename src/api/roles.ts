import { api } from './http'
import type { Paginated, Role } from '../types'

export interface RolesQuery {
  page?: number
  search?: string
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface RolePayload {
  name: string
  permissions: string[]
}

export async function fetchRoles({
  page = 1,
  search = '',
  perPage = 15,
  sort = 'name',
  direction = 'asc',
}: RolesQuery = {}): Promise<Paginated<Role>> {
  const { data } = await api.get<Paginated<Role>>('/roles', {
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

export async function createRole(payload: RolePayload): Promise<Role> {
  const { data } = await api.post<{ data: Role }>('/roles', payload)
  return data.data
}

export async function updateRole(id: number, payload: Partial<RolePayload>): Promise<Role> {
  const { data } = await api.put<{ data: Role }>(`/roles/${id}`, payload)
  return data.data
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`)
}
