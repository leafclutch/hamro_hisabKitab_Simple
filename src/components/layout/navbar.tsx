'use client'

import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useTransition } from 'react'

interface NavbarProps {
  userEmail?: string
  userName?: string
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <User size={14} />
          </div>
          <div className="text-right">
            {userName && <p className="text-xs font-medium text-slate-800">{userName}</p>}
            {userEmail && <p className="text-[10px] text-slate-500">{userEmail}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={isPending}
          title="Sign out"
        >
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  )
}
