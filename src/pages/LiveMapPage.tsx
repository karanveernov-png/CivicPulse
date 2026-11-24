import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapView } from '../components/map/MapView'
import { IssueFilters } from '../components/issues/IssueFilters'
import { applyFilters, DEFAULT_FILTERS } from '../components/issues/filterIssues'
import { IssueCard } from '../components/issues/IssueCard'
import { useApp } from '../state/AppContext'
import { Card, SectionHeading, EmptyState } from '../components/ui/primitives'
import { MapPinOff } from 'lucide-react'

export default function LiveMapPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, search: params.get('q') ?? '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visibleIssues = state.issues.filter((i) => i.status !== 'duplicate')
  const filtered = useMemo(() => applyFilters(visibleIssues, filters), [visibleIssues, filters])
  const selected = filtered.find((i) => i.id === selectedId)

  return (
    <div className="space-y-4">
      <SectionHeading title="Live Map" description={`${filtered.length} of ${visibleIssues.length} reports shown across Delhi`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
        <Card className="p-4 lg:order-1">
          <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Filters</p>
          <IssueFilters value={filters} onChange={setFilters} />
        </Card>

        <div className="lg:order-2">
          <MapView issues={filtered} selectedIssueId={selectedId} onSelectIssue={setSelectedId} heightClassName="h-[380px] sm:h-[460px] lg:h-[560px]" />
        </div>

        <div className="space-y-3 lg:order-3">
          {selected && (
            <Card className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">Selected report</p>
              <IssueCard issue={selected} />
              <button onClick={() => navigate(`/issues/${selected.id}`)} className="mt-2 w-full rounded-lg border border-[var(--color-border-strong)] py-1.5 text-xs font-medium hover:bg-[var(--color-paper)]">
                View full details
              </button>
            </Card>
          )}
          <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <EmptyState icon={<MapPinOff className="h-6 w-6" />} title="No reports match these filters" description="Try widening your category or status filters." />
            ) : (
              filtered.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedId(issue.id)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
