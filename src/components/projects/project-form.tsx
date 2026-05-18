'use client'

import { createProject, updateProject } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface ProjectFormProps {
  project?: Project
}

const CURRENCIES = ['NPR', 'INR', 'USD', 'GBP']
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', desc: 'In progress' },
  { value: 'completed', label: 'Completed', desc: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled', desc: 'Cancelled' },
]

export function ProjectForm({ project }: ProjectFormProps) {
  const isEditing = !!project
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateProject(project.id, formData)
        : await createProject(formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(isEditing ? `/projects/${project.id}` : '/projects')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Project info</h3>
        <Input
          id="name"
          name="name"
          label="Project name"
          placeholder="e.g. E-commerce Website Redesign"
          defaultValue={project?.name ?? ''}
          required
        />
      </div>

      <div className="border-t border-slate-100" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Client</h3>
        <div className="space-y-4">
          <Input
            id="client_name"
            name="client_name"
            label="Client name"
            placeholder="e.g. Sharma Enterprises"
            defaultValue={project?.client_name ?? ''}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="client_email"
              name="client_email"
              type="email"
              label="Email"
              placeholder="client@example.com"
              defaultValue={project?.client_email ?? ''}
            />
            <Input
              id="client_phone"
              name="client_phone"
              label="Phone"
              placeholder="+977 98XXXXXXXX"
              defaultValue={project?.client_phone ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Contract value</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="contract_value"
              name="contract_value"
              type="number"
              min="0"
              step="1"
              label="Contract value"
              placeholder="0"
              defaultValue={project?.contract_value ?? ''}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
            <select
              id="currency"
              name="currency"
              defaultValue={project?.currency ?? 'NPR'}
              className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            label="Start date"
            defaultValue={project?.start_date ?? ''}
          />
          <Input
            id="deadline"
            name="deadline"
            type="date"
            label="Deadline"
            defaultValue={project?.deadline ?? ''}
          />
        </div>
      </div>

      {isEditing && (
        <>
          <div className="border-t border-slate-100" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Status</h3>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={project.status === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-100" />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={project?.notes ?? ''}
          placeholder="Scope, deliverables, or any relevant context…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create project')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
