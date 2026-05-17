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
