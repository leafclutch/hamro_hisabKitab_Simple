'use client'

import { addExpense } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExpenseCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'mentor_fee',          label: 'Mentor Fee' },
  { value: 'udemy',               label: 'Udemy / Course' },
  { value: 'referral_commission', label: 'Referral Commission' },
  { value: 'staff_fee',           label: 'Staff Fee' },
  { value: 'ad_boost',            label: 'Ad Boost' },
  { value: 'company_fund',        label: 'Company Fund' },
  { value: 'certificate',         label: 'Certificate' },
  { value: 'server',              label: 'Server Cost' },
  { value: 'misc',                label: 'Miscellaneous' },
]

export function ExpenseForm({ batchId }: { batchId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addExpense(batchId, formData)
      if (!result.success) setError(result.error ?? 'Failed to record expense')
      else router.push(`/training/${batchId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          label="Amount (NPR)"
          placeholder="0"
          required
        />
        <Input
          id="expense_date"
          name="expense_date"
          type="date"
          label="Date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <Input
        id="description"
        name="description"
        label="Description"
        placeholder="e.g. Payment to John for mentoring Batch 3"
        hint="Optional — provide detail for audit purposes"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Recording…' : 'Record expense'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
