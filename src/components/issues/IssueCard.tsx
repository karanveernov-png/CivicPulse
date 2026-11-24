import { Link } from 'react-router-dom'
import { ImageOff, MapPin, ThumbsUp, ShieldCheck } from 'lucide-react'
import type { CivicIssue } from '../../types'
import { CATEGORY_LABELS } from '../../lib/format'
import { timeAgo } from '../../lib/format'
import { StatusBadge, PriorityBadge, CategoryChip } from '../ui/Badge'
import { computePriority } from '../../lib/prioritization'

export function IssueCard({ issue, onClick }: { issue: CivicIssue; onClick?: () => void }) {
  const priority = computePriority(issue)
  const confirmCount = issue.votes.filter((v) => v.type === 'confirm').length
  const supportCount = issue.votes.filter((v) => v.type === 'support').length

  const content = (
    <div className="flex gap-3 p-3">
      <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-paper)]">
        {issue.photoUrl ? (
          <img
            src={issue.photoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-navy-400)]">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={issue.status} />
          <PriorityBadge level={priority.level} />
          <CategoryChip label={CATEGORY_LABELS[issue.category]} />
        </div>
        <p className="truncate font-display text-sm font-semibold text-[var(--color-navy-950)]">{issue.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-slate-500)]">
          <MapPin className="h-3 w-3" /> {issue.location.neighborhood} · {timeAgo(issue.reportedAt)}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-navy-600)]">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {confirmCount}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {supportCount}</span>
          <span className="text-[var(--color-navy-400)]">{issue.id}</span>
        </div>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full rounded-xl border border-[var(--color-border)] bg-white text-left transition-shadow hover:shadow-sm">
        {content}
      </button>
    )
  }

  return (
    <Link to={`/issues/${issue.id}`} className="block rounded-xl border border-[var(--color-border)] bg-white transition-shadow hover:shadow-sm">
      {content}
    </Link>
  )
}
