import { api } from './http'
import type { Course, Paginated } from '../types'

export interface CoursesQuery {
  page?: number
  search?: string
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface CoursePayload {
  name: string
  order?: number
}

export async function fetchCourses({
  page = 1,
  search = '',
  perPage = 100,
  sort = 'order',
  direction = 'asc',
}: CoursesQuery = {}): Promise<Paginated<Course>> {
  const { data } = await api.get<Paginated<Course>>('/courses', {
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

export async function createCourse(payload: CoursePayload): Promise<Course> {
  const { data } = await api.post<{ data: Course }>('/courses', payload)
  return data.data
}

export async function updateCourse(id: number, payload: CoursePayload): Promise<Course> {
  const { data } = await api.put<{ data: Course }>(`/courses/${id}`, payload)
  return data.data
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`)
}
