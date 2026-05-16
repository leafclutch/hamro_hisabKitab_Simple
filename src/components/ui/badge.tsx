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
