# Client Projects Module — Design Spec

**Date:** 2026-05-18  
**Status:** Approved

---

## Goal

Track client project finances: contract value, payments received, expenses incurred, and employee costs — producing a per-project net profit figure.

## Architecture

Mirror the Training Module exactly. Server actions in `src/actions/projects.ts`, pages under `src/app/(dashboard)/projects/`, shared types in `src/types/index.ts`. No client state management; all mutations are server actions with `revalidatePath`. Supabase RLS on all tables, same three-tier auth pattern (`requireAuth` for reads/writes, `is_admin()` RPC for deletes).

---

## Database Schema

### `projects`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
client_name   text NOT NULL
client_email  text
client_phone  text
contract_value numeric(12,2) NOT NULL DEFAULT 0
currency      text NOT NULL DEFAULT 'NPR'
start_date    date
deadline      date
status        text NOT NULL DEFAULT 'active'  -- active | completed | cancelled
notes         text
created_by    uuid NOT NULL REFERENCES profiles(id)
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### `project_payments`

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
amount         numeric(12,2) NOT NULL
payment_method text NOT NULL DEFAULT 'cash'  -- cash | bank | esewa | khalti
payment_type   text NOT NULL DEFAULT 'installment'  -- advance | installment | final
payment_date   date NOT NULL DEFAULT CURRENT_DATE
note           text
recorded_by    uuid NOT NULL REFERENCES profiles(id)
created_at     timestamptz DEFAULT now()
```

### `project_expenses`

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
category      text NOT NULL  -- see expense categories below
description   text
amount        numeric(12,2) NOT NULL
expense_date  date NOT NULL DEFAULT CURRENT_DATE
recorded_by   uuid NOT NULL REFERENCES profiles(id)
created_at    timestamptz DEFAULT now()
```

**Expense categories:** `subscription` | `hosting` | `api_cost` | `referral_commission` | `company_fund` | `my_commission` | `partner_commission` | `lunch` | `office_rent` | `utilities` | `misc`

### `project_employee_assignments`

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id       uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id          uuid NOT NULL REFERENCES profiles(id)
role_description text
amount_paid      numeric(12,2) NOT NULL DEFAULT 0
created_by       uuid NOT NULL REFERENCES profiles(id)
created_at       timestamptz DEFAULT now()
```

### RLS Policies (same pattern as training module)

All tables:
- SELECT: `auth.uid() IS NOT NULL`
- INSERT: `auth.uid() IS NOT NULL` with `WITH CHECK (auth.uid() IS NOT NULL)`
- UPDATE: `auth.uid() IS NOT NULL` with `WITH CHECK (auth.uid() IS NOT NULL)` (projects and assignments only — payments and expenses are append-only)
- DELETE: admin only via `is_admin()` RPC check in server action

### Indexes

```sql
idx_projects_status                       ON projects(status)
idx_project_payments_project_id           ON project_payments(project_id)
idx_project_payments_payment_date         ON project_payments(payment_date)
idx_project_expenses_project_id           ON project_expenses(project_id)
idx_project_expenses_expense_date         ON project_expenses(expense_date)
idx_project_employee_assignments_project  ON project_employee_assignments(project_id)
```

### `updated_at` trigger on `projects`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## TypeScript Types

```typescript
export type ProjectStatus = 'active' | 'completed' | 'cancelled'
export type ProjectPaymentMethod = 'cash' | 'bank' | 'esewa' | 'khalti'
export type ProjectPaymentType = 'advance' | 'installment' | 'final'
export type ProjectExpenseCategory =
  | 'subscription' | 'hosting' | 'api_cost' | 'referral_commission'
  | 'company_fund' | 'my_commission' | 'partner_commission'
  | 'lunch' | 'office_rent' | 'utilities' | 'misc'

export interface Project {
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

export interface ProjectPayment {
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

export interface ProjectExpense {
  id: string
  project_id: string
  category: ProjectExpenseCategory
  description: string | null
  amount: number
  expense_date: string
  recorded_by: string
  created_at: string
}

export interface ProjectEmployeeAssignment {
  id: string
  project_id: string
  user_id: string
  role_description: string | null
  amount_paid: number
  created_by: string
  created_at: string
  // joined
  full_name?: string
}

export interface ProjectWithStats extends Project {
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

---

## Profit Formula

```
net_profit = total_received − (total_expenses + total_employee_costs)
```

Where:
- `total_received` = sum of all `project_payments.amount`
- `total_expenses` = sum of all `project_expenses.amount`
- `total_employee_costs` = sum of all `project_employee_assignments.amount_paid`

Overhead costs (my_commission, partner_commission, lunch, office_rent, utilities) are just expense categories — no special treatment in the formula.

---

## Server Actions (`src/actions/projects.ts`)

```
getProjects()                                 → ActionResult<ProjectWithStats[]>
getProject(id)                                → ActionResult<ProjectWithStats>
createProject(formData)                       → ActionResult<Project>
updateProject(id, formData)                   → ActionResult<Project>
deleteProject(id)                             → ActionResult          [admin only]

addProjectPayment(projectId, formData)        → ActionResult<ProjectPayment>
deleteProjectPayment(id)                      → ActionResult          [admin only]

addProjectExpense(projectId, formData)        → ActionResult<ProjectExpense>
deleteProjectExpense(id)                      → ActionResult          [admin only]

addEmployeeAssignment(projectId, formData)    → ActionResult<ProjectEmployeeAssignment>
deleteEmployeeAssignment(id)                  → ActionResult          [admin only]
```

`getProjects` and `getProject` fetch all relations in one Supabase query (same pattern as `getBatches`/`getBatch` in training). Employee assignments join `profiles(full_name)` for display.

---

## Page Structure

```
/projects                          — list page (server component, force-dynamic)
/projects/new                      — create project form
/projects/[id]                     — project detail (payments, expenses, assignments)
/projects/[id]/edit                — edit project form
/projects/[id]/expenses/new        — add expense form
/projects/[id]/payments/new        — add payment form (no equivalent page in training — payments were inline)
/projects/[id]/assignments/new     — assign employee form
```

### `/projects` — List Page

- 3-stat summary header: Total Contract Value, Total Received, Total Profit
- Project cards grid (1→2→3 cols by breakpoint)
- Each card: project name, client name, status badge, currency + contract value, received vs contract progress bar, net profit
- Empty state + error state
- "New Project" button → `/projects/new`

### `/projects/[id]` — Detail Page

Four stat tiles at top (Contract Value, Received, Expenses + Employee Costs, Net Profit), then three sections:

1. **Payments** — table with date, type, method, amount; "Add Payment" button → `/projects/[id]/payments/new`
2. **Expenses** — table with date, category, description, amount; "Add Expense" button → `/projects/[id]/expenses/new`
3. **Employee Assignments** — table with name, role, amount paid; "Assign Employee" button → `/projects/[id]/assignments/new`

All delete buttons (admin only) shown inline — call server action directly, no modal.

### Forms

**ProjectForm** (`src/components/projects/project-form.tsx`):
- Fields: name, client_name, client_email, client_phone, contract_value, currency (NPR/USD/EUR), start_date, deadline, notes
- Edit mode adds status radio (active / completed / cancelled)
- `form action={handleSubmit}` with `useTransition`, `router.push` on success

**ProjectPaymentForm** (`src/components/projects/payment-form.tsx`):
- Fields: amount, payment_method (cash/bank/esewa/khalti), payment_type (advance/installment/final), payment_date, note
- On success: `router.push(`/projects/${projectId}`)` (redirect back to detail)

**ProjectExpenseForm** (`src/components/projects/expense-form.tsx`):
- Fields: category (select with all 11 options), description, amount, expense_date
- On success: `router.push(`/projects/${projectId}`)`

**EmployeeAssignmentForm** (`src/components/projects/assignment-form.tsx`):
- Props: `projectId: string`, `profiles: { id: string; full_name: string }[]`
- Fields: user_id (select populated from `profiles` prop), role_description, amount_paid
- The page at `/projects/[id]/assignments/new` is a server component that fetches `profiles` from Supabase and passes them to this form
- On success: `router.push(`/projects/${projectId}`)`

---

## Error Handling

Same pattern as training module:
- Server actions return `ActionResult<T>` — `{ success: true, data }` or `{ success: false, error: string }`
- Forms show error toast/message on failure, redirect on success
- `notFound()` when `getProject` returns error (404 page)

---

## What This Does NOT Include

- Client table / CRM (client fields inline on project)
- Project templates
- File attachments
- Invoice generation
- Time tracking
- Multi-currency conversion (stored in native currency, displayed as-is)
- Partial expense allocation across projects (overhead is entered per-project)

---

## Sidebar Update

Add `Briefcase` icon link for `/projects` in `src/components/layout/sidebar.tsx` `mainNav` array (already present as placeholder — just needs the route to work).

---

## Migration File

`supabase/migrations/003_projects_module.sql`

Contains: table creation, RLS enable + policies, indexes, updated_at trigger.
