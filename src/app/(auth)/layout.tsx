import Image from 'next/image'

const features = [
  'Real-time profit tracking per project',
  'Student payment & installment management',
  'Role-based access control',
  'Approval workflows & audit logs',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col flex-shrink-0 bg-slate-900 text-white relative overflow-hidden">
        {/* Radial gradients for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_-20%_-10%,_#3730a3_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_110%_90%,_#1e1b4b_0%,_transparent_70%)]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image src="/logo/onlyLogo.svg" alt="Hamro HisabKitab" width={32} height={32} />
            <span className="text-base font-semibold tracking-tight">Hamro HisabKitab</span>
          </div>

          {/* Hero */}
          <div className="mt-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Financial Intelligence Platform</span>
            </div>

            <h2 className="text-3xl font-bold leading-snug">
              Complete visibility into your company finances
            </h2>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Track revenue, expenses, and profit across all projects and training programs — in one place.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/[0.08] pt-6">
            <p className="text-xs text-slate-600">Powered by Leafclutch · Internal use only</p>
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Image src="/logo/onlyLogo.svg" alt="Hamro HisabKitab" width={28} height={28} />
          <span className="text-sm font-semibold text-slate-900">Hamro HisabKitab</span>
        </div>
        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>
    </div>
  )
}
