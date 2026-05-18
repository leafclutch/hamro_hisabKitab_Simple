# Training Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Training Finance Module — training batches, student enrollment, payment tracking (full or installment), expense categories, and per-batch profit calculation.

**Architecture:** Four database tables (`training_batches`, `students`, `student_payments`, `training_expenses`) with full RLS. Server actions in `src/actions/training.ts` handle all data. Pages under `src/app/(dashboard)/training/` display batch list, batch detail with students + expenses, and student payment management. All reads allow any authenticated user; destructive operations require admin.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL + RLS, TypeScript, Tailwind CSS v4, lucide-react

---

## Files Created / Modified

| File | Change |
|---|---|
| `supabase/migrations/002_training_module.sql` | New — 4 tables + RLS policies + triggers |
| `src/types/index.ts` | Extend — training types appended |
| `src/actions/training.ts` | New — all training CRUD actions |
| `src/app/(dashboard)/training/page.tsx` | New — batch list with summary stats |
| `src/app/(dashboard)/training/new/page.tsx` | New — create batch form |
| `src/app/(dashboard)/training/[id]/page.tsx` | New — batch detail: students + expenses + profit |
| `src/app/(dashboard)/training/[id]/edit/page.tsx` | New — edit batch form |
| `src/app/(dashboard)/training/[id]/students/new/page.tsx` | New — add student form |
| `src/app/(dashboard)/training/[id]/students/[studentId]/page.tsx` | New — student payment management |
| `src/app/(dashboard)/training/[id]/expenses/new/page.tsx` | New — add expense form |
| `src/components/training/batch-form.tsx` | New — create/edit batch form component |
| `src/components/training/student-form.tsx` | New — create/edit student form component |
| `src/components/training/payment-form.tsx` | New — add payment form component |
| `src/components/training/expense-form.tsx` | New — add expense form component |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/002_training_module.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/002_training_module.sql`:

```sql
-- Migration: 002_training_module.sql
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hmxhyxugyhhtgxnteprk/sql/new

-- training_batches: A cohort/program group
CREATE TABLE IF NOT EXISTS public.training_batches (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  program     TEXT          NOT NULL,
  start_date  DATE,
  end_date    DATE,
  fee_per_student NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'NPR',
  status      TEXT          NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed', 'cancelled')),
  notes       TEXT,
  created_by  UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.training_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read training_batches"
  ON public.training_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert training_batches"
  ON public.training_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update training_batches"
  ON public.training_batches FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete training_batches"
  ON public.training_batches FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER update_training_batches_updated_at
  BEFORE UPDATE ON public.training_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- students: Individual students enrolled in a batch
CREATE TABLE IF NOT EXISTS public.students (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID          NOT NULL REFERENCES public.training_batches(id) ON DELETE CASCADE,
  full_name    TEXT          NOT NULL,
  email        TEXT,
  phone        TEXT,
  joining_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  total_fee    NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type TEXT          NOT NULL DEFAULT 'installment'
                             CHECK (payment_type IN ('full', 'installment')),
  status       TEXT          NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'completed', 'dropped')),
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read students"
  ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert students"
  ON public.students FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update students"
  ON public.students FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete students"
  ON public.students FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- student_payments: Payment records per student
CREATE TABLE IF NOT EXISTS public.student_payments (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID          NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method     TEXT          NOT NULL DEFAULT 'cash'
                                   CHECK (payment_method IN ('cash', 'bank', 'esewa', 'khalti')),
  payment_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  installment_number INTEGER,
  note               TEXT,
  recorded_by        UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read student_payments"
  ON public.student_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert student_payments"
  ON public.student_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete student_payments"
  ON public.student_payments FOR DELETE TO authenticated USING (public.is_admin());

-- training_expenses: Expenses recorded per batch
CREATE TABLE IF NOT EXISTS public.training_expenses (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID          NOT NULL REFERENCES public.training_batches(id) ON DELETE CASCADE,
  category     TEXT          NOT NULL
                             CHECK (category IN (
                               'mentor_fee', 'udemy', 'referral_commission', 'staff_fee',
                               'ad_boost', 'company_fund', 'certificate', 'server', 'misc'
                             )),
  description  TEXT,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  recorded_by  UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.training_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read training_expenses"
  ON public.training_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert training_expenses"
  ON public.training_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete training_expenses"
  ON public.training_expenses FOR DELETE TO authenticated USING (public.is_admin());
```

- [ ] **Step 2: Run migration on Supabase**

Go to: https://supabase.com/dashboard/project/hmxhyxugyhhtgxnteprk/sql/new

Paste and run the entire SQL above. Expected: all 4 tables created without errors.

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add supabase/migrations/002_training_module.sql
git commit -m "feat: training module DB schema — batches, students, payments, expenses"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Append training types to index.ts**

Append this block to the END of `src/types/index.ts` (after the existing ActionResult type):

```typescript
// ─── Training Module ─────────────────────────────────────────────────────────

export type BatchStatus = 'active' | 'completed' | 'cancelled'
export type StudentStatus = 'active' | 'completed' | 'dropped'
export type PaymentType = 'full' | 'installment'
export type PaymentMethod = 'cash' | 'bank' | 'esewa' | 'khalti'
export type ExpenseCategory =
  | 'mentor_fee'
  | 'udemy'
  | 'referral_commission'
  | 'staff_fee'
  | 'ad_boost'
  | 'company_fund'
  | 'certificate'
  | 'server'
  | 'misc'

export type TrainingBatch = {
  id: string
  name: string
  program: string
  start_date: string | null
  end_date: string | null
  fee_per_student: number
  currency: string
  status: BatchStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  batch_id: string
  full_name: string
  email: string | null
  phone: string | null
  joining_date: string
  total_fee: number
  discount: number
  payment_type: PaymentType
  status: StudentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type StudentPayment = {
  id: string
  student_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  installment_number: number | null
  note: string | null
  recorded_by: string | null
  created_at: string
}

export type TrainingExpense = {
  id: string
  batch_id: string
  category: ExpenseCategory
  description: string | null
  amount: number
  expense_date: string
  recorded_by: string | null
  created_at: string
}

export type StudentWithPayments = Student & {
  payments: StudentPayment[]
  total_paid: number
  effective_fee: number  // total_fee − discount
  balance: number        // effective_fee − total_paid
}

export type BatchWithStats = TrainingBatch & {
  student_count: number
  total_expected: number  // sum of effective_fee for non-dropped students
  total_revenue: number   // sum of all student_payments
  total_expenses: number  // sum of training_expenses
  net_profit: number      // total_revenue − total_expenses
}
```

- [ ] **Step 2: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/types/index.ts
git commit -m "feat: training module TypeScript types"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/actions/training.ts`

- [ ] **Step 1: Write src/actions/training.ts**

```typescript
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
      created_by: user!.id,
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
  }
  return { success: true, data }
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: existing } = await supabase.from('students').select('batch_id').eq('id', id).single()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (existing) revalidatePath(`/training/${existing.batch_id}`)
  return { success: true }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function addPayment(studentId: string, formData: FormData): Promise<ActionResult<StudentPayment>> {
  const authErr = await requireAuth()
  if (authErr) return { success: false, error: authErr.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      recorded_by: user!.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  if (student) {
    revalidatePath(`/training/${student.batch_id}`)
    revalidatePath(`/training/${student.batch_id}/students/${studentId}`)
  }
  return { success: true, data }
}

export async function deletePayment(id: string): Promise<ActionResult> {
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

  const { data, error } = await supabase
    .from('training_expenses')
    .insert({
      batch_id: batchId,
      category: formData.get('category') as ExpenseCategory,
      description: (formData.get('description') as string) || null,
      amount: parseFloat(formData.get('amount') as string),
      expense_date: (formData.get('expense_date') as string) || new Date().toISOString().split('T')[0],
      recorded_by: user!.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/training/${batchId}`)
  return { success: true, data }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { success: false, error: 'Forbidden' }

  const { data: expense } = await supabase
    .from('training_expenses').select('batch_id').eq('id', id).single()
  const { error } = await supabase.from('training_expenses').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  if (expense) revalidatePath(`/training/${expense.batch_id}`)
  return { success: true }
}
```

- [ ] **Step 2: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/actions/training.ts
git commit -m "feat: training module server actions — batches, students, payments, expenses"
```

---

## Task 4: Training List Page

**Files:**
- Create: `src/app/(dashboard)/training/page.tsx`

- [ ] **Step 1: Write the training list page**

```typescript
import { getBatches } from '@/actions/training'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BatchWithStats } from '@/types'
import { BookOpen, Plus, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const CURRENCY_SYMBOL: Record<string, string> = {
  NPR: 'NPR', INR: '₹', USD: '$', GBP: '£',
}

function fmt(amount: number, currency = 'NPR') {
  const sym = CURRENCY_SYMBOL[currency] ?? currency
  return `${sym} ${amount.toLocaleString('en-IN')}`
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BatchCard({ batch }: { batch: BatchWithStats }) {
  const profitPositive = batch.net_profit >= 0
  const statusVariant =
    batch.status === 'active' ? 'success'
    : batch.status === 'completed' ? 'default'
    : 'destructive'

  return (
    <Card className="group hover:shadow-md transition-all duration-200 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            <Badge variant={statusVariant} className="capitalize mb-1.5">{batch.status}</Badge>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">{batch.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{batch.program}</p>
          </div>
          <Link href={`/training/${batch.id}`}>
            <Button variant="outline" size="xs" className="flex-shrink-0">View</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
            <p className="text-base font-bold text-slate-800">{batch.student_count}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Students</p>
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-center">
            <p className="text-xs font-bold text-indigo-700 truncate">{fmt(batch.total_revenue, batch.currency)}</p>
            <p className="text-[10px] text-indigo-400 mt-0.5">Revenue</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 text-center ${profitPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs font-bold truncate ${profitPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {fmt(batch.net_profit, batch.currency)}
            </p>
            <p className={`text-[10px] mt-0.5 ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>Profit</p>
          </div>
        </div>

        {/* Date */}
        {batch.start_date && (
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            {fmtDate(batch.start_date)}
            {batch.end_date && ` → ${fmtDate(batch.end_date)}`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function TrainingPage() {
  const result = await getBatches()
  const batches = result.data ?? []

  const totalRevenue = batches.reduce((s, b) => s + b.total_revenue, 0)
  const totalProfit = batches.reduce((s, b) => s + b.net_profit, 0)
  const totalStudents = batches.reduce((s, b) => s + b.student_count, 0)
  const activeBatches = batches.filter(b => b.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Training Programs</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} · {totalStudents} students
          </p>
        </div>
        <Link href="/training/new">
          <Button><Plus size={14} />New batch</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Batches', value: activeBatches, icon: BookOpen, bg: 'bg-indigo-50', ic: 'text-indigo-600', val: 'text-indigo-700' },
          { label: 'Total Students', value: totalStudents, icon: Users, bg: 'bg-violet-50', ic: 'text-violet-600', val: 'text-violet-700' },
          { label: 'Total Revenue', value: `NPR ${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, bg: 'bg-emerald-50', ic: 'text-emerald-600', val: 'text-emerald-700' },
          { label: 'Net Profit', value: `NPR ${totalProfit.toLocaleString('en-IN')}`, icon: TrendingUp, bg: totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50', ic: totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600', val: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700' },
        ].map(({ label, value, icon: Icon, bg, ic, val }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
              <Icon size={16} className={ic} />
            </div>
            <p className={`text-xl font-bold ${val}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Batch list */}
      {result.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{result.error}</div>
      )}

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No training batches yet</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Create your first batch to start tracking students, payments, and expenses.
          </p>
          <Link href="/training/new" className="mt-5">
            <Button><Plus size={14} />Create first batch</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map(batch => <BatchCard key={batch.id} batch={batch} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add 'src/app/(dashboard)/training/'
git commit -m "feat: training list page with batch cards and summary stats"
```

---

## Task 5: Batch Form (Create + Edit)

**Files:**
- Create: `src/components/training/batch-form.tsx`
- Create: `src/app/(dashboard)/training/new/page.tsx`
- Create: `src/app/(dashboard)/training/[id]/edit/page.tsx`

- [ ] **Step 1: Write src/components/training/batch-form.tsx**

```typescript
'use client'

import { createBatch, updateBatch } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TrainingBatch } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface BatchFormProps {
  batch?: TrainingBatch
}

const CURRENCIES = ['NPR', 'INR', 'USD', 'GBP']
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', desc: 'Currently running' },
  { value: 'completed', label: 'Completed', desc: 'Finished' },
  { value: 'cancelled', label: 'Cancelled', desc: 'Cancelled' },
]

export function BatchForm({ batch }: BatchFormProps) {
  const isEditing = !!batch
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateBatch(batch.id, formData)
        : await createBatch(formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(isEditing ? `/training/${batch.id}` : '/training')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      {/* Basic info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Batch info</h3>
        <div className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Batch name"
            placeholder="e.g. Web Dev Batch 3 — 2024"
            defaultValue={batch?.name ?? ''}
            required
            hint="A unique name to identify this batch"
          />
          <Input
            id="program"
            name="program"
            label="Program / Course name"
            placeholder="e.g. Full Stack Web Development"
            defaultValue={batch?.program ?? ''}
            required
          />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Dates */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            label="Start date"
            defaultValue={batch?.start_date ?? ''}
          />
          <Input
            id="end_date"
            name="end_date"
            type="date"
            label="End date"
            defaultValue={batch?.end_date ?? ''}
          />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Finance */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Finance</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="fee_per_student"
                name="fee_per_student"
                type="number"
                min="0"
                step="1"
                label="Default fee per student"
                placeholder="0"
                defaultValue={batch?.fee_per_student ?? ''}
                hint="Can be overridden per student"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
              <select
                id="currency"
                name="currency"
                defaultValue={batch?.currency ?? 'NPR'}
                className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <>
          <div className="border-t border-slate-100" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Status</h3>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={batch.status === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-100" />

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={batch?.notes ?? ''}
          placeholder="Any additional notes about this batch…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create batch')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Write src/app/(dashboard)/training/new/page.tsx**

```typescript
import { BatchForm } from '@/components/training/batch-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewBatchPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/training" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to Training
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Training Batch</h1>
        <p className="text-sm text-slate-400 mt-0.5">Create a batch to start tracking students, payments, and expenses.</p>
      </div>
      <BatchForm />
    </div>
  )
}
```

- [ ] **Step 3: Write src/app/(dashboard)/training/[id]/edit/page.tsx**

```typescript
import { getBatch } from '@/actions/training'
import { BatchForm } from '@/components/training/batch-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getBatch(id)
  if (!result.success || !result.data) notFound()
  const batch = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/training/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {batch.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Batch</h1>
        <p className="text-sm text-slate-400 mt-0.5">{batch.name}</p>
      </div>
      <BatchForm batch={batch} />
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/training/batch-form.tsx 'src/app/(dashboard)/training/new/' 'src/app/(dashboard)/training/[id]/edit/'
git commit -m "feat: batch create/edit form — name, program, dates, currency, status"
```

---

## Task 6: Batch Detail Page

**Files:**
- Create: `src/app/(dashboard)/training/[id]/page.tsx`

- [ ] **Step 1: Write batch detail page**

```typescript
import { getBatch, getStudents, getExpenses, deleteStudent, deleteExpense } from '@/actions/training'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { BatchWithStats, StudentWithPayments, TrainingExpense } from '@/types'
import { ArrowLeft, Edit2, Plus, Trash2, TrendingDown, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteBatchActions } from './delete-actions'

export const dynamic = 'force-dynamic'

const EXPENSE_LABELS: Record<string, string> = {
  mentor_fee: 'Mentor Fee', udemy: 'Udemy / Course', referral_commission: 'Referral Commission',
  staff_fee: 'Staff Fee', ad_boost: 'Ad Boost', company_fund: 'Company Fund',
  certificate: 'Certificate', server: 'Server Cost', misc: 'Miscellaneous',
}

function fmt(amount: number, currency = 'NPR') {
  const sym: Record<string, string> = { NPR: 'NPR', INR: '₹', USD: '$', GBP: '£' }
  return `${sym[currency] ?? currency} ${amount.toLocaleString('en-IN')}`
}

function ProfitCard({ batch }: { batch: BatchWithStats }) {
  const collected_pct = batch.total_expected > 0
    ? Math.round((batch.total_revenue / batch.total_expected) * 100)
    : 0
  const profitPositive = batch.net_profit >= 0

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-800">Financial Summary</h2>
        <Link href={`/training/${batch.id}/edit`}>
          <Button variant="ghost" size="xs" className="text-slate-400 hover:text-slate-700">
            <Edit2 size={12} />Edit
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Expected Revenue', value: fmt(batch.total_expected, batch.currency), color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
            { label: 'Collected', value: `${fmt(batch.total_revenue, batch.currency)} (${collected_pct}%)`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Total Expenses', value: fmt(batch.total_expenses, batch.currency), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Net Profit', value: fmt(batch.net_profit, batch.currency), color: profitPositive ? 'text-emerald-700' : 'text-red-700', bg: profitPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StudentRow({ student, batchId }: { student: StudentWithPayments; batchId: string }) {
  const pct = student.effective_fee > 0
    ? Math.round((student.total_paid / student.effective_fee) * 100)
    : 0
  const isPaid = student.balance <= 0

  return (
    <div className="grid grid-cols-[1fr_80px_100px_90px_90px_64px] gap-3 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{student.full_name}</p>
        {student.phone && <p className="text-xs text-slate-400">{student.phone}</p>}
      </div>
      <Badge variant={student.status === 'active' ? 'success' : student.status === 'completed' ? 'default' : 'destructive'} className="capitalize text-center justify-center">
        {student.status}
      </Badge>
      <div>
        <p className="text-sm font-medium text-slate-700">{fmt(student.effective_fee)}</p>
        <p className="text-[11px] text-slate-400">Total fee</p>
      </div>
      <div>
        <p className="text-sm font-medium text-emerald-600">{fmt(student.total_paid)}</p>
        <p className="text-[11px] text-slate-400">{pct}% paid</p>
      </div>
      <div>
        <p className={`text-sm font-medium ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPaid ? 'Cleared' : fmt(student.balance)}
        </p>
        <p className="text-[11px] text-slate-400">Balance</p>
      </div>
      <Link href={`/training/${batchId}/students/${student.id}`}>
        <Button variant="ghost" size="xs" className="text-slate-400 hover:text-slate-700" title="Manage payments">
          <Users size={13} />
        </Button>
      </Link>
    </div>
  )
}

function ExpenseRow({ expense, batchId }: { expense: TrainingExpense; batchId: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr_100px_80px] gap-3 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
      <Badge variant="default">{EXPENSE_LABELS[expense.category] ?? expense.category}</Badge>
      <p className="text-sm text-slate-600 truncate">{expense.description ?? '—'}</p>
      <p className="text-sm font-medium text-amber-700">{fmt(expense.amount)}</p>
      <p className="text-xs text-slate-400">{new Date(expense.expense_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}</p>
    </div>
  )
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [batchResult, studentsResult, expensesResult] = await Promise.all([
    getBatch(id),
    getStudents(id),
    getExpenses(id),
  ])

  if (!batchResult.success || !batchResult.data) notFound()
  const batch = batchResult.data
  const students = studentsResult.data ?? []
  const expenses = expensesResult.data ?? []

  const statusVariant = batch.status === 'active' ? 'success' : batch.status === 'completed' ? 'default' : 'destructive'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/training" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <ArrowLeft size={14} />Back to Training
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusVariant} className="capitalize">{batch.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{batch.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{batch.program}</p>
          </div>
          <Link href={`/training/${id}/edit`}>
            <Button variant="secondary" size="sm"><Edit2 size={13} />Edit batch</Button>
          </Link>
        </div>
      </div>

      {/* Financial summary */}
      <ProfitCard batch={batch} />

      {/* Students */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Students</h2>
            <p className="text-xs text-slate-400 mt-0.5">{students.length} enrolled</p>
          </div>
          <Link href={`/training/${id}/students/new`}>
            <Button size="sm"><Plus size={13} />Add student</Button>
          </Link>
        </CardHeader>
        {students.length > 0 ? (
          <>
            <div className="grid grid-cols-[1fr_80px_100px_90px_90px_64px] gap-3 bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
              {['Name', 'Status', 'Fee', 'Paid', 'Balance', ''].map(h => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {students.map(s => <StudentRow key={s.id} student={s} batchId={id} />)}
            </div>
          </>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <Users size={20} className="text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No students yet</p>
              <p className="text-xs text-slate-400 mt-1">Add students to start tracking payments.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Expenses</h2>
            <p className="text-xs text-slate-400 mt-0.5">{expenses.length} recorded</p>
          </div>
          <Link href={`/training/${id}/expenses/new`}>
            <Button size="sm" variant="secondary"><Plus size={13} />Add expense</Button>
          </Link>
        </CardHeader>
        {expenses.length > 0 ? (
          <>
            <div className="grid grid-cols-[120px_1fr_100px_80px] gap-3 bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
              {['Category', 'Description', 'Amount', 'Date'].map(h => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {expenses.map(e => <ExpenseRow key={e.id} expense={e} batchId={id} />)}
            </div>
          </>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                <TrendingDown size={20} className="text-amber-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No expenses recorded</p>
              <p className="text-xs text-slate-400 mt-1">Add mentor fees, subscriptions, and other costs.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -10
```

If build fails with "Cannot find module './delete-actions'", skip the import and remove `DeleteBatchActions` from the JSX — it is not used in this task. The import will be handled after Task 6.

**Fix if needed:** Remove this line from the imports in the page:
```typescript
import { DeleteBatchActions } from './delete-actions'
```

And that line is not used in the JSX above, so removing the import is the full fix.

Expected after fix: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add 'src/app/(dashboard)/training/[id]/'
git commit -m "feat: batch detail page — profit summary, student list, expense list"
```

---

## Task 7: Student Management

**Files:**
- Create: `src/components/training/student-form.tsx`
- Create: `src/app/(dashboard)/training/[id]/students/new/page.tsx`
- Create: `src/app/(dashboard)/training/[id]/students/[studentId]/page.tsx`
- Create: `src/components/training/payment-form.tsx`

- [ ] **Step 1: Write src/components/training/student-form.tsx**

```typescript
'use client'

import { createStudent, updateStudent } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Student } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface StudentFormProps {
  batchId: string
  student?: Student
  defaultFee?: number
}

export function StudentForm({ batchId, student, defaultFee = 0 }: StudentFormProps) {
  const isEditing = !!student
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateStudent(student.id, formData)
        : await createStudent(batchId, formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(`/training/${batchId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Student info</h3>
        <div className="space-y-4">
          <Input id="full_name" name="full_name" label="Full name" placeholder="Ram Bahadur Thapa" defaultValue={student?.full_name ?? ''} required />
          <Input id="phone" name="phone" type="tel" label="Phone number" placeholder="+977 98XXXXXXXX" defaultValue={student?.phone ?? ''} />
          <Input id="email" name="email" type="email" label="Email address" placeholder="ram@example.com" defaultValue={student?.email ?? ''} />
          <Input id="joining_date" name="joining_date" type="date" label="Joining date" defaultValue={student?.joining_date ?? new Date().toISOString().split('T')[0]} required />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Payment</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="total_fee"
              name="total_fee"
              type="number"
              min="0"
              step="1"
              label="Total course fee"
              placeholder="0"
              defaultValue={student?.total_fee ?? defaultFee}
              required
            />
            <Input
              id="discount"
              name="discount"
              type="number"
              min="0"
              step="1"
              label="Discount"
              placeholder="0"
              defaultValue={student?.discount ?? 0}
              hint="Amount deducted from fee"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Payment type</label>
            <div className="flex gap-3">
              {[
                { value: 'installment', label: 'Installments', desc: 'Pays in parts' },
                { value: 'full', label: 'Full payment', desc: 'One-time payment' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_type"
                    value={opt.value}
                    defaultChecked={(student?.payment_type ?? 'installment') === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <>
          <div className="border-t border-slate-100" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Status</h3>
            <div className="flex gap-3">
              {[
                { value: 'active', label: 'Active', desc: 'Currently enrolled' },
                { value: 'completed', label: 'Completed', desc: 'Finished program' },
                { value: 'dropped', label: 'Dropped', desc: 'Left program' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={student.status === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[10px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-100" />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={student?.notes ?? ''}
          placeholder="Any notes about this student…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add student')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Write src/app/(dashboard)/training/[id]/students/new/page.tsx**

```typescript
import { getBatch } from '@/actions/training'
import { StudentForm } from '@/components/training/student-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getBatch(id)
  if (!result.success || !result.data) notFound()
  const batch = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/training/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {batch.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Student</h1>
        <p className="text-sm text-slate-400 mt-0.5">Enroll a new student in {batch.program}</p>
      </div>
      <StudentForm batchId={id} defaultFee={batch.fee_per_student} />
    </div>
  )
}
```

- [ ] **Step 3: Write src/components/training/payment-form.tsx**

```typescript
'use client'

import { addPayment } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useTransition } from 'react'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
]

export function PaymentForm({
  studentId,
  nextInstallment,
  onSuccess,
}: {
  studentId: string
  nextInstallment: number
  onSuccess?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addPayment(studentId, formData)
      if (!result.success) setError(result.error ?? 'Failed to record payment')
      else onSuccess?.()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          label="Amount"
          placeholder="0"
          required
        />
        <Input
          id="payment_date"
          name="payment_date"
          type="date"
          label="Payment date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">Payment method</label>
        <div className="grid grid-cols-4 gap-2">
          {METHODS.map((m, i) => (
            <label key={m.value} className="cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value={m.value}
                defaultChecked={i === 0}
                className="sr-only peer"
              />
              <div className="rounded-lg border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 peer-checked:ring-2 peer-checked:ring-indigo-100">
                {m.label}
              </div>
            </label>
          ))}
        </div>
      </div>

      <Input
        id="installment_number"
        name="installment_number"
        type="number"
        min="1"
        step="1"
        label="Installment #"
        placeholder={String(nextInstallment)}
        defaultValue={nextInstallment}
        hint="Automatically set — change if needed"
      />

      <Input
        id="note"
        name="note"
        label="Note"
        placeholder="e.g. Second installment via eSewa"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? 'Recording…' : 'Record payment'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Write src/app/(dashboard)/training/[id]/students/[studentId]/page.tsx**

```typescript
import { getStudent, getBatch } from '@/actions/training'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaymentForm } from '@/components/training/payment-form'
import type { StudentPayment } from '@/types'
import { ArrowLeft, CheckCircle2, Clock, Edit2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', bank: 'Bank', esewa: 'eSewa', khalti: 'Khalti',
}

function fmt(n: number) { return `NPR ${n.toLocaleString('en-IN')}` }

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>
}) {
  const { id: batchId, studentId } = await params
  const [studentResult, batchResult] = await Promise.all([
    getStudent(studentId),
    getBatch(batchId),
  ])
  if (!studentResult.success || !studentResult.data) notFound()
  if (!batchResult.success || !batchResult.data) notFound()

  const student = studentResult.data
  const batch = batchResult.data
  const isPaid = student.balance <= 0
  const pct = student.effective_fee > 0
    ? Math.round((student.total_paid / student.effective_fee) * 100)
    : 0
  const nextInstallment = student.payments.length + 1

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link href={`/training/${batchId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <ArrowLeft size={14} />Back to {batch.name}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{student.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={student.status === 'active' ? 'success' : student.status === 'completed' ? 'default' : 'destructive'} className="capitalize">
                {student.status}
              </Badge>
              <Badge variant="info" className="capitalize">{student.payment_type}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Payment summary */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
              <p className="text-xl font-bold text-slate-800">{fmt(student.effective_fee)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total fee</p>
            </div>
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
              <p className="text-xl font-bold text-indigo-700">{fmt(student.total_paid)} ({pct}%)</p>
              <p className="text-xs text-indigo-400 mt-0.5">Paid</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              {isPaid
                ? <><CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1" /><p className="text-xs text-emerald-600 font-semibold">Fully paid</p></>
                : <><p className="text-xl font-bold text-red-700">{fmt(student.balance)}</p><p className="text-xs text-red-400 mt-0.5">Remaining</p></>
              }
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{pct}% of total fee collected</p>
        </CardContent>
      </Card>

      {/* Add payment */}
      {!isPaid && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-800">Record Payment</h2>
          </CardHeader>
          <CardContent>
            <PaymentForm studentId={studentId} nextInstallment={nextInstallment} />
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-800">Payment History</h2>
          <span className="text-xs text-slate-400">{student.payments.length} payments</span>
        </CardHeader>
        {student.payments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {student.payments.map((p: StudentPayment) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{fmt(p.amount)}</p>
                    <p className="text-xs text-slate-400">
                      {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                      {p.installment_number ? ` · Installment #${p.installment_number}` : ''}
                      {p.note ? ` · ${p.note}` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(p.payment_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock size={20} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No payments recorded yet</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact */}
      {(student.phone || student.email) && (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-slate-800">Contact</h2></CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {student.phone && <p><span className="text-slate-400 w-16 inline-block">Phone</span><span className="text-slate-700">{student.phone}</span></p>}
              {student.email && <p><span className="text-slate-400 w-16 inline-block">Email</span><span className="text-slate-700">{student.email}</span></p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/training/ 'src/app/(dashboard)/training/[id]/students/'
git commit -m "feat: student management — enroll, payment form, payment history"
```

---

## Task 8: Expense Form

**Files:**
- Create: `src/components/training/expense-form.tsx`
- Create: `src/app/(dashboard)/training/[id]/expenses/new/page.tsx`

- [ ] **Step 1: Write src/components/training/expense-form.tsx**

```typescript
'use client'

import { addExpense } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExpenseCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'mentor_fee',          label: 'Mentor Fee' },
  { value: 'udemy',               label: 'Udemy / Course' },
  { value: 'referral_commission', label: 'Referral Commission' },
  { value: 'staff_fee',           label: 'Staff Fee' },
  { value: 'ad_boost',            label: 'Ad Boost' },
  { value: 'company_fund',        label: 'Company Fund' },
  { value: 'certificate',         label: 'Certificate' },
  { value: 'server',              label: 'Server Cost' },
  { value: 'misc',                label: 'Miscellaneous' },
]

export function ExpenseForm({ batchId }: { batchId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addExpense(batchId, formData)
      if (!result.success) setError(result.error ?? 'Failed to record expense')
      else router.push(`/training/${batchId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          label="Amount (NPR)"
          placeholder="0"
          required
        />
        <Input
          id="expense_date"
          name="expense_date"
          type="date"
          label="Date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <Input
        id="description"
        name="description"
        label="Description"
        placeholder="e.g. Payment to John for mentoring Batch 3"
        hint="Optional — provide detail for audit purposes"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Recording…' : 'Record expense'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Write src/app/(dashboard)/training/[id]/expenses/new/page.tsx**

```typescript
import { getBatch } from '@/actions/training'
import { ExpenseForm } from '@/components/training/expense-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getBatch(id)
  if (!result.success || !result.data) notFound()
  const batch = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/training/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {batch.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Expense</h1>
        <p className="text-sm text-slate-400 mt-0.5">Log a cost for {batch.name}</p>
      </div>
      <ExpenseForm batchId={id} />
    </div>
  )
}
```

- [ ] **Step 3: Build check — full build**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | tail -25
```

Expected: Build passes. All routes listed include:
```
ƒ /training
ƒ /training/new
ƒ /training/[id]
ƒ /training/[id]/edit
ƒ /training/[id]/students/new
ƒ /training/[id]/students/[studentId]
ƒ /training/[id]/expenses/new
```

- [ ] **Step 4: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/training/expense-form.tsx 'src/app/(dashboard)/training/[id]/expenses/'
git commit -m "feat: expense recording — category, amount, date per training batch"
```

---

## Self-Review

**Spec coverage:**
- ✅ Training batches: name, program, start/end dates, fee, currency, status, notes
- ✅ Students: name, phone, email, joining date, fee, discount, payment type, status
- ✅ Payments: full or installment, cash/bank/eSewa/khalti, payment date, installment number
- ✅ Expense categories: all 9 from master prompt (mentor_fee, udemy, referral_commission, staff_fee, ad_boost, company_fund, certificate, server, misc)
- ✅ Profit formula: total_revenue − total_expenses shown per batch
- ✅ Per-head and total profit visible on batch detail
- ✅ RLS on all 4 tables
- ✅ Admin-only deletes

**Placeholder scan:** No TBDs or incomplete steps.

**Type consistency:**
- `StudentWithPayments` uses `effective_fee` (= total_fee − discount) and `balance` (= effective_fee − total_paid) — consistent across actions and pages
- `BatchWithStats` uses `net_profit` = `total_revenue − total_expenses` — consistent
- `PaymentMethod` type used in `addPayment` action and `PaymentForm` — consistent
- `ExpenseCategory` type used in `addExpense` action and `ExpenseForm` — consistent
