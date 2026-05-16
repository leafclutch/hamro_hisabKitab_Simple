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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage system users and their roles.</p>
        </div>
        <Link href="/settings/users/new">
          <Button>
            <UserPlus size={16} />
            Add user
          </Button>
        </Link>
      </div>

      {result.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {result.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">All users</h2>
        </CardHeader>
        <CardContent>
          <UserTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
