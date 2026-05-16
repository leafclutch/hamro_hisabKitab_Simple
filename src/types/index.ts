export type Role = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Permission = {
  id: string
  module: string
  action: string
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserWithRoles = Profile & {
  roles: Role[]
}

export type ActionResult<T = null> = {
  success: boolean
  data?: T
  error?: string
}
