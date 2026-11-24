import type { IssueStatus, PriorityBreakdown } from '../../types'
import { STATUS_LABELS } from '../../lib/format'

const STATUS_STYLES: Record<IssueStatus, string> = {
  reported: 'bg-gray-100 text-gray-700 border-gray-200',
  verified: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  reopened: 'bg-orange-50 text-orange-800 border-orange-200',
  duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function StatusBadge({ status, className = '' }: { status: IssueStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}

const PRIORITY_STYLES: Record<PriorityBreakdown['level'], string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function PriorityBadge({ level, score, className = '' }: { level: PriorityBreakdown['level']; score?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[level]} ${className}`}>
      {level}{typeof score === 'number' ? ` · ${score}` : ''}
    </span>
  )
}

export function CategoryChip({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-paper)] px-2 py-0.5 text-xs font-medium text-[var(--color-navy-600)] ${className}`}>
      {label}
    </span>
  )
}
