'use client'

import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) setError(result.error)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <MailCheck size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          We sent a password reset link to your email address. Check your inbox — it may take a minute.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>

      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          required
          autoComplete="email"
        />

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
}
