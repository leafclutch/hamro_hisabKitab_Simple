import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowUpRight, BarChart3, BookOpen, Briefcase, DollarSign, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const stats = [
  {
    label: 'Total Revenue',
    value: '—',
    sub: 'Across all projects & training',
    icon: DollarSign,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    label: 'Total Expenses',
    value: '—',
    sub: 'Operations & development costs',
    icon: TrendingDown,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Net Profit',
    value: '—',
    sub: 'Revenue minus all expenses',
    icon: BarChart3,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Training Revenue',
    value: '—',
    sub: 'From student payments',
    icon: BookOpen,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
]

const quickActions = [
  { label: 'New training batch', sub: 'Add students & track payments', href: '/training', color: 'border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50', dot: 'bg-indigo-500' },
  { label: 'Record client project', sub: 'Track project revenue & costs', href: '/projects', color: 'border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/50', dot: 'bg-emerald-500' },
  { label: 'Log an expense', sub: 'Record operational spending', href: '/transactions', color: 'border-amber-100 hover:border-amber-200 hover:bg-amber-50/50', dot: 'bg-amber-500' },
  { label: 'Manage users', sub: 'Add team members & roles', href: '/settings/users', color: 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50', dot: 'bg-slate-400' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Financial summary · Hamro HisabKitab</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Finance data coming in Phase 2
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-xl p-2.5 ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-slate-200 group-hover:text-slate-400 transition-colors mt-0.5"
                />
              </div>
              <p className="text-[26px] font-bold text-slate-900 tracking-tight leading-none">{value}</p>
              <p className="text-xs font-semibold text-slate-600 mt-2">{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent transactions — wider */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Recent Transactions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest financial activity</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Briefcase size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                Transactions will appear here once finance modules are active.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-800">Quick Actions</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(({ label, sub, href, color, dot }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all duration-150 group ${color}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{sub}</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 ml-2 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
