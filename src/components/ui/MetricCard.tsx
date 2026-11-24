import type { LucideIcon } from 'lucide-react'

export function MetricCard({ icon: Icon, label, value, tone = 'default' }: {
  icon: LucideIcon; label: string; value: string | number; tone?: 'default' | 'warning' | 'success' | 'critical'
}) {
  const toneStyles: Record<string, string> = {
    default: 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)]',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-green-50 text-green-700',
    critical: 'bg-red-50 text-red-700',
  }
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-[var(--color-slate-500)]">{label}</p>
      </div>
      <p className="mt-2.5 font-display text-2xl font-bold text-[var(--color-navy-950)]">{value}</p>
    </div>
  )
}
