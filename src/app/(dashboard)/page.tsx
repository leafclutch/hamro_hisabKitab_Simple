import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react'

const stats = [
  { label: 'Total Revenue',  value: '—',  icon: DollarSign,  color: 'text-sky-600',     bg: 'bg-sky-50' },
  { label: 'Total Expenses', value: '—',  icon: TrendingUp,  color: 'text-amber-600',   bg: 'bg-amber-50' },
  { label: 'Net Profit',     value: '—',  icon: BarChart3,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Active Users',   value: '—',  icon: Users,       color: 'text-violet-600',  bg: 'bg-violet-50' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Financial overview — more data coming soon.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No transactions yet. Finance modules coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  )
}
