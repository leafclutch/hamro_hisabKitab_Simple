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
