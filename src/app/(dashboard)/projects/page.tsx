import { getProjects } from '@/actions/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProjectWithStats } from '@/types'
import { Briefcase, Plus, TrendingUp, Wallet } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const CURRENCY_SYMBOL: Record<string, string> = {
  NPR: 'NPR', INR: '₹', USD: '$', GBP: '£',
}

function fmt(amount: number, currency = 'NPR') {
  const sym = CURRENCY_SYMBOL[currency] ?? currency
  return `${sym} ${amount.toLocaleString('en-IN')}`
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const profitPositive = project.net_profit >= 0
  const receivedPct = project.contract_value > 0
    ? Math.min(Math.round((project.total_received / project.contract_value) * 100), 100)
    : 0
  const statusVariant =
    project.status === 'active' ? 'success'
    : project.status === 'completed' ? 'default'
    : 'destructive'

  return (
    <Card className="group hover:shadow-md transition-all duration-200 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <Badge variant={statusVariant} className="capitalize mb-1.5">{project.status}</Badge>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">{project.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{project.client_name}</p>
          </div>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="xs" className="flex-shrink-0">View</Button>
          </Link>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Received</span>
            <span>{receivedPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${receivedPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
            <p className="text-xs font-bold text-slate-700 truncate">{fmt(project.contract_value, project.currency)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Contract</p>
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-center">
            <p className="text-xs font-bold text-indigo-700 truncate">{fmt(project.total_received, project.currency)}</p>
            <p className="text-[10px] text-indigo-400 mt-0.5">Received</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 text-center ${profitPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs font-bold truncate ${profitPositive ? 'text-emerald-700' : 'text-red-700'}`}>
              {fmt(project.net_profit, project.currency)}
            </p>
            <p className={`text-[10px] mt-0.5 ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>Profit</p>
          </div>
        </div>

        {project.deadline && (
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Deadline: {fmtDate(project.deadline)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default async function ProjectsPage() {
  const result = await getProjects()
  const projects = result.data ?? []

  const totalContract = projects.reduce((s, p) => s + p.contract_value, 0)
  const totalReceived = projects.reduce((s, p) => s + p.total_received, 0)
  const totalProfit = projects.reduce((s, p) => s + p.net_profit, 0)
  const activeProjects = projects.filter(p => p.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects} active
          </p>
        </div>
        <Link href="/projects/new">
          <Button><Plus size={14} />New project</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects, icon: Briefcase, bg: 'bg-indigo-50', ic: 'text-indigo-600', val: 'text-indigo-700' },
          { label: 'Total Contract', value: `NPR ${totalContract.toLocaleString('en-IN')}`, icon: Wallet, bg: 'bg-violet-50', ic: 'text-violet-600', val: 'text-violet-700' },
          { label: 'Total Received', value: `NPR ${totalReceived.toLocaleString('en-IN')}`, icon: TrendingUp, bg: 'bg-emerald-50', ic: 'text-emerald-600', val: 'text-emerald-700' },
          { label: 'Net Profit', value: `NPR ${totalProfit.toLocaleString('en-IN')}`, icon: TrendingUp, bg: totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50', ic: totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600', val: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700' },
        ].map(({ label, value, icon: Icon, bg, ic, val }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
              <Icon size={16} className={ic} />
            </div>
            <p className={`text-xl font-bold ${val}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {result.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{result.error}</div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Briefcase size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No projects yet</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Create your first project to start tracking client payments and expenses.
          </p>
          <Link href="/projects/new" className="mt-5">
            <Button><Plus size={14} />Create first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
