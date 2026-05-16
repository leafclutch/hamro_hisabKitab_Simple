import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowUpRight, BarChart3, BookOpen, Briefcase, DollarSign, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const stats = [
  {
    label: 'Total Revenue',
    value: '—',
    sub: 'Projects + Training',
    icon: DollarSign,
    accent: 'border-l-indigo-500',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    valueColor: 'text-indigo-700',
  },
  {
    label: 'Total Expenses',
    value: '—',
    sub: 'All operational costs',
    icon: TrendingDown,
    accent: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-700',
  },
  {
    label: 'Net Profit',
    value: '—',
    sub: 'Revenue − Expenses',
    icon: BarChart3,
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-700',
  },
  {
    label: 'Training Revenue',
    value: '—',
    sub: 'Student payments',
    icon: BookOpen,
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    valueColor: 'text-violet-700',
  },
]

const quickActions = [
  {
    label: 'New training batch',
    sub: 'Add students & track payments',
    href: '/training',
    icon: BookOpen,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50/60 hover:border-indigo-200',
  },
  {
    label: 'Record client project',
    sub: 'Track project revenue & costs',
    href: '/projects',
    icon: Briefcase,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/60 hover:border-emerald-200',
  },
  {
    label: 'Log an expense',
    sub: 'Record operational spending',
    href: '/transactions',
    icon: TrendingDown,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    hoverBg: 'hover:bg-amber-50/60 hover:border-amber-200',
  },
  {
    label: 'Manage users',
    sub: 'Add team members & roles',
    href: '/settings/users',
    icon: DollarSign,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    hoverBg: 'hover:bg-slate-50 hover:border-slate-200',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Hamro HisabKitab · Real-time dashboard</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Phase 2 data coming soon
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, accent, iconBg, iconColor, valueColor }) => (
          <div
            key={label}
            className={`group relative bg-white rounded-xl border border-slate-200/80 border-l-4 ${accent} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-slate-200 group-hover:text-slate-400 transition-colors"
                />
              </div>
              <p className={`text-3xl font-extrabold tracking-tight leading-none ${valueColor}`}>{value}</p>
              <p className="text-[13px] font-semibold text-slate-700 mt-2.5">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent transactions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Recent Transactions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest financial activity across all modules</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">0 records</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <BarChart3 size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[200px] leading-relaxed">
                Transactions will appear here once training batches and projects are added.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-800">Quick Actions</h2>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {quickActions.map(({ label, sub, href, icon: Icon, iconBg, iconColor, hoverBg }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 transition-all duration-150 group ${hoverBg}`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon size={15} className={iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 truncate">{label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{sub}</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Module status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Training Module', desc: 'Batches, students, payments', status: 'In progress', color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Projects Module', desc: 'Client projects, revenue, costs', status: 'Coming next', color: 'text-slate-500 bg-slate-50 border-slate-200' },
          { label: 'Reports', desc: 'P&L, export, analytics', status: 'Phase 3', color: 'text-slate-400 bg-slate-50 border-slate-200' },
        ].map(({ label, desc, status, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
