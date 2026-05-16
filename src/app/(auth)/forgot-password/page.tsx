'use client'

import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'

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

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-8">
      <Link
        href="/login"
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={14} /> Back to login
      </Link>

      <h2 className="mb-2 text-xl font-semibold text-white">Reset your password</h2>
      <p className="mb-6 text-sm text-slate-400">
        Enter your email and we'll send you a reset link.
      </p>

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
          <p className="text-sm text-slate-300">
            Check your email for the reset link. It may take a minute.
          </p>
        </div>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@company.com"
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-sky-400"
          />

          {error && (
            <p className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" loading={isPending} className="mt-1 w-full">
            {isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </div>
  )
}
