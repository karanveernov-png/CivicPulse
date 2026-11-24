import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { IssueCard } from '../components/issues/IssueCard'
import { IssueFilters } from '../components/issues/IssueFilters'
import { applyFilters, DEFAULT_FILTERS } from '../components/issues/filterIssues'
import { SectionHeading, EmptyState, Card } from '../components/ui/primitives'
import { computePriority } from '../lib/prioritization'

type SortMode = 'recent' | 'priority' | 'support'

export default function CommunityPage() {
  const { state } = useApp()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, search: params.get('q') ?? '' })
  const [sort, setSort] = useState<SortMode>('recent')

  const visibleIssues = state.issues.filter((i) => i.status !== 'duplicate')
  const filtered = useMemo(() => applyFilters(visibleIssues, filters), [visibleIssues, filters])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    if (sort === 'recent') copy.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    if (sort === 'priority') copy.sort((a, b) => computePriority(b).score - computePriority(a).score)
    if (sort === 'support') copy.sort((a, b) => b.votes.filter((v) => v.type === 'support').length - a.votes.filter((v) => v.type === 'support').length)
    return copy
  }, [filtered, sort])

  const resolved = visibleIssues.filter((i) => i.status === 'resolved').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

  return (
    <div className="space-y-6">
      <SectionHeading title="Community" description="Reports from across the city — support or confirm what you've also noticed." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Filters</p>
          <IssueFilters value={filters} onChange={setFilters} compact />
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['recent', 'priority', 'support'] as SortMode[]).map((m) => (
              <button key={m} onClick={() => setSort(m)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${sort === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-600)]' : 'border-[var(--color-border-strong)] text-[var(--color-navy-600)]'}`}>
                {m === 'support' ? 'Most support' : m}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="No matching reports" description="Try adjusting filters to see more community activity." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sorted.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
        </div>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Recently resolved, with their timeline</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {resolved.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
        </div>
      </Card>
    </div>
  )
}
