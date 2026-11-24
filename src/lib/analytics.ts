import type { CivicIssue, IssueCategory, IssueStatus } from '../types'
import { CATEGORY_LABELS } from './format'
import { computePriority } from './prioritization'

function isCountable(issue: CivicIssue): boolean {
  // Merged-away duplicates are excluded from operational counts so they aren't
  // double-counted alongside the canonical issue they were merged into.
  return issue.status !== 'duplicate'
}

export function computeOverviewMetrics(issues: CivicIssue[]) {
  const countable = issues.filter(isCountable)
  const total = countable.length
  const awaitingVerification = countable.filter((i) => i.status === 'reported').length
  const inProgress = countable.filter((i) => i.status === 'in_progress').length
  const resolved = countable.filter((i) => i.status === 'resolved').length
  const highPriorityUnresolved = countable.filter((i) => {
    if (['resolved', 'rejected'].includes(i.status)) return false
    const p = computePriority(i)
    return p.level === 'high' || p.level === 'critical'
  }).length

  const resolutionDurationsMs = countable
    .filter((i) => i.status === 'resolved' && i.resolution)
    .map((i) => new Date(i.resolution!.recordedAt).getTime() - new Date(i.reportedAt).getTime())
    .sort((a, b) => a - b)

  let medianResolutionDays: number | null = null
  if (resolutionDurationsMs.length > 0) {
    const mid = Math.floor(resolutionDurationsMs.length / 2)
    const medianMs = resolutionDurationsMs.length % 2 === 0
      ? (resolutionDurationsMs[mid - 1] + resolutionDurationsMs[mid]) / 2
      : resolutionDurationsMs[mid]
    medianResolutionDays = Math.round((medianMs / (1000 * 60 * 60 * 24)) * 10) / 10
  }

  return { total, awaitingVerification, inProgress, resolved, highPriorityUnresolved, medianResolutionDays }
}

export function categoryDistribution(issues: CivicIssue[]): { name: string; value: number }[] {
  const countable = issues.filter(isCountable)
  const counts = new Map<IssueCategory, number>()
  for (const i of countable) counts.set(i.category, (counts.get(i.category) ?? 0) + 1)
  return Array.from(counts.entries()).map(([cat, value]) => ({ name: CATEGORY_LABELS[cat], value })).sort((a, b) => b.value - a.value)
}

export function statusBreakdown(issues: CivicIssue[]): { name: string; value: number; status: IssueStatus }[] {
  const countable = issues.filter(isCountable)
  const order: IssueStatus[] = ['reported', 'verified', 'in_progress', 'resolved', 'rejected', 'reopened']
  return order.map((status) => ({ name: status, status, value: countable.filter((i) => i.status === status).length }))
}

export function issuesOverTime(issues: CivicIssue[], days = 21): { date: string; count: number }[] {
  const now = new Date()
  const buckets: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const count = issues.filter((issue) => {
      const reported = new Date(issue.reportedAt)
      return reported.toDateString() === day.toDateString()
    }).length
    buckets.push({ date: key, count })
  }
  return buckets
}

export function wardVolume(issues: CivicIssue[]): { ward: string; open: number; resolved: number }[] {
  const countable = issues.filter(isCountable)
  const map = new Map<string, { open: number; resolved: number }>()
  for (const i of countable) {
    const entry = map.get(i.location.ward) ?? { open: 0, resolved: 0 }
    if (i.status === 'resolved') entry.resolved += 1
    else entry.open += 1
    map.set(i.location.ward, entry)
  }
  return Array.from(map.entries()).map(([ward, v]) => ({ ward: ward.replace(/^Ward \d+ – /, ''), ...v }))
}
