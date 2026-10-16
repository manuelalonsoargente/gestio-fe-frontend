export interface PaginatedMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface Paginated<T> {
  data: T[]
  links?: Record<string, string | null>
  meta: PaginatedMeta
}

export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string[]
  permissions?: string[]
}

export interface User {
  id: number
  name: string
  email: string
  roles: string[]
  created_at: string | null
  updated_at: string | null
}

export interface Role {
  id: number
  name: string
  permissions: string[]
  created_at: string | null
  updated_at: string | null
}

export interface Permission {
  id: number
  name: string
  roles?: string[]
  created_at?: string | null
  updated_at?: string | null
}

export interface ValidationErrors {
  [field: string]: string[]
}

export interface ActivityLog {
  id: number
  action: string
  model_type: string | null
  model_id: number | null
  description: string
  changes: Record<string, unknown> | null
  user: {
    id: number
    name: string
    email: string
  } | null
  created_at: string
}
