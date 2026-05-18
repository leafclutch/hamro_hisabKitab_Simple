/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ActionResult,
  Project,
  ProjectEmployeeAssignment,
  ProjectExpense,
  ProjectExpenseCategory,
  ProjectPayment,
  ProjectPaymentMethod,
  ProjectPaymentType,
  ProjectWithStats,
} from '@/types'

async function requireAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  return null
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<ActionResult<ProjectWithStats[]>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_payments ( id, amount, payment_method, payment_type, payment_date, note, recorded_by, created_at ),
      project_expenses ( id, category, description, amount, expense_date, recorded_by, created_at ),
      project_employee_assignments (
        id, user_id, role_description, amount_paid, created_by, created_at,
        profiles ( full_name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  const projects: ProjectWithStats[] = (data ?? []).map((p: any) => {
    const total_received = p.project_payments.reduce((s: number, x: any) => s + x.amount, 0)
    const total_expenses = p.project_expenses.reduce((s: number, x: any) => s + x.amount, 0)
    const total_employee_costs = p.project_employee_assignments.reduce((s: number, x: any) => s + x.amount_paid, 0)
    return {
      ...p,
      payment_count: p.project_payments.length,
      total_received,
      total_expenses,
      total_employee_costs,
      net_profit: total_received - total_expenses - total_employee_costs,
      payments: p.project_payments.sort((a: any, b: any) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ),
      expenses: p.project_expenses.sort((a: any, b: any) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      ),
      assignments: p.project_employee_assignments.map((a: any) => ({
        ...a,
        full_name: a.profiles?.full_name ?? 'Unknown',
      })),
    }
  })

  return { success: true, data: projects }
}

export async function getProject(id: string): Promise<ActionResult<ProjectWithStats>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_payments ( id, amount, payment_method, payment_type, payment_date, note, recorded_by, created_at ),
      project_expenses ( id, category, description, amount, expense_date, recorded_by, created_at ),
      project_employee_assignments (
        id, user_id, role_description, amount_paid, created_by, created_at,
        profiles ( full_name )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }

  const p = data as any
  const total_received = p.project_payments.reduce((s: number, x: any) => s + x.amount, 0)
  const total_expenses = p.project_expenses.reduce((s: number, x: any) => s + x.amount, 0)
  const total_employee_costs = p.project_employee_assignments.reduce((s: number, x: any) => s + x.amount_paid, 0)

  return {
    success: true,
    data: {
      ...p,
      payment_count: p.project_payments.length,
      total_received,
      total_expenses,
      total_employee_costs,
      net_profit: total_received - total_expenses - total_employee_costs,
      payments: p.project_payments.sort((a: any, b: any) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ),
      expenses: p.project_expenses.sort((a: any, b: any) =>
        new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      ),
      assignments: p.project_employee_assignments.map((a: any) => ({
        ...a,
        full_name: a.profiles?.full_name ?? 'Unknown',
      })),
    },
  }
}

export async function createProject(formData: FormData): Promise<ActionResult<Project>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: formData.get('name') as string,
      client_name: formData.get('client_name') as string,
      client_email: (formData.get('client_email') as string) || null,
      client_phone: (formData.get('client_phone') as string) || null,
      contract_value: parseFloat(formData.get('contract_value') as string) || 0,
      currency: (formData.get('currency') as string) || 'NPR',
      start_date: (formData.get('start_date') as string) || null,
      deadline: (formData.get('deadline') as string) || null,
      notes: (formData.get('notes') as string) || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/projects')
  return { success: true, data }
}

export async function updateProject(id: string, formData: FormData): Promise<ActionResult<Project>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: formData.get('name') as string,
      client_name: formData.get('client_name') as string,
      client_email: (formData.get('client_email') as string) || null,
      client_phone: (formData.get('client_phone') as string) || null,
      contract_value: parseFloat(formData.get('contract_value') as string) || 0,
      currency: (formData.get('currency') as string) || 'NPR',
      start_date: (formData.get('start_date') as string) || null,
      deadline: (formData.get('deadline') as string) || null,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return { success: true, data }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/projects')
  return { success: true }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function addProjectPayment(
  projectId: string,
  formData: FormData
): Promise<ActionResult<ProjectPayment>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('project_payments')
    .insert({
      project_id: projectId,
      amount: parseFloat(formData.get('amount') as string),
      payment_method: (formData.get('payment_method') as ProjectPaymentMethod) || 'cash',
      payment_type: (formData.get('payment_type') as ProjectPaymentType) || 'installment',
      payment_date: (formData.get('payment_date') as string) || new Date().toISOString().split('T')[0],
      note: (formData.get('note') as string) || null,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true, data }
}

export async function deleteProjectPayment(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: payment } = await supabase
    .from('project_payments').select('project_id').eq('id', id).single()
  const { error } = await supabase.from('project_payments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (payment) {
    revalidatePath(`/projects/${payment.project_id}`)
    revalidatePath('/projects')
  }
  return { success: true }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function addProjectExpense(
  projectId: string,
  formData: FormData
): Promise<ActionResult<ProjectExpense>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('project_expenses')
    .insert({
      project_id: projectId,
      category: formData.get('category') as ProjectExpenseCategory,
      description: (formData.get('description') as string) || null,
      amount: parseFloat(formData.get('amount') as string),
      expense_date: (formData.get('expense_date') as string) || new Date().toISOString().split('T')[0],
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true, data }
}

export async function deleteProjectExpense(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: expense } = await supabase
    .from('project_expenses').select('project_id').eq('id', id).single()
  const { error } = await supabase.from('project_expenses').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (expense) {
    revalidatePath(`/projects/${expense.project_id}`)
    revalidatePath('/projects')
  }
  return { success: true }
}

// ── Employee Assignments ──────────────────────────────────────────────────────

export async function addEmployeeAssignment(
  projectId: string,
  formData: FormData
): Promise<ActionResult<ProjectEmployeeAssignment>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('project_employee_assignments')
    .insert({
      project_id: projectId,
      user_id: formData.get('user_id') as string,
      role_description: (formData.get('role_description') as string) || null,
      amount_paid: parseFloat(formData.get('amount_paid') as string) || 0,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true, data }
}

export async function deleteEmployeeAssignment(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: assignment } = await supabase
    .from('project_employee_assignments').select('project_id').eq('id', id).single()
  const { error } = await supabase.from('project_employee_assignments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (assignment) {
    revalidatePath(`/projects/${assignment.project_id}`)
    revalidatePath('/projects')
  }
  return { success: true }
}
