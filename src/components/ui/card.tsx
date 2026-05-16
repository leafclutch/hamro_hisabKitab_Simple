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
