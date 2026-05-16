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
