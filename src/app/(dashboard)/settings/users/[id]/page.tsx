import { getRoles, getUserById } from '@/actions/users'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  const [userResult, rolesResult] = await Promise.all([getUserById(id), getRoles()])

  if (!userResult.success || !userResult.data) notFound()

  const user = userResult.data
  const roles = rolesResult.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit user</h1>
        <p className="text-sm text-slate-500">Update details for {user.full_name || user.email}.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">User details</h2>
        </CardHeader>
        <CardContent>
          <UserForm roles={roles} user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
