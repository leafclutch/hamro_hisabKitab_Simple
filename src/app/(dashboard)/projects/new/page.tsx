import { ProjectForm } from '@/components/projects/project-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Project</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track a client project, its payments, and costs.</p>
      </div>
      <ProjectForm />
    </div>
  )
}
