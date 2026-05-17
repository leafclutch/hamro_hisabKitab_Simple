import { getBatch } from '@/actions/training'
import { BatchForm } from '@/components/training/batch-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Batch</h1>
        <p className="text-sm text-slate-400 mt-0.5">{batch.name}</p>
      </div>
      <BatchForm batch={batch} />
    </div>
  )
}
