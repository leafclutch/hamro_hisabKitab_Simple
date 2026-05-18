-- Migration: 003_projects_module.sql
-- Run this in Supabase SQL Editor

-- ── Tables ──────────────────────────────────────────────────────────────────

-- NOTE: created_by/recorded_by use NOT NULL + ON DELETE RESTRICT (not SET NULL like training module)
-- to preserve financial audit trail — a profile linked to financial records cannot be deleted.

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
  amount         NUMERIC(12,2) NOT NULL
                               CHECK (amount > 0),
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
  amount         NUMERIC(12,2) NOT NULL
                               CHECK (amount > 0),
  expense_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  recorded_by    UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_employee_assignments (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role_description TEXT,
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0
                               CHECK (amount_paid >= 0),
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

-- DELETE policies (Admin-only — mirrors training module pattern)
CREATE POLICY "Admins delete projects"
  ON public.projects FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete project_payments"
  ON public.project_payments FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete project_expenses"
  ON public.project_expenses FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete project_employee_assignments"
  ON public.project_employee_assignments FOR DELETE TO authenticated USING (public.is_admin());

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
