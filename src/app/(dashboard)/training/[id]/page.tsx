import { getBatch, getStudents, getExpenses } from '@/actions/training'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { BatchWithStats, StudentWithPayments, TrainingExpense } from '@/types'
import { ArrowLeft, Edit2, Plus, TrendingDown, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

function ExpenseRow({ expense }: { expense: TrainingExpense }) {
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
              {expenses.map(e => <ExpenseRow key={e.id} expense={e} />)}
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
