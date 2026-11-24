import type { IssueCategory, IssueStatus, IssueSeverity } from '../types'

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: 'Pothole / Road Damage',
  garbage: 'Garbage Overflow',
  streetlight: 'Broken Streetlight',
  waterlogging: 'Waterlogging',
  drainage: 'Drainage Problem',
  water_supply: 'Water Supply',
  infrastructure: 'Damaged Public Infrastructure',
  other: 'Other Civic Issue',
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: 'Reported',
  verified: 'Verified',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  reopened: 'Reopened',
  duplicate: 'Duplicate',
}

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}
