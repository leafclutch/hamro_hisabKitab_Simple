# Client Projects Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Client Project Finance Module — project tracking, client info, payment receipts, expense categories, employee cost assignments, and per-project net profit calculation.

**Architecture:** Four database tables (`projects`, `project_payments`, `project_expenses`, `project_employee_assignments`) with full RLS, mirroring the training module exactly. Server actions in `src/actions/projects.ts`. Pages under `src/app/(dashboard)/projects/`. Net profit = total received − (total expenses + total employee costs). All authenticated users can read/write; admin-only for destructive deletes.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL + RLS, TypeScript, Tailwind CSS v4, lucide-react

---

## Files Created / Modified

| File | Change |
|---|---|
| `supabase/migrations/003_projects_module.sql` | New — 4 tables + RLS + indexes + trigger |
| `src/types/index.ts` | Extend — projects types appended |
| `src/actions/projects.ts` | New — all project CRUD actions |
| `src/app/(dashboard)/projects/page.tsx` | New — project list with summary stats |
| `src/app/(dashboard)/projects/new/page.tsx` | New — create project page |
| `src/app/(dashboard)/projects/[id]/page.tsx` | New — project detail: payments + expenses + assignments |
| `src/app/(dashboard)/projects/[id]/edit/page.tsx` | New — edit project page |
| `src/app/(dashboard)/projects/[id]/payments/new/page.tsx` | New — add payment page |
| `src/app/(dashboard)/projects/[id]/expenses/new/page.tsx` | New — add expense page |
| `src/app/(dashboard)/projects/[id]/assignments/new/page.tsx` | New — assign employee page |
| `src/components/projects/project-form.tsx` | New — create/edit project form |
| `src/components/projects/payment-form.tsx` | New — record payment form |
| `src/components/projects/expense-form.tsx` | New — record expense form |
| `src/components/projects/assignment-form.tsx` | New — assign employee form |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/003_projects_module.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/003_projects_module.sql` with the full content below:

```sql
-- Migration: 003_projects_module.sql
-- Run this in Supabase SQL Editor

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL,
  client_name    TEXT          NOT NULL,
  client_email   TEXT,
  client_phone   TEXT,
  contract_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency       TEXT          NOT NULL DEFAULT 'NPR',
  start_date     DATE,
  deadline       DATE,
  status         TEXT          NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'completed', 'cancelled')),
  notes          TEXT,
  created_by     UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_payments (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  payment_method TEXT          NOT NULL DEFAULT 'cash'
                               CHECK (payment_method IN ('cash', 'bank', 'esewa', 'khalti')),
  payment_type   TEXT          NOT NULL DEFAULT 'installment'
                               CHECK (payment_type IN ('advance', 'installment', 'final')),
  payment_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  note           TEXT,
  recorded_by    UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_expenses (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category       TEXT          NOT NULL
                               CHECK (category IN (
                                 'subscription', 'hosting', 'api_cost', 'referral_commission',
                                 'company_fund', 'my_commission', 'partner_commission',
                                 'lunch', 'office_rent', 'utilities', 'misc'
                               )),
  description    TEXT,
  amount         NUMERIC(12,2) NOT NULL,
  expense_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  recorded_by    UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_employee_assignments (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role_description TEXT,
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by       UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.projects                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_employee_assignments ENABLE ROW LEVEL SECURITY;

-- projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- project_payments (append-only — no UPDATE policy)
CREATE POLICY "project_payments_select" ON public.project_payments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_payments_insert" ON public.project_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- project_expenses (append-only — no UPDATE policy)
CREATE POLICY "project_expenses_select" ON public.project_expenses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_expenses_insert" ON public.project_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- project_employee_assignments (append-only — no UPDATE policy)
CREATE POLICY "project_employee_assignments_select" ON public.project_employee_assignments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_employee_assignments_insert" ON public.project_employee_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_status                        ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_payments_project_id            ON public.project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_payment_date          ON public.project_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id            ON public.project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_date          ON public.project_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_project_employee_assignments_project   ON public.project_employee_assignments(project_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

-- Reuse existing function if already created by training module migration
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: Verify the file was written correctly**

```bash
wc -l supabase/migrations/003_projects_module.sql
```

Expected: ~80 lines

- [ ] **Step 3: Run the migration on Supabase**

Copy the file contents and run it in the Supabase SQL editor for project `hmxhyxugyhhtgxnteprk`.

After running, verify in the Supabase Table Editor that 4 new tables appear:
- `projects`
- `project_payments`
- `project_expenses`
- `project_employee_assignments`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/003_projects_module.sql
git commit -m "feat: add projects module database migration"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts` (append after the training types section)

- [ ] **Step 1: Append the projects types to `src/types/index.ts`**

Add this block at the end of the file (after the `BatchWithStats` type):

```typescript
// ─── Projects Module ──────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'completed' | 'cancelled'
export type ProjectPaymentMethod = 'cash' | 'bank' | 'esewa' | 'khalti'
export type ProjectPaymentType = 'advance' | 'installment' | 'final'
export type ProjectExpenseCategory =
  | 'subscription'
  | 'hosting'
  | 'api_cost'
  | 'referral_commission'
  | 'company_fund'
  | 'my_commission'
  | 'partner_commission'
  | 'lunch'
  | 'office_rent'
  | 'utilities'
  | 'misc'

export type Project = {
  id: string
  name: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  contract_value: number
  currency: string
  start_date: string | null
  deadline: string | null
  status: ProjectStatus
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type ProjectPayment = {
  id: string
  project_id: string
  amount: number
  payment_method: ProjectPaymentMethod
  payment_type: ProjectPaymentType
  payment_date: string
  note: string | null
  recorded_by: string
  created_at: string
}

export type ProjectExpense = {
  id: string
  project_id: string
  category: ProjectExpenseCategory
  description: string | null
  amount: number
  expense_date: string
  recorded_by: string
  created_at: string
}

export type ProjectEmployeeAssignment = {
  id: string
  project_id: string
  user_id: string
  role_description: string | null
  amount_paid: number
  created_by: string
  created_at: string
  full_name?: string
}

export type ProjectWithStats = Project & {
  payment_count: number
  total_received: number
  total_expenses: number
  total_employee_costs: number
  net_profit: number
  payments: ProjectPayment[]
  expenses: ProjectExpense[]
  assignments: ProjectEmployeeAssignment[]
}
```

- [ ] **Step 2: Run the TypeScript compiler to verify no type errors**

```bash
npx tsc --noEmit
```

Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add projects module TypeScript types"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/actions/projects.ts`

- [ ] **Step 1: Create `src/actions/projects.ts`**

```typescript
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/actions/projects.ts
git commit -m "feat: add projects module server actions"
```

---

## Task 4: Projects List Page

**Files:**
- Create: `src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Create the projects list page**

Create `src/app/(dashboard)/projects/page.tsx`:

```typescript
import { getProjects } from '@/actions/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProjectWithStats } from '@/types'
import { Briefcase, Plus, TrendingUp, Wallet } from 'lucide-react'
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

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const profitPositive = project.net_profit >= 0
  const receivedPct = project.contract_value > 0
    ? Math.min(Math.round((project.total_received / project.contract_value) * 100), 100)
    : 0
  const statusVariant =
    project.status === 'active' ? 'success'
    : project.status === 'completed' ? 'default'
    : 'destructive'

  return (
    <Card className="group hover:shadow-md transition-all duration-200 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <Badge variant={statusVariant} className="capitalize mb-1.5">{project.status}</Badge>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">{project.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{project.client_name}</p>
          </div>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="xs" className="flex-shrink-0">View</Button>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Received</span>
            <span>{receivedPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${receivedPct}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
            <p className="text-xs font-bold text-slate-700 truncate">{fmt(project.contract_value, project.currency)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Contract</p>
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-center">
            <p className="text-xs font-bold text-indigo-700 truncate">{fmt(project.total_received, project.currency)}</p>
            <p className="text-[10px] text-indigo-400 mt-0.5">Received</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 text-center ${profitPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs font-bold truncate ${profitPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {fmt(project.net_profit, project.currency)}
            </p>
            <p className={`text-[10px] mt-0.5 ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>Profit</p>
          </div>
        </div>

        {/* Deadline */}
        {project.deadline && (
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Deadline: {fmtDate(project.deadline)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function ProjectsPage() {
  const result = await getProjects()
  const projects = result.data ?? []

  const totalContract = projects.reduce((s, p) => s + p.contract_value, 0)
  const totalReceived = projects.reduce((s, p) => s + p.total_received, 0)
  const totalProfit = projects.reduce((s, p) => s + p.net_profit, 0)
  const activeProjects = projects.filter(p => p.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects} active
          </p>
        </div>
        <Link href="/projects/new">
          <Button><Plus size={14} />New project</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects, icon: Briefcase, bg: 'bg-indigo-50', ic: 'text-indigo-600', val: 'text-indigo-700' },
          { label: 'Total Contract', value: `NPR ${totalContract.toLocaleString('en-IN')}`, icon: Wallet, bg: 'bg-violet-50', ic: 'text-violet-600', val: 'text-violet-700' },
          { label: 'Total Received', value: `NPR ${totalReceived.toLocaleString('en-IN')}`, icon: TrendingUp, bg: 'bg-emerald-50', ic: 'text-emerald-600', val: 'text-emerald-700' },
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

      {/* Error */}
      {result.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{result.error}</div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Briefcase size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No projects yet</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Create your first project to start tracking client payments and expenses.
          </p>
          <Link href="/projects/new" className="mt-5">
            <Button><Plus size={14} />Create first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Verify in the browser**

Start the dev server if not running:
```bash
npm run dev
```

Visit `http://localhost:3000/projects` — you should see:
- Page header "Client Projects" with "New project" button
- 4 summary stat tiles (Active Projects, Total Contract, Total Received, Net Profit)
- Empty state with "No projects yet" message and call-to-action

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/projects/page.tsx
git commit -m "feat: add projects list page"
```

---

## Task 5: Project Form + New/Edit Pages

**Files:**
- Create: `src/components/projects/project-form.tsx`
- Create: `src/app/(dashboard)/projects/new/page.tsx`
- Create: `src/app/(dashboard)/projects/[id]/edit/page.tsx`

- [ ] **Step 1: Create the project form component**

Create `src/components/projects/project-form.tsx`:

```typescript
'use client'

import { createProject, updateProject } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface ProjectFormProps {
  project?: Project
}

const CURRENCIES = ['NPR', 'INR', 'USD', 'GBP']
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', desc: 'In progress' },
  { value: 'completed', label: 'Completed', desc: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled', desc: 'Cancelled' },
]

export function ProjectForm({ project }: ProjectFormProps) {
  const isEditing = !!project
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateProject(project.id, formData)
        : await createProject(formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(isEditing ? `/projects/${project.id}` : '/projects')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      {/* Project info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Project info</h3>
        <div className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Project name"
            placeholder="e.g. E-commerce Website Redesign"
            defaultValue={project?.name ?? ''}
            required
          />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Client info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Client</h3>
        <div className="space-y-4">
          <Input
            id="client_name"
            name="client_name"
            label="Client name"
            placeholder="e.g. Sharma Enterprises"
            defaultValue={project?.client_name ?? ''}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="client_email"
              name="client_email"
              type="email"
              label="Email"
              placeholder="client@example.com"
              defaultValue={project?.client_email ?? ''}
            />
            <Input
              id="client_phone"
              name="client_phone"
              label="Phone"
              placeholder="+977 98XXXXXXXX"
              defaultValue={project?.client_phone ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Finance */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Contract value</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="contract_value"
              name="contract_value"
              type="number"
              min="0"
              step="1"
              label="Contract value"
              placeholder="0"
              defaultValue={project?.contract_value ?? ''}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
            <select
              id="currency"
              name="currency"
              defaultValue={project?.currency ?? 'NPR'}
              className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Schedule */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            label="Start date"
            defaultValue={project?.start_date ?? ''}
          />
          <Input
            id="deadline"
            name="deadline"
            type="date"
            label="Deadline"
            defaultValue={project?.deadline ?? ''}
          />
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
                    defaultChecked={project.status === opt.value}
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
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={project?.notes ?? ''}
          placeholder="Scope, deliverables, or any relevant context…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create project')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create the new project page**

Create `src/app/(dashboard)/projects/new/page.tsx`:

```typescript
import { ProjectForm } from '@/components/projects/project-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Project</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track a client project, its payments, and costs.</p>
      </div>
      <ProjectForm />
    </div>
  )
}
```

- [ ] **Step 3: Create the edit project page**

Create `src/app/(dashboard)/projects/[id]/edit/page.tsx`:

```typescript
import { getProject } from '@/actions/projects'
import { ProjectForm } from '@/components/projects/project-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success || !result.data) notFound()
  const project = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Project</h1>
        <p className="text-sm text-slate-400 mt-0.5">{project.name}</p>
      </div>
      <ProjectForm project={project} />
    </div>
  )
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 5: Verify in the browser**

Visit `http://localhost:3000/projects/new` — you should see the project form with all fields:
- Project name (required)
- Client name (required), client email, client phone
- Contract value + currency selector
- Start date + deadline
- Notes
- "Create project" + "Cancel" buttons

Submit a test project. You should be redirected to `/projects` and see the new card.

- [ ] **Step 6: Commit**

```bash
git add src/components/projects/project-form.tsx src/app/\(dashboard\)/projects/new/page.tsx src/app/\(dashboard\)/projects/\[id\]/edit/page.tsx
git commit -m "feat: add project form with create/edit pages"
```

---

## Task 6: Project Detail Page

**Files:**
- Create: `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Create the project detail page**

Create `src/app/(dashboard)/projects/[id]/page.tsx`:

```typescript
import { getProject } from '@/actions/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ProjectEmployeeAssignment, ProjectExpense, ProjectPayment } from '@/types'
import { ArrowLeft, Edit2, Plus, TrendingDown, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const EXPENSE_LABELS: Record<string, string> = {
  subscription: 'Subscription', hosting: 'Hosting', api_cost: 'API Cost',
  referral_commission: 'Referral Commission', company_fund: 'Company Fund',
  my_commission: 'My Commission', partner_commission: 'Partner Commission',
  lunch: 'Lunch', office_rent: 'Office Rent', utilities: 'Utilities', misc: 'Miscellaneous',
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  advance: 'Advance', installment: 'Installment', final: 'Final',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', bank: 'Bank', esewa: 'eSewa', khalti: 'Khalti',
}

function fmt(amount: number, currency = 'NPR') {
  const sym: Record<string, string> = { NPR: 'NPR', INR: '₹', USD: '$', GBP: '£' }
  return `${sym[currency] ?? currency} ${amount.toLocaleString('en-IN')}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success || !result.data) notFound()
  const project = result.data

  const profitPositive = project.net_profit >= 0
  const receivedPct = project.contract_value > 0
    ? Math.min(Math.round((project.total_received / project.contract_value) * 100), 100)
    : 0
  const statusVariant =
    project.status === 'active' ? 'success'
    : project.status === 'completed' ? 'default'
    : 'destructive'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <ArrowLeft size={14} />Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusVariant} className="capitalize">{project.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{project.client_name}</p>
          </div>
          <Link href={`/projects/${id}/edit`}>
            <Button variant="secondary" size="sm"><Edit2 size={13} />Edit project</Button>
          </Link>
        </div>
      </div>

      {/* Financial summary */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-800">Financial Summary</h2>
          <Link href={`/projects/${id}/edit`}>
            <Button variant="ghost" size="xs" className="text-slate-400 hover:text-slate-700">
              <Edit2 size={12} />Edit
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: 'Contract Value', value: fmt(project.contract_value, project.currency), color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
              { label: `Received (${receivedPct}%)`, value: fmt(project.total_received, project.currency), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
              { label: 'Total Costs', value: fmt(project.total_expenses + project.total_employee_costs, project.currency), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Net Profit', value: fmt(project.net_profit, project.currency), color: profitPositive ? 'text-emerald-700' : 'text-red-700', bg: profitPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${receivedPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{receivedPct}% of contract value received</p>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Payments</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.payments.length} received</p>
          </div>
          <Link href={`/projects/${id}/payments/new`}>
            <Button size="sm"><Plus size={13} />Record payment</Button>
          </Link>
        </CardHeader>
        {project.payments.length > 0 ? (
          <>
            <div className="grid grid-cols-[80px_80px_80px_1fr_90px] gap-3 bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
              {['Date', 'Type', 'Method', 'Note', 'Amount'].map(h => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {project.payments.map((p: ProjectPayment) => (
                <div key={p.id} className="grid grid-cols-[80px_80px_80px_1fr_90px] gap-3 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
                  <p className="text-xs text-slate-400">{fmtDate(p.payment_date)}</p>
                  <Badge variant="info" className="capitalize text-[10px]">{PAYMENT_TYPE_LABELS[p.payment_type]}</Badge>
                  <p className="text-xs text-slate-500">{METHOD_LABELS[p.payment_method]}</p>
                  <p className="text-sm text-slate-600 truncate">{p.note ?? '—'}</p>
                  <p className="text-sm font-semibold text-emerald-700">{fmt(p.amount, project.currency)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <Wallet size={20} className="text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No payments recorded</p>
              <p className="text-xs text-slate-400 mt-1">Record advance, installment, or final payments.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Expenses</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.expenses.length} recorded</p>
          </div>
          <Link href={`/projects/${id}/expenses/new`}>
            <Button size="sm" variant="secondary"><Plus size={13} />Add expense</Button>
          </Link>
        </CardHeader>
        {project.expenses.length > 0 ? (
          <>
            <div className="grid grid-cols-[140px_1fr_100px_80px] gap-3 bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
              {['Category', 'Description', 'Amount', 'Date'].map(h => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {project.expenses.map((e: ProjectExpense) => (
                <div key={e.id} className="grid grid-cols-[140px_1fr_100px_80px] gap-3 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
                  <Badge variant="default">{EXPENSE_LABELS[e.category] ?? e.category}</Badge>
                  <p className="text-sm text-slate-600 truncate">{e.description ?? '—'}</p>
                  <p className="text-sm font-medium text-amber-700">{fmt(e.amount, project.currency)}</p>
                  <p className="text-xs text-slate-400">{new Date(e.expense_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                <TrendingDown size={20} className="text-amber-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No expenses recorded</p>
              <p className="text-xs text-slate-400 mt-1">Add subscriptions, commissions, and other costs.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Employee Assignments */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Team Assignments</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.assignments.length} assigned</p>
          </div>
          <Link href={`/projects/${id}/assignments/new`}>
            <Button size="sm" variant="secondary"><Plus size={13} />Assign employee</Button>
          </Link>
        </CardHeader>
        {project.assignments.length > 0 ? (
          <>
            <div className="grid grid-cols-[1fr_1fr_120px] gap-3 bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
              {['Employee', 'Role', 'Amount Paid'].map(h => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {project.assignments.map((a: ProjectEmployeeAssignment) => (
                <div key={a.id} className="grid grid-cols-[1fr_1fr_120px] gap-3 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors">
                  <p className="text-sm font-medium text-slate-800">{a.full_name ?? 'Unknown'}</p>
                  <p className="text-sm text-slate-500 truncate">{a.role_description ?? '—'}</p>
                  <p className="text-sm font-semibold text-violet-700">{fmt(a.amount_paid, project.currency)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                <Users size={20} className="text-violet-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No team members assigned</p>
              <p className="text-xs text-slate-400 mt-1">Assign employees and record their payments.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Client contact */}
      {(project.client_email || project.client_phone) && (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-slate-800">Client Contact</h2></CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {project.client_phone && (
                <p><span className="text-slate-400 w-16 inline-block">Phone</span><span className="text-slate-700">{project.client_phone}</span></p>
              )}
              {project.client_email && (
                <p><span className="text-slate-400 w-16 inline-block">Email</span><span className="text-slate-700">{project.client_email}</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Verify in the browser**

With the dev server running, create a project at `/projects/new` and click "View" on the card. The detail page should show:
- Back link, project name, client name, status badge, "Edit project" button
- 4-tile financial summary (Contract Value, Received %, Total Costs, Net Profit) + progress bar
- Payments card — empty state with "Record payment" button
- Expenses card — empty state with "Add expense" button
- Team Assignments card — empty state with "Assign employee" button
- Client contact card (if email/phone were provided)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/projects/\[id\]/page.tsx
git commit -m "feat: add project detail page"
```

---

## Task 7: Payment Form + Page

**Files:**
- Create: `src/components/projects/payment-form.tsx`
- Create: `src/app/(dashboard)/projects/[id]/payments/new/page.tsx`

- [ ] **Step 1: Create the payment form component**

Create `src/components/projects/payment-form.tsx`:

```typescript
'use client'

import { addProjectPayment } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
]

const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance' },
  { value: 'installment', label: 'Installment' },
  { value: 'final', label: 'Final' },
]

export function ProjectPaymentForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addProjectPayment(projectId, formData)
      if (!result.success) setError(result.error ?? 'Failed to record payment')
      else router.push(`/projects/${projectId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
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
        <label className="block text-sm font-medium text-slate-700">Payment type</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_TYPES.map((t, i) => (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="payment_type"
                value={t.value}
                defaultChecked={i === 1}
                className="sr-only peer"
              />
              <div className="rounded-lg border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 peer-checked:ring-2 peer-checked:ring-indigo-100">
                {t.label}
              </div>
            </label>
          ))}
        </div>
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
        id="note"
        name="note"
        label="Note"
        placeholder="e.g. Second installment via bank transfer"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Recording…' : 'Record payment'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create the new payment page**

Create `src/app/(dashboard)/projects/[id]/payments/new/page.tsx`:

```typescript
import { getProject } from '@/actions/projects'
import { ProjectPaymentForm } from '@/components/projects/payment-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewProjectPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success || !result.data) notFound()
  const project = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Payment</h1>
        <p className="text-sm text-slate-400 mt-0.5">Log a payment received from {project.client_name}</p>
      </div>
      <ProjectPaymentForm projectId={id} />
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 4: Verify in the browser**

On the project detail page, click "Record payment". You should see the form with:
- Amount + payment date (grid)
- Payment type radio: Advance / Installment (default) / Final
- Payment method radio: Cash (default) / Bank Transfer / eSewa / Khalti
- Note field
- "Record payment" + "Cancel" buttons

Submit a payment. You should be redirected to the project detail page and see the payment appear in the Payments card with correct amount and the financial summary updated.

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/payment-form.tsx src/app/\(dashboard\)/projects/\[id\]/payments/new/page.tsx
git commit -m "feat: add project payment form and page"
```

---

## Task 8: Expense Form + Page

**Files:**
- Create: `src/components/projects/expense-form.tsx`
- Create: `src/app/(dashboard)/projects/[id]/expenses/new/page.tsx`

- [ ] **Step 1: Create the expense form component**

Create `src/components/projects/expense-form.tsx`:

```typescript
'use client'

import { addProjectExpense } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProjectExpenseCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const CATEGORIES: { value: ProjectExpenseCategory; label: string }[] = [
  { value: 'subscription',        label: 'Subscription' },
  { value: 'hosting',             label: 'Hosting' },
  { value: 'api_cost',            label: 'API Cost' },
  { value: 'referral_commission', label: 'Referral Commission' },
  { value: 'company_fund',        label: 'Company Fund' },
  { value: 'my_commission',       label: 'My Commission' },
  { value: 'partner_commission',  label: 'Partner Commission' },
  { value: 'lunch',               label: 'Lunch' },
  { value: 'office_rent',         label: 'Office Rent' },
  { value: 'utilities',           label: 'Utilities' },
  { value: 'misc',                label: 'Miscellaneous' },
]

export function ProjectExpenseForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addProjectExpense(projectId, formData)
      if (!result.success) setError(result.error ?? 'Failed to record expense')
      else router.push(`/projects/${projectId}`)
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
          label="Amount"
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
        placeholder="e.g. Monthly Vercel hosting fee"
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

- [ ] **Step 2: Create the new expense page**

Create `src/app/(dashboard)/projects/[id]/expenses/new/page.tsx`:

```typescript
import { getProject } from '@/actions/projects'
import { ProjectExpenseForm } from '@/components/projects/expense-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewProjectExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success || !result.data) notFound()
  const project = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Expense</h1>
        <p className="text-sm text-slate-400 mt-0.5">Log a cost for {project.name}</p>
      </div>
      <ProjectExpenseForm projectId={id} />
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 4: Verify in the browser**

On the project detail page, click "Add expense". You should see:
- Category select (11 options)
- Amount + date (grid)
- Description field (optional)
- "Record expense" + "Cancel" buttons

Submit an expense. Redirects to project detail; expense appears in Expenses card; net profit updates.

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/expense-form.tsx src/app/\(dashboard\)/projects/\[id\]/expenses/new/page.tsx
git commit -m "feat: add project expense form and page"
```

---

## Task 9: Employee Assignment Form + Page

**Files:**
- Create: `src/components/projects/assignment-form.tsx`
- Create: `src/app/(dashboard)/projects/[id]/assignments/new/page.tsx`

- [ ] **Step 1: Create the assignment form component**

Create `src/components/projects/assignment-form.tsx`:

```typescript
'use client'

import { addEmployeeAssignment } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface AssignmentFormProps {
  projectId: string
  profiles: { id: string; full_name: string }[]
}

export function AssignmentForm({ projectId, profiles }: AssignmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addEmployeeAssignment(projectId, formData)
      if (!result.success) setError(result.error ?? 'Failed to assign employee')
      else router.push(`/projects/${projectId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <label htmlFor="user_id" className="block text-sm font-medium text-slate-700">Employee</label>
        <select
          id="user_id"
          name="user_id"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
        >
          <option value="">Select an employee…</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <Input
        id="role_description"
        name="role_description"
        label="Role / Contribution"
        placeholder="e.g. Frontend development"
        hint="Optional — describe what they worked on"
      />

      <Input
        id="amount_paid"
        name="amount_paid"
        type="number"
        min="0"
        step="1"
        label="Amount paid"
        placeholder="0"
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Assigning…' : 'Assign employee'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create the new assignment page**

Create `src/app/(dashboard)/projects/[id]/assignments/new/page.tsx`:

```typescript
import { getProject } from '@/actions/projects'
import { AssignmentForm } from '@/components/projects/assignment-form'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [projectResult, supabase] = await Promise.all([
    getProject(id),
    createClient(),
  ])
  if (!projectResult.success || !projectResult.data) notFound()
  const project = projectResult.data

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assign Employee</h1>
        <p className="text-sm text-slate-400 mt-0.5">Record an employee contribution to {project.name}</p>
      </div>
      <AssignmentForm projectId={id} profiles={profiles ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 4: Verify in the browser**

On the project detail page, click "Assign employee". You should see:
- Employee select (populated with active users from the profiles table)
- Role/contribution field (optional)
- Amount paid field (required)
- "Assign employee" + "Cancel" buttons

Submit an assignment. Redirects to project detail; assignment appears in Team Assignments card; total costs and net profit update correctly.

- [ ] **Step 5: Final end-to-end verification**

Complete a full golden path:
1. Create a project (name, client, contract value)
2. Record two payments (advance + installment) — verify received % updates
3. Add two expenses (e.g. hosting + my_commission) — verify net profit decreases
4. Assign one employee with amount — verify employee costs subtract from profit
5. Check: `net_profit = total_received - total_expenses - total_employee_costs`
6. Edit the project status to "completed"
7. Verify the project card on `/projects` shows updated stats

- [ ] **Step 6: Commit**

```bash
git add src/components/projects/assignment-form.tsx src/app/\(dashboard\)/projects/\[id\]/assignments/new/page.tsx
git commit -m "feat: add employee assignment form and page"
```

---

## Done

All 9 tasks complete. The Projects Module is fully functional:
- DB migration with RLS and indexes
- TypeScript types in `src/types/index.ts`
- Server actions in `src/actions/projects.ts`
- List page at `/projects`
- Create/edit forms at `/projects/new` and `/projects/[id]/edit`
- Detail page at `/projects/[id]` with payments, expenses, and assignments
- Payment form at `/projects/[id]/payments/new`
- Expense form at `/projects/[id]/expenses/new`
- Assignment form at `/projects/[id]/assignments/new`
