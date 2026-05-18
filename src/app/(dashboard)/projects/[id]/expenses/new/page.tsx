import { getProject } from '@/actions/projects'
import { ProjectExpenseForm } from '@/components/projects/expense-form'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewProjectExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getProject(id)
  if (!result.success || !result.data) notFound()
  const project = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Expense</h1>
        <p className="text-sm text-slate-400 mt-0.5">Log a cost for {project.name}</p>
      </div>
      <ProjectExpenseForm projectId={id} />
    </div>
  )
}
