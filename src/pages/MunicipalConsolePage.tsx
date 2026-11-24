import { useMemo, useState } from 'react'
import { ShieldAlert, Search } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { SectionHeading, Card, Button } from '../components/ui/primitives'
import { MetricCard } from '../components/ui/MetricCard'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { CATEGORY_LABELS, STATUS_LABELS, formatDate } from '../lib/format'
import { computeOverviewMetrics, wardVolume, categoryDistribution } from '../lib/analytics'
import { computePriority } from '../lib/prioritization'
import { CategoryBarChart, WardBarChart } from '../components/analytics/Charts'
import { SEED_WARDS } from '../data/seedWards'
import { FileStack, ClockAlert, Wrench, CheckCircle2, AlertOctagon } from 'lucide-react'
import { OfficerActionModal } from '../components/municipal/OfficerActionModal'
import type { IssueCategory, IssueStatus } from '../types'

type PriorityFilter = '' | 'low' | 'medium' | 'high' | 'critical'

export default function MunicipalConsolePage() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('')
  const [wardFilter, setWardFilter] = useState('')
  const [managingId, setManagingId] = useState<string | null>(null)

  const metrics = useMemo(() => computeOverviewMetrics(state.issues), [state.issues])
  const wardData = useMemo(() => wardVolume(state.issues), [state.issues])
  const categories = useMemo(() => categoryDistribution(state.issues), [state.issues])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.issues
      .filter((i) => i.status !== 'duplicate')
      .filter((i) => !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
      .filter((i) => !statusFilter || i.status === statusFilter)
      .filter((i) => !categoryFilter || i.category === categoryFilter)
      .filter((i) => !wardFilter || i.location.ward === wardFilter)
      .filter((i) => !priorityFilter || computePriority(i).level === priorityFilter)
      .map((i) => ({ issue: i, priority: computePriority(i) }))
      .sort((a, b) => b.priority.score - a.priority.score)
  }, [state.issues, search, statusFilter, categoryFilter, wardFilter, priorityFilter])

  const aging = useMemo(() => {
    const now = Date.now()
    return state.issues
      .filter((i) => !['resolved', 'rejected', 'duplicate'].includes(i.status))
      .map((i) => ({ issue: i, ageDays: Math.round((now - new Date(i.reportedAt).getTime()) / 86400000) }))
      .sort((a, b) => b.ageDays - a.ageDays)
      .slice(0, 5)
  }, [state.issues])

  const managingIssue = state.issues.find((i) => i.id === managingId)
  const isOfficer = state.currentRole === 'officer'

  return (
    <div className="space-y-6">
      <SectionHeading title="Municipal Operations Console" description="Ward Officer workspace — demo role, not real authorization" />

      {!isOfficer && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> You're viewing as a citizen. Switch to the officer role to manage reports — this is a frontend-only demo switch, not real access control.</span>
          <Button variant="secondary" onClick={() => dispatch({ type: 'SWITCH_ROLE', role: 'officer' })}>Switch to Officer</Button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon={FileStack} label="New reports" value={metrics.awaitingVerification} />
        <MetricCard icon={ClockAlert} label="Awaiting verification" value={metrics.awaitingVerification} tone="warning" />
        <MetricCard icon={Wrench} label="In-progress orders" value={metrics.inProgress} tone="warning" />
        <MetricCard icon={CheckCircle2} label="Resolved" value={metrics.resolved} tone="success" />
        <MetricCard icon={AlertOctagon} label="High priority open" value={metrics.highPriorityUnresolved} tone="critical" />
      </section>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-navy-400)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID or title" className="form-input w-56 pl-8" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')} className="form-input w-auto">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as IssueCategory | '')} className="form-input w-auto">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} className="form-input w-auto">
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="form-input w-auto">
            <option value="">All wards</option>
            {SEED_WARDS.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-paper)] text-xs text-[var(--color-slate-500)]">
            <tr>
              <th className="px-3 py-2.5 font-medium">ID</th>
              <th className="px-3 py-2.5 font-medium">Title</th>
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="px-3 py-2.5 font-medium">Ward</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Reported</th>
              <th className="px-3 py-2.5 font-medium">Confirms</th>
              <th className="px-3 py-2.5 font-medium">Team</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ issue, priority }) => (
              <tr key={issue.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-paper)]">
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[var(--color-navy-700)]">{issue.id}</td>
                <td className="max-w-[220px] truncate px-3 py-2.5">{issue.title}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{CATEGORY_LABELS[issue.category]}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{issue.location.ward.replace(/^Ward \d+ – /, '')}</td>
                <td className="px-3 py-2.5"><PriorityBadge level={priority.level} score={priority.score} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={issue.status} /></td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{formatDate(issue.reportedAt)}</td>
                <td className="px-3 py-2.5 text-xs">{new Set(issue.votes.filter((v) => v.type === 'confirm').map((v) => v.voterId)).size}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{issue.assignedTeam ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Button variant="secondary" disabled={!isOfficer} onClick={() => setManagingId(issue.id)} className="!px-2 !py-1 text-xs">Manage</Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-[var(--color-slate-500)]">No reports match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Analytics */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionHeading title="Report volume by ward" />
          <WardBarChart data={wardData} />
        </Card>
        <Card className="p-4">
          <SectionHeading title="Category distribution" />
          <CategoryBarChart data={categories} />
        </Card>
      </section>

      <Card className="p-4">
        <SectionHeading title="Aging unresolved issues" description="Oldest unresolved reports, by days open" />
        <div className="space-y-2">
          {aging.map(({ issue, ageDays }) => (
            <div key={issue.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              <span className="truncate font-medium text-[var(--color-navy-900)]">{issue.id} · {issue.title}</span>
              <span className="ml-2 flex-shrink-0 text-xs font-semibold text-red-700">{ageDays}d open</span>
            </div>
          ))}
        </div>
      </Card>

      {managingIssue && <OfficerActionModal issue={managingIssue} allIssues={state.issues} onClose={() => setManagingId(null)} />}
    </div>
  )
}
