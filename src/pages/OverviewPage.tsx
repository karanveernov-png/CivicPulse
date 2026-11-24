import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileStack, ClockAlert, Wrench, CheckCircle2, Timer, AlertOctagon, Map as MapIcon, PlusCircle,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { MapView } from '../components/map/MapView'
import { IssueCard } from '../components/issues/IssueCard'
import { IssueFilters } from '../components/issues/IssueFilters'
import { applyFilters, DEFAULT_FILTERS } from '../components/issues/filterIssues'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionHeading, Card, EmptyState } from '../components/ui/primitives'
import { computeOverviewMetrics, issuesOverTime, categoryDistribution, statusBreakdown } from '../lib/analytics'
import { TrendChart, CategoryBarChart, StatusPieChart } from '../components/analytics/Charts'
import { STATUS_LABELS } from '../lib/format'
import { timeAgo } from '../lib/format'

export default function OverviewPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visibleIssues = state.issues.filter((i) => i.status !== 'duplicate')
  const filtered = useMemo(() => applyFilters(visibleIssues, filters), [visibleIssues, filters])
  const metrics = useMemo(() => computeOverviewMetrics(state.issues), [state.issues])
  const trend = useMemo(() => issuesOverTime(visibleIssues), [visibleIssues])
  const categories = useMemo(() => categoryDistribution(state.issues), [state.issues])
  const statuses = useMemo(() => statusBreakdown(state.issues), [state.issues])

  const recent = [...visibleIssues].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()).slice(0, 4)
  const recentlyResolved = visibleIssues.filter((i) => i.status === 'resolved').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3)
  const needsVerification = visibleIssues.filter((i) => i.status === 'reported').slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-8">
        <p className="text-sm font-medium text-[var(--color-accent-600)]">CivicPulse · Delhi demo coverage</p>
        <h1 className="mt-1 max-w-2xl font-display text-2xl font-bold text-[var(--color-navy-950)] md:text-3xl">
          Your city. Your voice. Visible action.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-navy-600)]">
          CivicPulse lets citizens report potholes, overflowing bins, broken streetlights, and other civic issues in seconds,
          see what's already been flagged nearby, and track every report through to resolution.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button onClick={() => navigate('/report')} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-600)]">
            <PlusCircle className="h-4 w-4" /> Report an Issue
          </button>
          <button onClick={() => navigate('/map')} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-navy-800)] hover:bg-[var(--color-paper)]">
            <MapIcon className="h-4 w-4" /> Explore Live Map
          </button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard icon={FileStack} label="Total reports" value={metrics.total} />
        <MetricCard icon={ClockAlert} label="Awaiting verification" value={metrics.awaitingVerification} tone="warning" />
        <MetricCard icon={Wrench} label="In progress" value={metrics.inProgress} tone="warning" />
        <MetricCard icon={CheckCircle2} label="Resolved" value={metrics.resolved} tone="success" />
        <MetricCard icon={Timer} label="Median resolution" value={metrics.medianResolutionDays != null ? `${metrics.medianResolutionDays}d` : '—'} />
        <MetricCard icon={AlertOctagon} label="High priority open" value={metrics.highPriorityUnresolved} tone="critical" />
      </section>

      {/* Map + filters */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <SectionHeading title="Filters" />
          <IssueFilters value={filters} onChange={setFilters} />
        </Card>
        <div className="space-y-3">
          <MapView issues={filtered} selectedIssueId={selectedId} onSelectIssue={setSelectedId} heightClassName="h-[420px]" />
          {selectedId && (() => {
            const issue = filtered.find((i) => i.id === selectedId)
            return issue ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-3">
                <IssueCard issue={issue} />
                <button onClick={() => navigate(`/issues/${issue.id}`)} className="ml-3 flex-shrink-0 rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-paper)]">
                  View details
                </button>
              </div>
            ) : null
          })()}
        </div>
      </section>

      {/* Recent reports */}
      <section>
        <SectionHeading title="Recent community reports" description={`${filtered.length} matching the current filters`} />
        {recent.length === 0 ? (
          <EmptyState title="No reports yet" description="Reports submitted by citizens will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recent.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        )}
      </section>

      {/* Analytics */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionHeading title="Issues reported over time" description="Last 21 days" />
          <TrendChart data={trend} />
        </Card>
        <Card className="p-4">
          <SectionHeading title="Status breakdown" />
          <StatusPieChart data={statuses.map((s) => ({ name: s.status, value: s.value }))} />
          <ul className="mt-1 space-y-1 text-xs text-[var(--color-navy-600)]">
            {statuses.filter((s) => s.value > 0).map((s) => (
              <li key={s.status} className="flex justify-between"><span>{STATUS_LABELS[s.status]}</span><span className="font-semibold">{s.value}</span></li>
            ))}
          </ul>
        </Card>
        <Card className="p-4 lg:col-span-3">
          <SectionHeading title="Category distribution" />
          <CategoryBarChart data={categories} />
        </Card>
      </section>

      {/* Transparency */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <SectionHeading title="Recently resolved" description="Closed out by municipal teams" />
          <div className="space-y-2">
            {recentlyResolved.length === 0 && <p className="text-sm text-[var(--color-slate-500)]">Nothing resolved yet.</p>}
            {recentlyResolved.map((i) => (
              <button key={i.id} onClick={() => navigate(`/issues/${i.id}`)} className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-paper)]">
                <span className="truncate font-medium text-[var(--color-navy-900)]">{i.title}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-[var(--color-slate-500)]">{timeAgo(i.updatedAt)}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeading title="Needs community verification" description="Help confirm these are still accurate" />
          <div className="space-y-2">
            {needsVerification.length === 0 && <p className="text-sm text-[var(--color-slate-500)]">All caught up.</p>}
            {needsVerification.map((i) => (
              <button key={i.id} onClick={() => navigate(`/issues/${i.id}`)} className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-paper)]">
                <span className="truncate font-medium text-[var(--color-navy-900)]">{i.title}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-[var(--color-slate-500)]">{i.location.neighborhood}</span>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
