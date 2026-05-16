'use client'

import { deleteUser } from '@/actions/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { UserWithRoles } from '@/types'
import { Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { DeleteUserDialog } from './delete-user-dialog'

interface UserTableProps {
  users: UserWithRoles[]
}

export function UserTable({ users }: UserTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const filtered = users.filter(
    u =>
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
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span className="text-sm text-slate-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.full_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(r => (
                          <Badge key={r.id} variant="info">{r.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">No role</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? 'success' : 'default'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/settings/users/${user.id}`}>
                        <Button variant="ghost" size="sm" title="Edit user">
                          <Edit2 size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(user)}
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
