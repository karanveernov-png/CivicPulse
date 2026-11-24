import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary', loading, className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles: Record<Variant, string> = {
    primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-600)]',
    secondary: 'bg-white text-[var(--color-navy-900)] border border-[var(--color-border-strong)] hover:bg-[var(--color-paper)]',
    ghost: 'text-[var(--color-navy-600)] hover:bg-[var(--color-paper)]',
    danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>
      {children}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border-strong)] px-6 py-12 text-center">
      {icon && <div className="mb-1 text-[var(--color-navy-400)]">{icon}</div>}
      <p className="font-display text-base font-semibold text-[var(--color-navy-900)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--color-slate-500)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--color-border)] ${className}`} />
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy-950)]">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[var(--color-slate-500)]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
