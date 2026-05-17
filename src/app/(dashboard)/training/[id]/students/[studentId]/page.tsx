import { getStudent, getBatch } from '@/actions/training'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaymentForm } from '@/components/training/payment-form'
import type { StudentPayment } from '@/types'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
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
