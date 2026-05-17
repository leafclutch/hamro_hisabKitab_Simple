'use client'

import { createStudent, updateStudent } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Student } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface StudentFormProps {
  batchId: string
  student?: Student
  defaultFee?: number
}

export function StudentForm({ batchId, student, defaultFee = 0 }: StudentFormProps) {
  const isEditing = !!student
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateStudent(student.id, formData)
        : await createStudent(batchId, formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push(`/training/${batchId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Student info</h3>
        <div className="space-y-4">
          <Input id="full_name" name="full_name" label="Full name" placeholder="Ram Bahadur Thapa" defaultValue={student?.full_name ?? ''} required />
          <Input id="phone" name="phone" type="tel" label="Phone number" placeholder="+977 98XXXXXXXX" defaultValue={student?.phone ?? ''} />
          <Input id="email" name="email" type="email" label="Email address" placeholder="ram@example.com" defaultValue={student?.email ?? ''} />
          <Input id="joining_date" name="joining_date" type="date" label="Joining date" defaultValue={student?.joining_date ?? new Date().toISOString().split('T')[0]} required />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Payment</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="total_fee"
              name="total_fee"
              type="number"
              min="0"
              step="1"
              label="Total course fee"
              placeholder="0"
              defaultValue={student?.total_fee ?? defaultFee}
              required
            />
            <Input
              id="discount"
              name="discount"
              type="number"
              min="0"
              step="1"
              label="Discount"
              placeholder="0"
              defaultValue={student?.discount ?? 0}
              hint="Amount deducted from fee"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Payment type</label>
            <div className="flex gap-3">
              {[
                { value: 'installment', label: 'Installments', desc: 'Pays in parts' },
                { value: 'full', label: 'Full payment', desc: 'One-time payment' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_type"
                    value={opt.value}
                    defaultChecked={(student?.payment_type ?? 'installment') === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
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
              {[
                { value: 'active', label: 'Active', desc: 'Currently enrolled' },
                { value: 'completed', label: 'Completed', desc: 'Finished program' },
                { value: 'dropped', label: 'Dropped', desc: 'Left program' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={student.status === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                    <p className="text-[10px] text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-100" />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={student?.notes ?? ''}
          placeholder="Any notes about this student…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add student')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
