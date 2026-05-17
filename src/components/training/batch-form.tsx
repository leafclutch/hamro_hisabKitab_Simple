'use client'

import { createBatch, updateBatch } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TrainingBatch } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface BatchFormProps {
  batch?: TrainingBatch
}

const CURRENCIES = ['NPR', 'INR', 'USD', 'GBP']
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', desc: 'Currently running' },
  { value: 'completed', label: 'Completed', desc: 'Finished' },
  { value: 'cancelled', label: 'Cancelled', desc: 'Cancelled' },
]

export function BatchForm({ batch }: BatchFormProps) {
  const isEditing = !!batch
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateBatch(batch.id, formData)
        : await createBatch(formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(isEditing ? `/training/${batch.id}` : '/training')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      {/* Basic info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Batch info</h3>
        <div className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Batch name"
            placeholder="e.g. Web Dev Batch 3 — 2024"
            defaultValue={batch?.name ?? ''}
            required
            hint="A unique name to identify this batch"
          />
          <Input
            id="program"
            name="program"
            label="Program / Course name"
            placeholder="e.g. Full Stack Web Development"
            defaultValue={batch?.program ?? ''}
            required
          />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Dates */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            label="Start date"
            defaultValue={batch?.start_date ?? ''}
          />
          <Input
            id="end_date"
            name="end_date"
            type="date"
            label="End date"
            defaultValue={batch?.end_date ?? ''}
          />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Finance */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Finance</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="fee_per_student"
                name="fee_per_student"
                type="number"
                min="0"
                step="1"
                label="Default fee per student"
                placeholder="0"
                defaultValue={batch?.fee_per_student ?? ''}
                hint="Can be overridden per student"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
              <select
                id="currency"
                name="currency"
                defaultValue={batch?.currency ?? 'NPR'}
                className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
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
                    defaultChecked={batch.status === opt.value}
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

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={batch?.notes ?? ''}
          placeholder="Any additional notes about this batch…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create batch')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
