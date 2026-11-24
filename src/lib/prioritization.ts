import type { CivicIssue, IssueCategory, PriorityBreakdown } from '../types'

// Categories where unresolved issues carry direct physical safety risk.
// This weighting exists so popularity cannot outrank genuine safety concerns.
const SAFETY_CRITICAL_CATEGORIES: IssueCategory[] = ['pothole', 'waterlogging', 'streetlight', 'drainage']

const SEVERITY_POINTS: Record<CivicIssue['severityReported'], number> = {
  low: 8,
  medium: 18,
  high: 28,
  critical: 38,
}

const MAX_CONFIRM_POINTS = 16
const MAX_SUPPORT_POINTS = 10
const MAX_AGE_POINTS = 18
const SAFETY_BONUS = 10
const UNRESOLVED_BONUS = 6

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function daysSince(iso: string, now: Date): number {
  const ms = now.getTime() - new Date(iso).getTime()
  return Math.max(0, ms / (1000 * 60 * 60 * 24))
}

/**
 * Deterministic, explainable 0-100 priority score. Every factor is capped so that
 * raw vote counts cannot dominate the score indefinitely, and safety-critical
 * categories receive a fixed bonus so popularity alone cannot outrank a hazard.
 * This is a demo heuristic, not a validated public-safety standard.
 */
export function computePriority(issue: CivicIssue, now: Date = new Date()): PriorityBreakdown {
  const factors: { label: string; contribution: number }[] = []

  const severityPoints = SEVERITY_POINTS[issue.severityReported]
  factors.push({ label: `Reported severity (${issue.severityReported})`, contribution: severityPoints })

  const uniqueConfirmers = new Set(
    issue.votes.filter((v) => v.type === 'confirm').map((v) => v.voterId),
  ).size
  const confirmPoints = clamp(uniqueConfirmers * 4, 0, MAX_CONFIRM_POINTS)
  if (confirmPoints > 0) factors.push({ label: `${uniqueConfirmers} community confirmation(s)`, contribution: confirmPoints })

  const uniqueSupporters = new Set(
    issue.votes.filter((v) => v.type === 'support').map((v) => v.voterId),
  ).size
  const supportPoints = clamp(uniqueSupporters * 1.5, 0, MAX_SUPPORT_POINTS)
  if (supportPoints > 0) factors.push({ label: `${uniqueSupporters} unique supporter(s)`, contribution: Math.round(supportPoints) })

  const age = daysSince(issue.reportedAt, now)
  const agePoints = clamp(age * 1.2, 0, MAX_AGE_POINTS)
  if (agePoints > 0) factors.push({ label: `Open for ${Math.round(age)} day(s)`, contribution: Math.round(agePoints) })

  const isSafety = SAFETY_CRITICAL_CATEGORIES.includes(issue.category)
  if (isSafety) factors.push({ label: 'Safety-related category', contribution: SAFETY_BONUS })

  const unresolved = !['resolved', 'rejected', 'duplicate'].includes(issue.status)
  if (unresolved) factors.push({ label: 'Currently unresolved', contribution: UNRESOLVED_BONUS })

  const rawTotal = factors.reduce((sum, f) => sum + f.contribution, 0)
  const score = clamp(Math.round(rawTotal), 0, 100)

  let level: PriorityBreakdown['level']
  if (score >= 80) level = 'critical'
  else if (score >= 60) level = 'high'
  else if (score >= 35) level = 'medium'
  else level = 'low'

  const parts: string[] = []
  parts.push(
    `${level[0].toUpperCase()}${level.slice(1)} priority: reported as ${issue.severityReported} severity`,
  )
  if (uniqueConfirmers > 0) parts.push(`confirmed by ${uniqueConfirmers} community member(s)`)
  if (isSafety) parts.push('involves a direct safety risk')
  if (unresolved && age >= 1) parts.push(`unresolved for ${Math.round(age)} day(s)`)
  const explanation = parts.join(', ') + '.'

  return { score, level, explanation, factors }
}
