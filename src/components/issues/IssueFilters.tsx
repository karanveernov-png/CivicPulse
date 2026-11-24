import { Search } from 'lucide-react'
import type { IssueCategory, IssueStatus, IssueSeverity } from '../../types'
import { CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '../../lib/format'
import type { IssueFilterState } from './filterIssues'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as IssueCategory[]
const ALL_STATUSES = Object.keys(STATUS_LABELS) as IssueStatus[]
const ALL_SEVERITIES = Object.keys(SEVERITY_LABELS) as IssueSeverity[]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function IssueFilters({ value, onChange, compact = false }: { value: IssueFilterState; onChange: (v: IssueFilterState) => void; compact?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-navy-400)]" />
        <input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search by title, ID, or neighborhood"
          className="w-full rounded-lg border border-[var(--color-border-strong)] bg-white py-2 pl-8 pr-3 text-sm placeholder:text-[var(--color-navy-400)] focus:border-[var(--color-accent)]"
          aria-label="Search issues"
        />
      </div>

      <FilterGroup label="Category">
        {ALL_CATEGORIES.map((c) => (
          <Pill key={c} active={value.categories.includes(c)} onClick={() => onChange({ ...value, categories: toggle(value.categories, c) })}>
            {CATEGORY_LABELS[c]}
          </Pill>
        ))}
      </FilterGroup>

      {!compact && (
        <>
          <FilterGroup label="Status">
            {ALL_STATUSES.map((s) => (
              <Pill key={s} active={value.statuses.includes(s)} onClick={() => onChange({ ...value, statuses: toggle(value.statuses, s) })}>
                {STATUS_LABELS[s]}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Severity">
            {ALL_SEVERITIES.map((s) => (
              <Pill key={s} active={value.severities.includes(s)} onClick={() => onChange({ ...value, severities: toggle(value.severities, s) })}>
                {SEVERITY_LABELS[s]}
              </Pill>
            ))}
          </FilterGroup>
        </>
      )}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-[var(--color-slate-500)]">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-600)]'
          : 'border-[var(--color-border-strong)] bg-white text-[var(--color-navy-600)] hover:bg-[var(--color-paper)]'
      }`}
    >
      {children}
    </button>
  )
}
