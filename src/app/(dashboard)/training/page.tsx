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
