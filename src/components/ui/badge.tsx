import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default:     'bg-slate-100 text-slate-700',
  success:     'bg-emerald-50 text-emerald-700',
  warning:     'bg-amber-50 text-amber-700',
  destructive: 'bg-red-50 text-red-700',
  info:        'bg-sky-50 text-sky-700',
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
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
