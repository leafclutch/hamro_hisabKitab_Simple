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
  ON public.training_batches FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete training_batches"
  ON public.training_batches FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS update_training_batches_updated_at ON public.training_batches;
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
  ON public.students FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins delete students"
  ON public.students FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
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

-- Indexes on foreign key columns for query performance
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student_id ON public.student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_payment_date ON public.student_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_training_expenses_batch_id ON public.training_expenses(batch_id);
CREATE INDEX IF NOT EXISTS idx_training_expenses_expense_date ON public.training_expenses(expense_date);
