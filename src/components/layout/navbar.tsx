'use client'

import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react'

interface NavbarProps {
  userEmail?: string
  userName?: string
}

function UserAvatar({ name, email }: { name?: string; email?: string }) {
  const display = name || email || 'U'
  const initial = display.charAt(0).toUpperCase()
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0">
      <span className="text-xs font-semibold leading-none">{initial}</span>
    </div>
  )
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <header className="flex h-[56px] items-center justify-between border-b border-slate-200/80 bg-white px-5 flex-shrink-0">
      <div />
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-1.5">
          <UserAvatar name={userName} email={userEmail} />
          <div className="text-right">
            {userName && (
              <p className="text-[13px] font-medium text-slate-800 leading-tight">{userName}</p>
            )}
            {userEmail && (
              <p className="text-[11px] text-slate-400 leading-tight">{userEmail}</p>
            )}
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(async () => { await logout() })}
          loading={isPending}
          className="text-slate-400 hover:text-slate-700 gap-1.5"
          title="Sign out"
        >
          <LogOut size={14} />
        </Button>
      </div>
    </header>
  )
}
