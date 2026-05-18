import { getProject, deleteProjectPayment, deleteProjectExpense, deleteEmployeeAssignment } from '@/actions/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { ProjectEmployeeAssignment, ProjectExpense, ProjectPayment } from '@/types'
import { ArrowLeft, Edit2, Plus, Trash2, TrendingDown, Users, Wallet } from 'lucide-react'
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

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')

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
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${receivedPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{receivedPct}% of contract value received</p>
        </CardContent>
      </Card>

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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-emerald-700">{fmt(p.amount, project.currency)}</p>
                    {isAdmin && (
                      <form action={deleteProjectPayment.bind(null, p.id) as unknown as (formData: FormData) => Promise<void>}>
                        <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </form>
                    )}
                  </div>
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">{new Date(e.expense_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}</p>
                    {isAdmin && (
                      <form action={deleteProjectExpense.bind(null, e.id) as unknown as (formData: FormData) => Promise<void>}>
                        <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </form>
                    )}
                  </div>
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-violet-700">{fmt(a.amount_paid, project.currency)}</p>
                    {isAdmin && (
                      <form action={deleteEmployeeAssignment.bind(null, a.id) as unknown as (formData: FormData) => Promise<void>}>
                        <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </form>
                    )}
                  </div>
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
