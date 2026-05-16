'use client'

import { cn } from '@/lib/utils'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const mainNav = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/training',     icon: BookOpen,        label: 'Training' },
  { href: '/projects',     icon: Briefcase,       label: 'Projects' },
  { href: '/transactions', icon: Wallet,          label: 'Transactions' },
  { href: '/reports',      icon: BarChart3,       label: 'Reports' },
]

const settingsNav = [
  { href: '/settings/users', icon: Users,    label: 'Users' },
  { href: '/settings',       icon: Settings, label: 'Settings' },
]

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  collapsed,
}: {
  href: string
  icon: React.ElementType
  label: string
  pathname: string
  collapsed: boolean
}) {
  const active = pathname === href || (href !== '/' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
        active
          ? 'bg-white/[0.07] text-white'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
      )}
      <Icon
        size={16}
        className={cn(
          'flex-shrink-0 transition-colors',
          active ? 'text-indigo-400' : 'text-slate-500'
        )}
      />
      {!collapsed && <span className="truncate leading-none">{label}</span>}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-slate-900 flex-shrink-0 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[58px]' : 'w-[216px]'
      )}
    >
      {/* Logo row */}
      <div
        className={cn(
          'flex h-[56px] items-center border-b border-white/[0.06] flex-shrink-0 gap-3 px-3.5',
          collapsed && 'justify-center px-0'
        )}
      >
        <Image src="/logo/onlyLogo.svg" alt="Logo" width={26} height={26} className="flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-[13px] font-semibold text-white truncate">Hamro HisabKitab</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Finance Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-2.5')}>
          {mainNav.map(item => (
            <NavLink key={item.href} {...item} pathname={pathname} collapsed={collapsed} />
          ))}
        </div>

        {!collapsed && (
          <p className="mx-5 mt-5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Settings
          </p>
        )}
        {collapsed && <div className="my-3 mx-2 border-t border-white/[0.06]" />}
        <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-2.5')}>
          {settingsNav.map(item => (
            <NavLink key={item.href} {...item} pathname={pathname} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={14}
            className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
          />
        </button>
      </div>
    </aside>
  )
}
