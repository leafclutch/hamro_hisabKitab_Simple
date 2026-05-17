'use client'

import { addPayment } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
]

export function PaymentForm({
  studentId,
  nextInstallment,
}: {
  studentId: string
  nextInstallment: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addPayment(studentId, formData)
      if (!result.success) {
        setError(result.error ?? 'Failed to record payment')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          label="Amount"
          placeholder="0"
          required
        />
        <Input
          id="payment_date"
          name="payment_date"
          type="date"
          label="Payment date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">Payment method</label>
        <div className="grid grid-cols-4 gap-2">
          {METHODS.map((m, i) => (
            <label key={m.value} className="cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value={m.value}
                defaultChecked={i === 0}
                className="sr-only peer"
              />
              <div className="rounded-lg border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 peer-checked:ring-2 peer-checked:ring-indigo-100">
                {m.label}
              </div>
            </label>
          ))}
        </div>
      </div>

      <Input
        id="installment_number"
        name="installment_number"
        type="number"
        min="1"
        step="1"
        label="Installment #"
        placeholder={String(nextInstallment)}
        defaultValue={nextInstallment}
        hint="Automatically set — change if needed"
      />

      <Input
        id="note"
        name="note"
        label="Note"
        placeholder="e.g. Second installment via eSewa"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? 'Recording…' : 'Record payment'}
      </Button>
    </form>
  )
}
