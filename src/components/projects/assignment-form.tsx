'use client'

import { addEmployeeAssignment } from '@/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface AssignmentFormProps {
  projectId: string
  profiles: { id: string; full_name: string }[]
}

export function AssignmentForm({ projectId, profiles }: AssignmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addEmployeeAssignment(projectId, formData)
      if (!result.success) setError(result.error ?? 'Failed to assign employee')
      else router.push(`/projects/${projectId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <label htmlFor="user_id" className="block text-sm font-medium text-slate-700">Employee</label>
        <select
          id="user_id"
          name="user_id"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
        >
          <option value="">Select an employee…</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <Input
        id="role_description"
        name="role_description"
        label="Role / Contribution"
        placeholder="e.g. Frontend development"
        hint="Optional — describe what they worked on"
      />

      <Input
        id="amount_paid"
        name="amount_paid"
        type="number"
        min="0"
        step="1"
        label="Amount paid"
        placeholder="0"
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Assigning…' : 'Assign employee'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
