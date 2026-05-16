import { getUsers } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserTable } from '@/components/users/user-table'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const result = await getUsers()
  const users = result.data ?? []

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {users.length} team member{users.length !== 1 ? 's' : ''} · manage access and roles
          </p>
        </div>
        <Link href="/settings/users/new">
          <Button>
            <UserPlus size={14} />
            Add user
          </Button>
        </Link>
      </div>

      {result.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Team members</h2>
            <p className="text-xs text-slate-400 mt-0.5">Users with access to this system</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <div className="px-5 pt-4">
            <UserTable users={users} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
