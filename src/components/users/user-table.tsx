'use client'

import { deleteUser } from '@/actions/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { UserWithRoles } from '@/types'
import { Edit2, Search, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { DeleteUserDialog } from './delete-user-dialog'

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : email.charAt(0).toUpperCase()
  const palettes = [
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
  ]
  const palette = palettes[(email.charCodeAt(0) + email.charCodeAt(1)) % palettes.length]
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${palette}`}>
      {initials}
    </div>
  )
}

export function UserTable({ users }: { users: UserWithRoles[] }) {
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <span className="text-xs font-medium text-slate-400 tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100">
        {/* Head */}
        <div className="grid grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_120px_80px_100px_80px] gap-4 bg-slate-50/80 px-4 py-2.5">
          {['User', 'Email', 'Role', 'Status', 'Joined', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
          ))}
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {query ? 'No users match your search' : 'No users yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {query ? 'Try a different name or email' : 'Add your first team member to get started'}
            </p>
          </div>
        )}

        {/* Rows */}
        {filtered.map(user => (
          <div
            key={user.id}
            className="grid grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_120px_80px_100px_80px] gap-4 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar name={user.full_name} email={user.email} />
              <span className="text-sm font-medium text-slate-800 truncate">
                {user.full_name || <span className="text-slate-400">—</span>}
              </span>
            </div>
            <span className="text-sm text-slate-500 truncate">{user.email}</span>
            <div>
              {user.roles.length > 0
                ? <Badge variant="info" className="capitalize">{user.roles[0].name}</Badge>
                : <Badge variant="default">No role</Badge>
              }
            </div>
            <Badge variant={user.is_active ? 'success' : 'default'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-slate-400 tabular-nums">{formatDate(user.created_at)}</span>
            <div className="flex items-center justify-end gap-1">
              <Link href={`/settings/users/${user.id}`}>
                <Button variant="ghost" size="xs" className="text-slate-400 hover:text-slate-700" title="Edit">
                  <Edit2 size={13} />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteTarget(user)}
                className="text-slate-300 hover:text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <DeleteUserDialog
        open={!!deleteTarget}
        userName={deleteTarget?.full_name ?? deleteTarget?.email ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  )
}
