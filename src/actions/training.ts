'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ActionResult,
  BatchWithStats,
  ExpenseCategory,
  PaymentMethod,
  Student,
  StudentPayment,
  StudentWithPayments,
  TrainingBatch,
  TrainingExpense,
} from '@/types'

async function requireAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  return null
}

// ── Batches ──────────────────────────────────────────────────────────────────

export async function getBatches(): Promise<ActionResult<BatchWithStats[]>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_batches')
    .select(`
      *,
      students ( id, total_fee, discount, status,
        student_payments ( amount )
      ),
      training_expenses ( amount )
    `)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  const batches: BatchWithStats[] = (data ?? []).map((b: any) => {
    const nonDropped = b.students.filter((s: any) => s.status !== 'dropped')
    const total_expected = nonDropped.reduce((sum: number, s: any) => sum + (s.total_fee - s.discount), 0)
    const total_revenue = b.students.reduce(
      (sum: number, s: any) => sum + s.student_payments.reduce((ps: number, p: any) => ps + p.amount, 0), 0
    )
    const total_expenses = b.training_expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
    return {
      ...b,
      student_count: nonDropped.length,
      total_expected,
      total_revenue,
      total_expenses,
      net_profit: total_revenue - total_expenses,
    }
  })

  return { success: true, data: batches }
}

export async function getBatch(id: string): Promise<ActionResult<BatchWithStats>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_batches')
    .select(`
      *,
      students ( id, total_fee, discount, status,
        student_payments ( amount )
      ),
      training_expenses ( amount )
    `)
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }

  const nonDropped = (data as any).students.filter((s: any) => s.status !== 'dropped')
  const total_expected = nonDropped.reduce((sum: number, s: any) => sum + (s.total_fee - s.discount), 0)
  const total_revenue = (data as any).students.reduce(
    (sum: number, s: any) => sum + s.student_payments.reduce((ps: number, p: any) => ps + p.amount, 0), 0
  )
  const total_expenses = (data as any).training_expenses.reduce((sum: number, e: any) => sum + e.amount, 0)

  return {
    success: true,
    data: {
      ...(data as any),
      student_count: nonDropped.length,
      total_expected,
      total_revenue,
      total_expenses,
      net_profit: total_revenue - total_expenses,
    },
  }
}

export async function createBatch(formData: FormData): Promise<ActionResult<TrainingBatch>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('training_batches')
    .insert({
      name: formData.get('name') as string,
      program: formData.get('program') as string,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      fee_per_student: parseFloat(formData.get('fee_per_student') as string) || 0,
      currency: (formData.get('currency') as string) || 'NPR',
      notes: (formData.get('notes') as string) || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/training')
  return { success: true, data }
}

export async function updateBatch(id: string, formData: FormData): Promise<ActionResult<TrainingBatch>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_batches')
    .update({
      name: formData.get('name') as string,
      program: formData.get('program') as string,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      fee_per_student: parseFloat(formData.get('fee_per_student') as string) || 0,
      currency: (formData.get('currency') as string) || 'NPR',
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/training')
  revalidatePath(`/training/${id}`)
  return { success: true, data }
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { error } = await supabase.from('training_batches').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/training')
  return { success: true }
}

// ── Students ──────────────────────────────────────────────────────────────────

export async function getStudents(batchId: string): Promise<ActionResult<StudentWithPayments[]>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*, student_payments(*)')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  const students: StudentWithPayments[] = (data ?? []).map((s: any) => {
    const total_paid = s.student_payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    const effective_fee = s.total_fee - s.discount
    return {
      ...s,
      payments: s.student_payments.sort((a: any, b: any) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ),
      total_paid,
      effective_fee,
      balance: effective_fee - total_paid,
    }
  })

  return { success: true, data: students }
}

export async function getStudent(id: string): Promise<ActionResult<StudentWithPayments>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*, student_payments(*)')
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message }

  const s = data as any
  const total_paid = s.student_payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  const effective_fee = s.total_fee - s.discount
  return {
    success: true,
    data: {
      ...s,
      payments: s.student_payments.sort((a: any, b: any) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ),
      total_paid,
      effective_fee,
      balance: effective_fee - total_paid,
    },
  }
}

export async function createStudent(batchId: string, formData: FormData): Promise<ActionResult<Student>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .insert({
      batch_id: batchId,
      full_name: formData.get('full_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      joining_date: (formData.get('joining_date') as string) || new Date().toISOString().split('T')[0],
      total_fee: parseFloat(formData.get('total_fee') as string) || 0,
      discount: parseFloat(formData.get('discount') as string) || 0,
      payment_type: (formData.get('payment_type') as string) || 'installment',
      notes: (formData.get('notes') as string) || null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/training/${batchId}`)
  revalidatePath('/training')
  return { success: true, data }
}

export async function updateStudent(id: string, formData: FormData): Promise<ActionResult<Student>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('students').select('batch_id').eq('id', id).single()

  const { data, error } = await supabase
    .from('students')
    .update({
      full_name: formData.get('full_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      joining_date: formData.get('joining_date') as string,
      total_fee: parseFloat(formData.get('total_fee') as string) || 0,
      discount: parseFloat(formData.get('discount') as string) || 0,
      payment_type: formData.get('payment_type') as string,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  if (existing) {
    revalidatePath(`/training/${existing.batch_id}`)
    revalidatePath(`/training/${existing.batch_id}/students/${id}`)
    revalidatePath('/training')
  }
  return { success: true, data }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: existing } = await supabase.from('students').select('batch_id').eq('id', id).single()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (existing) revalidatePath(`/training/${existing.batch_id}`)
  revalidatePath('/training')
  return { success: true }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function addPayment(studentId: string, formData: FormData): Promise<ActionResult<StudentPayment>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const { data: student } = await supabase
    .from('students').select('batch_id').eq('id', studentId).single()

  const { data, error } = await supabase
    .from('student_payments')
    .insert({
      student_id: studentId,
      amount: parseFloat(formData.get('amount') as string),
      payment_method: (formData.get('payment_method') as PaymentMethod) || 'cash',
      payment_date: (formData.get('payment_date') as string) || new Date().toISOString().split('T')[0],
      installment_number: formData.get('installment_number')
        ? parseInt(formData.get('installment_number') as string)
        : null,
      note: (formData.get('note') as string) || null,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  if (student) {
    revalidatePath(`/training/${student.batch_id}`)
    revalidatePath(`/training/${student.batch_id}/students/${studentId}`)
    revalidatePath('/training')
  }
  return { success: true, data }
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: payment } = await supabase
    .from('student_payments')
    .select('student_id, students(batch_id)')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('student_payments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  if (payment?.students) {
    const batchId = (payment.students as any).batch_id
    revalidatePath(`/training/${batchId}`)
    revalidatePath(`/training/${batchId}/students/${payment.student_id}`)
    revalidatePath('/training')
  }
  return { success: true }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(batchId: string): Promise<ActionResult<TrainingExpense[]>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_expenses')
    .select('*')
    .eq('batch_id', batchId)
    .order('expense_date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}

export async function addExpense(batchId: string, formData: FormData): Promise<ActionResult<TrainingExpense>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('training_expenses')
    .insert({
      batch_id: batchId,
      category: formData.get('category') as ExpenseCategory,
      description: (formData.get('description') as string) || null,
      amount: parseFloat(formData.get('amount') as string),
      expense_date: (formData.get('expense_date') as string) || new Date().toISOString().split('T')[0],
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/training/${batchId}`)
  revalidatePath('/training')
  return { success: true, data }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: expense } = await supabase
    .from('training_expenses').select('batch_id').eq('id', id).single()
  const { error } = await supabase.from('training_expenses').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (expense) revalidatePath(`/training/${expense.batch_id}`)
  revalidatePath('/training')
  return { success: true }
}
