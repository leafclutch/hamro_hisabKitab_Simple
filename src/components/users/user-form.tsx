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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
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
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push('/settings/users')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <FormSection title="Basic info">
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
          hint={isEditing ? 'Email cannot be changed after account creation' : undefined}
        />
        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Phone number"
          placeholder="+977 98XXXXXXXX"
          defaultValue={user?.phone ?? ''}
        />
      </FormSection>

      <div className="border-t border-slate-100" />

      {!isEditing && (
        <>
          <FormSection title="Security">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-slate-500">The user can change their password after signing in.</p>
            </div>
          </FormSection>
          <div className="border-t border-slate-100" />
        </>
      )}

      <FormSection title="Access">
        <div className="space-y-1.5">
          <label htmlFor="role_id" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role_id"
            name="role_id"
            defaultValue={user?.roles[0]?.id ?? ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
          >
            <option value="">No role assigned</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                {role.description ? ` — ${role.description}` : ''}
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Account status</label>
            <div className="flex gap-3">
              {[
                { value: 'true',  label: 'Active',   desc: 'Can sign in' },
                { value: 'false', label: 'Inactive', desc: 'Access blocked' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    value={opt.value}
                    defaultChecked={String(user.is_active) === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isPending}>
          {isPending
            ? (isEditing ? 'Saving…' : 'Creating…')
            : (isEditing ? 'Save changes' : 'Create user')}
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
