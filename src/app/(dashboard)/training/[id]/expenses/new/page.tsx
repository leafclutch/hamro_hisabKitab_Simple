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
