export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo/onlyLogo.svg" alt="Hamro HisabKitab" className="h-12 w-12" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Hamro HisabKitab</h1>
            <p className="text-sm text-slate-400">Financial Intelligence Dashboard</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
