import type { StatusTimelineEvent } from '../../types'
import { STATUS_LABELS } from '../../lib/format'
import { formatDateTime } from '../../lib/format'

export function StatusTimelineView({ events }: { events: StatusTimelineEvent[] }) {
  return (
    <ol className="relative ml-1.5 space-y-5 border-l-2 border-[var(--color-border)] pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[26px] top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-accent)] shadow" />
          <p className="text-sm font-semibold text-[var(--color-navy-950)]">{STATUS_LABELS[e.status]}</p>
          <p className="text-xs text-[var(--color-slate-500)]">{formatDateTime(e.timestamp)} · {e.actorLabel}</p>
          {e.note && <p className="mt-1 text-sm text-[var(--color-navy-700)]">{e.note}</p>}
          {e.reason && <p className="mt-1 text-sm italic text-[var(--color-navy-600)]">Reason: {e.reason}</p>}
        </li>
      ))}
    </ol>
  )
}
