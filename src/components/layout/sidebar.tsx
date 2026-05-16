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

const navItems = [
  { href: '/',                          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/training',                  icon: BookOpen,        label: 'Training' },
  { href: '/projects',                  icon: Briefcase,       label: 'Projects' },
  { href: '/transactions',              icon: Wallet,          label: 'Transactions' },
  { href: '/reports',                   icon: BarChart3,       label: 'Reports' },
  { href: '/settings/users',            icon: Users,           label: 'Users',    section: 'Settings' },
  { href: '/settings',                  icon: Settings,        label: 'Settings', section: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const mainItems = navItems.filter(i => !i.section)
  const settingsItems = navItems.filter(i => i.section === 'Settings')

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-slate-900 text-slate-300 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-2')}>
        <Image src="/logo/onlyLogo.svg" alt="Logo" width={32} height={32} className="flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-white text-sm leading-tight">
            Hamro<br />HisabKitab
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <NavGroup items={mainItems} pathname={pathname} collapsed={collapsed} />
        {!collapsed && (
          <p className="mt-4 mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Settings
          </p>
        )}
        <NavGroup items={settingsItems} pathname={pathname} collapsed={collapsed} />
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  )
}

function NavGroup({
  items,
  pathname,
  collapsed,
}: {
  items: typeof navItems
  pathname: string
  collapsed: boolean
}) {
  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
