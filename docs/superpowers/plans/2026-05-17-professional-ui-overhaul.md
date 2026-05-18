# Professional UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Tailwind UI with a premium, finance-dashboard aesthetic — indigo accent system, split-panel login, polished components, refined sidebar with active indicators, and a structured dashboard.

**Architecture:** Full UI layer replacement — globals.css design tokens updated, all UI primitives rewritten, auth pages redesigned as split-panel, dashboard and user management pages restructured. No changes to server actions, middleware, or database logic.

**Tech Stack:** Next.js 15, Tailwind CSS v4, lucide-react, existing component file structure

---

## Files Modified

| File | Change |
|---|---|
| `src/app/globals.css` | New design token system — indigo primary, refined shadows, typography base |
| `src/components/ui/button.tsx` | Indigo primary, `outline` variant added, active scale, better focus ring |
| `src/components/ui/input.tsx` | `hint` prop, indigo focus ring, `rounded-lg` instead of `rounded-md` |
| `src/components/ui/card.tsx` | Refined shadow, `CardHeader` with border-b, new `CardFooter` |
| `src/components/ui/badge.tsx` | Border added, `purple` variant added |
| `src/app/(auth)/layout.tsx` | Split-panel — dark left brand panel + white right form panel |
| `src/app/(auth)/login/page.tsx` | Clean form on white bg, inline error icon, forgot-password link above button |
| `src/app/(auth)/forgot-password/page.tsx` | Consistent with new login style |
| `src/components/layout/sidebar.tsx` | Left-border active indicator, indigo icon on active, tighter sizing |
| `src/components/layout/navbar.tsx` | User avatar with initials, divider, cleaner layout |
| `src/app/(dashboard)/page.tsx` | Restructured stats cards, quick-actions panel, better empty state |
| `src/components/users/user-table.tsx` | User avatar initials, Search icon in input, grid layout rows |
| `src/components/users/user-form.tsx` | Form sections with dividers, better field layout |

---

## Task 1: Global CSS Design Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

Write `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  /* Primary — Indigo (premium financial feel) */
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #eef2ff;
  --primary-ring: rgb(99 102 241 / 0.15);

  /* Layout surfaces */
  --background: #f8fafc;
  --surface: #ffffff;
  --sidebar-bg: #0f172a;

  /* Borders */
  --border: #e2e8f0;
  --border-strong: #cbd5e1;

  /* Text scale */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Semantic colours */
  --success: #10b981;
  --success-bg: #ecfdf5;
  --warning: #f59e0b;
  --warning-bg: #fffbeb;
  --destructive: #ef4444;
  --destructive-bg: #fef2f2;

  /* Shadow system */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--background);
  color: var(--text-primary);
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
```

- [ ] **Step 2: Verify build**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/app/globals.css
git commit -m "design: new indigo-primary design token system"
```

---

## Task 2: UI Primitives — Button, Input, Card, Badge

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Rewrite button.tsx**

Write `src/components/ui/button.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:     'bg-indigo-600 text-white border border-indigo-700/30 hover:bg-indigo-700 shadow-sm',
  secondary:   'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
  ghost:       'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  outline:     'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  destructive: 'bg-red-600 text-white border border-red-700/30 hover:bg-red-700 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.97]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Rewrite input.tsx**

Write `src/components/ui/input.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all',
          'placeholder:text-slate-400',
          'focus:outline-none',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 3: Rewrite card.tsx**

Write `src/components/ui/card.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.06),_0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between px-5 py-4 border-b border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 rounded-b-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite badge.tsx**

Write `src/components/ui/badge.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'purple'

const variantClasses: Record<BadgeVariant, string> = {
  default:     'bg-slate-100 text-slate-600 border-slate-200',
  success:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning:     'bg-amber-50 text-amber-700 border-amber-200',
  destructive: 'bg-red-50 text-red-700 border-red-200',
  info:        'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple:      'bg-violet-50 text-violet-700 border-violet-200',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/ui/
git commit -m "design: refine UI primitives — indigo focus rings, border on badges, CardFooter added"
```

---

## Task 3: Auth UI — Split-Panel Login

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Rewrite auth layout as split-panel**

Write `src/app/(auth)/layout.tsx`:
```typescript
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
```

- [ ] **Step 2: Rewrite login page**

Write `src/app/(auth)/login/page.tsx`:
```typescript
'use client'

import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          required
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full mt-1.5">
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite forgot-password page**

Write `src/app/(auth)/forgot-password/page.tsx`:
```typescript
'use client'

import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) setError(result.error)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <MailCheck size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          We sent a password reset link to your email address. Check your inbox — it may take a minute.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>

      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          required
          autoComplete="email"
        />

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add 'src/app/(auth)/'
git commit -m "design: split-panel auth layout — brand left, form right"
```

---

## Task 4: Sidebar + Navbar Refinement

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/navbar.tsx`

- [ ] **Step 1: Rewrite sidebar.tsx**

Write `src/components/layout/sidebar.tsx`:
```typescript
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
```

- [ ] **Step 2: Rewrite navbar.tsx**

Write `src/components/layout/navbar.tsx`:
```typescript
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
```

- [ ] **Step 3: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/layout/
git commit -m "design: sidebar left-border active indicator, initials avatar in navbar"
```

---

## Task 5: Dashboard Home Page

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Rewrite dashboard home**

Write `src/app/(dashboard)/page.tsx`:
```typescript
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
```

- [ ] **Step 2: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "error|✓ Compiled" | head -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add 'src/app/(dashboard)/page.tsx'
git commit -m "design: dashboard overview with stat cards and quick-actions panel"
```

---

## Task 6: User Management UI — Table + Form

**Files:**
- Modify: `src/components/users/user-table.tsx`
- Modify: `src/components/users/user-form.tsx`
- Modify: `src/components/users/delete-user-dialog.tsx`
- Modify: `src/app/(dashboard)/settings/users/page.tsx`

- [ ] **Step 1: Rewrite user-table.tsx**

Write `src/components/users/user-table.tsx`:
```typescript
'use client'

import { deleteUser } from '@/actions/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { UserWithRoles } from '@/types'
import { Edit2, Search, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { DeleteUserDialog } from './delete-user-dialog'

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : email.charAt(0).toUpperCase()
  const palettes = [
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
  ]
  const palette = palettes[(email.charCodeAt(0) + email.charCodeAt(1)) % palettes.length]
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${palette}`}>
      {initials}
    </div>
  )
}

export function UserTable({ users }: { users: UserWithRoles[] }) {
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <span className="text-xs font-medium text-slate-400 tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100">
        {/* Head */}
        <div className="grid grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_120px_80px_100px_80px] gap-4 bg-slate-50/80 px-4 py-2.5">
          {['User', 'Email', 'Role', 'Status', 'Joined', ''].map(h => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
          ))}
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {query ? 'No users match your search' : 'No users yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {query ? 'Try a different name or email' : 'Add your first team member to get started'}
            </p>
          </div>
        )}

        {/* Rows */}
        {filtered.map(user => (
          <div
            key={user.id}
            className="grid grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_120px_80px_100px_80px] gap-4 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar name={user.full_name} email={user.email} />
              <span className="text-sm font-medium text-slate-800 truncate">
                {user.full_name || <span className="text-slate-400">—</span>}
              </span>
            </div>
            <span className="text-sm text-slate-500 truncate">{user.email}</span>
            <div>
              {user.roles.length > 0
                ? <Badge variant="info" className="capitalize">{user.roles[0].name}</Badge>
                : <Badge variant="default">No role</Badge>
              }
            </div>
            <Badge variant={user.is_active ? 'success' : 'default'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-slate-400 tabular-nums">{formatDate(user.created_at)}</span>
            <div className="flex items-center justify-end gap-1">
              <Link href={`/settings/users/${user.id}`}>
                <Button variant="ghost" size="xs" className="text-slate-400 hover:text-slate-700" title="Edit">
                  <Edit2 size={13} />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteTarget(user)}
                className="text-slate-300 hover:text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <DeleteUserDialog
        open={!!deleteTarget}
        userName={deleteTarget?.full_name ?? deleteTarget?.email ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  )
}
```

- [ ] **Step 2: Rewrite user-form.tsx**

Write `src/components/users/user-form.tsx`:
```typescript
'use client'

import { createUser, updateUser } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Role, UserWithRoles } from '@/types'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface UserFormProps {
  roles: Role[]
  user?: UserWithRoles
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function UserForm({ roles, user }: UserFormProps) {
  const isEditing = !!user
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateUser(user.id, formData)
        : await createUser(formData)
      if (!result.success) setError(result.error ?? 'Something went wrong')
      else router.push('/settings/users')
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      <FormSection title="Basic info">
        <Input
          id="full_name"
          name="full_name"
          label="Full name"
          placeholder="Jane Doe"
          defaultValue={user?.full_name ?? ''}
          required
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="jane@company.com"
          defaultValue={user?.email ?? ''}
          required
          disabled={isEditing}
          hint={isEditing ? 'Email cannot be changed after account creation' : undefined}
        />
        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Phone number"
          placeholder="+977 98XXXXXXXX"
          defaultValue={user?.phone ?? ''}
        />
      </FormSection>

      <div className="border-t border-slate-100" />

      {!isEditing && (
        <>
          <FormSection title="Security">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-slate-500">The user can change their password after signing in.</p>
            </div>
          </FormSection>
          <div className="border-t border-slate-100" />
        </>
      )}

      <FormSection title="Access">
        <div className="space-y-1.5">
          <label htmlFor="role_id" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role_id"
            name="role_id"
            defaultValue={user?.roles[0]?.id ?? ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
          >
            <option value="">No role assigned</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                {role.description ? ` — ${role.description}` : ''}
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Account status</label>
            <div className="flex gap-3">
              {[
                { value: 'true',  label: 'Active',   desc: 'Can sign in' },
                { value: 'false', label: 'Inactive', desc: 'Access blocked' },
              ].map(opt => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    value={opt.value}
                    defaultChecked={String(user.is_active) === opt.value}
                    className="sr-only peer"
                  />
                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-center transition-all peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:ring-2 peer-checked:ring-indigo-100">
                    <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isPending}>
          {isPending
            ? (isEditing ? 'Saving…' : 'Creating…')
            : (isEditing ? 'Save changes' : 'Create user')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/settings/users')}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Rewrite delete-user-dialog.tsx**

Write `src/components/users/delete-user-dialog.tsx`:
```typescript
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TriangleAlert } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  userName: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteUserDialog({ open, userName, onClose, onConfirm, loading }: DeleteUserDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete user account">
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">This cannot be undone</p>
            <p className="mt-1 text-sm text-red-600 leading-relaxed">
              Deleting <strong className="font-semibold">{userName}</strong> will permanently remove their account and all associated data.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Delete account
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Update users page header**

Write `src/app/(dashboard)/settings/users/page.tsx`:
```typescript
import { getUsers } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserTable } from '@/components/users/user-table'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const result = await getUsers()
  const users = result.data ?? []

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {users.length} team member{users.length !== 1 ? 's' : ''} · manage access and roles
          </p>
        </div>
        <Link href="/settings/users/new">
          <Button>
            <UserPlus size={14} />
            Add user
          </Button>
        </Link>
      </div>

      {result.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Team members</h2>
            <p className="text-xs text-slate-400 mt-0.5">Users with access to this system</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <div className="px-5 pt-4">
            <UserTable users={users} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | tail -15
```

Expected: Build passes, all routes compile.

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/users/ 'src/app/(dashboard)/settings/users/page.tsx'
git commit -m "design: user table with avatars, sectioned form, refined delete dialog"
```

---

## Self-Review

- [x] **Spec coverage:** All 6 tasks cover every file listed in the file structure table. Auth pages, components, layout, dashboard, and user management all redesigned.
- [x] **Placeholder scan:** No TBDs. All components have complete code.
- [x] **Type consistency:** `UserWithRoles`, `Role`, `BadgeVariant` used consistently. `CardFooter` added to card.tsx but not used in this plan (available for Phase 2). `Button` `size` prop gains `xs` and loses nothing — existing `sm/md/lg` callsites unchanged.
- [x] **Scope:** UI only. No server action, middleware, or DB changes.
