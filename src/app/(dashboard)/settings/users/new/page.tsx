import { getRoles } from '@/actions/users'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'

export default async function NewUserPage() {
  const rolesResult = await getRoles()
  const roles = rolesResult.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add user</h1>
        <p className="text-sm text-slate-500">Create a new user account and assign a role.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">User details</h2>
        </CardHeader>
        <CardContent>
          <UserForm roles={roles} />
        </CardContent>
      </Card>
    </div>
  )
}
