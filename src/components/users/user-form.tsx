'use client'

import { createUser, updateUser } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Role, UserWithRoles } from '@/types'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface UserFormProps {
  roles: Role[]
  user?: UserWithRoles
}

export function UserForm({ roles, user }: UserFormProps) {
  const isEditing = !!user
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateUser(user.id, formData)
        : await createUser(formData)

      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
      } else {
        router.push('/settings/users')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <Input
        id="full_name"
        name="full_name"
        label="Full name"
        placeholder="Jane Doe"
        defaultValue={user?.full_name ?? ''}
        required
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="jane@company.com"
        defaultValue={user?.email ?? ''}
        required
        disabled={isEditing}
      />

      <Input
        id="phone"
        name="phone"
        type="tel"
        label="Phone (optional)"
        placeholder="+977 98XXXXXXXX"
        defaultValue={user?.phone ?? ''}
      />

      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role_id" className="text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role_id"
          name="role_id"
          defaultValue={user?.roles[0]?.id ?? ''}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">No role assigned</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} {role.description ? `— ${role.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="is_active"
            defaultValue={user.is_active ? 'true' : 'false'}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create user')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/settings/users')}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
