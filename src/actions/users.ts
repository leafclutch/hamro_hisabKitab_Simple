'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, UserWithRoles, Role } from '@/types'
import { revalidatePath } from 'next/cache'

async function requireAdmin(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Forbidden' }
  return null
}

export async function getUsers(): Promise<ActionResult<UserWithRoles[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles:user_roles(
          role:roles(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    const users = (data ?? []).map((u: any) => ({
      ...u,
      roles: (u.roles ?? []).map((r: any) => r.role).filter(Boolean),
    }))

    return { success: true, data: users }
  } catch (err) {
    return { success: false, error: 'Failed to fetch users' }
  }
}

export async function getRoles(): Promise<ActionResult<Role[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('roles').select('*').order('name')
    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch {
    return { success: false, error: 'Failed to fetch roles' }
  }
}

export async function createUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authError = await requireAdmin()
  if (authError) return { success: false, error: authError.error }

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string | null
  const password = formData.get('password') as string
  const roleId = (formData.get('role_id') as string) || null

  if (!email || !fullName || !password) {
    return { success: false, error: 'Email, name, and password are required' }
  }

  try {
    const admin = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) return { success: false, error: authError.message }

    const userId = authData.user.id

    // Update profile (trigger creates it automatically, we update extras)
    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    // Assign role if provided
    if (roleId) {
      const { error: roleError } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId })

      if (roleError) return { success: false, error: roleError.message }
    }

    revalidatePath('/settings/users')
    return { success: true, data: { id: userId } }
  } catch {
    return { success: false, error: 'Failed to create user' }
  }
}

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const authError = await requireAdmin()
  if (authError) return { success: false, error: authError.error }

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string | null
  const isActive = formData.get('is_active') === 'true'
  const roleId = (formData.get('role_id') as string) || null

  if (!fullName) return { success: false, error: 'Name is required' }

  try {
    const admin = createAdminClient()

    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null, is_active: isActive })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    // Replace all roles for this user
    await admin.from('user_roles').delete().eq('user_id', userId)
    if (roleId) {
      const { error: roleError } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId })
      if (roleError) return { success: false, error: roleError.message }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update user' }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const authError = await requireAdmin()
  if (authError) return { success: false, error: authError.error }

  try {
    const admin = createAdminClient()

    // Delete from auth (cascades to profiles via FK on DELETE CASCADE)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete user' }
  }
}

export async function getUserById(id: string): Promise<ActionResult<UserWithRoles>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles:user_roles(
          role:roles(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'User not found' }

    const user = {
      ...data,
      roles: (data.roles ?? []).map((r: any) => r.role).filter(Boolean),
    }

    return { success: true, data: user }
  } catch {
    return { success: false, error: 'Failed to fetch user' }
  }
}
