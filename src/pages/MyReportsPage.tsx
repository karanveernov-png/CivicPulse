import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, PlusCircle } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { IssueCard } from '../components/issues/IssueCard'
import { IssueFilters } from '../components/issues/IssueFilters'
import { applyFilters, DEFAULT_FILTERS } from '../components/issues/filterIssues'
import { SectionHeading, EmptyState, Card, Button } from '../components/ui/primitives'

export default function MyReportsPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const myIssues = state.issues.filter((i) => i.reporterId === state.currentUserId)
  const filtered = useMemo(() => applyFilters(myIssues, filters), [myIssues, filters])

  return (
    <div className="space-y-4">
      <SectionHeading
        title="My Reports"
        description={`${myIssues.length} report${myIssues.length === 1 ? '' : 's'} submitted by you in this demo session`}
        action={<Button variant="primary" onClick={() => navigate('/report')}><PlusCircle className="h-4 w-4" /> New report</Button>}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Filters</p>
          <IssueFilters value={filters} onChange={setFilters} compact />
        </Card>
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No reports yet"
              description="Reports you submit will show up here so you can track their status through to resolution."
              action={<Button variant="primary" onClick={() => navigate('/report')}>Report an Issue</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filtered.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
