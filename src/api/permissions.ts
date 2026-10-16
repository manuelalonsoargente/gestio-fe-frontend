import { api } from './http'
import type { Paginated, Permission } from '../types'

export interface PermissionsQuery {
  page?: number
  search?: string
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export async function fetchPermissions({
  page = 1,
  search = '',
  perPage = 15,
  sort = 'name',
  direction = 'asc',
}: PermissionsQuery = {}): Promise<Paginated<Permission>> {
  const { data } = await api.get<Paginated<Permission>>('/permissions', {
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

export async function createPermission(name: string): Promise<Permission> {
  const { data } = await api.post<{ data: Permission }>('/permissions', { name })
  return data.data
}

export async function updatePermission(id: number, name: string): Promise<Permission> {
  const { data } = await api.put<{ data: Permission }>(`/permissions/${id}`, { name })
  return data.data
}

export async function deletePermission(id: number): Promise<void> {
  await api.delete(`/permissions/${id}`)
}
