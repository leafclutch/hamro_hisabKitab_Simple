import { getProject } from '@/actions/projects'
import { AssignmentForm } from '@/components/projects/assignment-form'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [projectResult, supabase] = await Promise.all([
    getProject(id),
    createClient(),
  ])
  if (!projectResult.success || !projectResult.data) notFound()
  const project = projectResult.data

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to {project.name}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assign Employee</h1>
        <p className="text-sm text-slate-400 mt-0.5">Record an employee contribution to {project.name}</p>
      </div>
      <AssignmentForm projectId={id} profiles={profiles ?? []} />
    </div>
  )
}
