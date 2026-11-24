import type { CivicIssue, IssueCategory, IssueStatus, IssueSeverity } from '../../types'

export interface IssueFilterState {
  search: string
  categories: IssueCategory[]
  statuses: IssueStatus[]
  severities: IssueSeverity[]
}

export const DEFAULT_FILTERS: IssueFilterState = {
  search: '', categories: [], statuses: [], severities: [],
}

export function applyFilters(issues: CivicIssue[], filters: IssueFilterState): CivicIssue[] {
  const q = filters.search.trim().toLowerCase()
  return issues.filter((issue) => {
    if (q && !issue.title.toLowerCase().includes(q) && !issue.id.toLowerCase().includes(q) && !issue.location.neighborhood.toLowerCase().includes(q)) return false
    if (filters.categories.length && !filters.categories.includes(issue.category)) return false
    if (filters.statuses.length && !filters.statuses.includes(issue.status)) return false
    if (filters.severities.length && !filters.severities.includes(issue.severityReported)) return false
    return true
  })
}
