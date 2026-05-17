import { BatchForm } from '@/components/training/batch-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewBatchPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/training" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to Training
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Training Batch</h1>
        <p className="text-sm text-slate-400 mt-0.5">Create a batch to start tracking students, payments, and expenses.</p>
      </div>
      <BatchForm />
    </div>
  )
}
