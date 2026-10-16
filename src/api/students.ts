import { api } from './http'
import type { Paginated, Student } from '../types'

export interface StudentsQuery {
  page?: number
  search?: string
  courseId?: number | null
  perPage?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface StudentPayload {
  name: string
  surnames: string
  course_id: number
}

export interface ImportResult {
  message: string
  imported: number
  courses_created: number
  skipped: number
  errors: string[]
}

export async function fetchStudents({
  page = 1,
  search = '',
  courseId = null,
  perPage = 15,
  sort = 'surnames',
  direction = 'asc',
}: StudentsQuery = {}): Promise<Paginated<Student>> {
  const { data } = await api.get<Paginated<Student>>('/students', {
    params: {
      page,
      per_page: perPage,
      sort,
      direction,
      ...(search ? { search } : {}),
      ...(courseId ? { course_id: courseId } : {}),
    },
  })
  return data
}

export async function createStudent(payload: StudentPayload): Promise<Student> {
  const { data } = await api.post<{ data: Student }>('/students', payload)
  return data.data
}

export async function updateStudent(id: number, payload: StudentPayload): Promise<Student> {
  const { data } = await api.put<{ data: Student }>(`/students/${id}`, payload)
  return data.data
}

export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/students/${id}`)
}

export async function importStudents(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<ImportResult>('/students/import', form)
  return data
}
