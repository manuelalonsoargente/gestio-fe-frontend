import { api } from './http'
import type { ActivityLog, Paginated } from '../types'

export interface ActivityQuery {
  page?: number
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
  search?: string
  action?: string
  modelType?: string
}

export async function fetchActivity({
  page = 1,
  perPage = 15,
  sort = 'created_at',
  direction = 'desc',
  search = '',
  action = '',
  modelType = '',
}: ActivityQuery = {}): Promise<Paginated<ActivityLog>> {
  const { data } = await api.get<Paginated<ActivityLog>>('/activity', {
    params: {
      page,
      per_page: perPage,
      sort,
      direction,
      ...(search ? { search } : {}),
      ...(action ? { action } : {}),
      ...(modelType ? { model_type: modelType } : {}),
    },
  })
  return data
}
