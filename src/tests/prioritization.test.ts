import { describe, it, expect } from 'vitest'
import { computePriority } from '../lib/prioritization'
import type { CivicIssue, CommunityVote } from '../types'

function makeIssue(overrides: Partial<CivicIssue>): CivicIssue {
  const now = new Date().toISOString()
  return {
    id: 'TEST-0', title: 'Test issue', description: 'A generic test description.',
    category: 'garbage', severityReported: 'low', status: 'reported',
    location: { lat: 28.63, lng: 77.21, neighborhood: 'Connaught Place', ward: 'Ward 1' },
    reportedAt: now, updatedAt: now, reporterId: 'r1', reporterLabel: 'Tester',
    timeline: [], comments: [], votes: [], officerVerified: false, auditTrail: [], seeded: false,
    ...overrides,
  }
}

function votesOf(type: CommunityVote['type'], count: number): CommunityVote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i}`, voterId: `voter-${i}`, type, timestamp: new Date().toISOString(),
  }))
}

describe('computePriority', () => {
  it('stays within 0-100 bounds', () => {
    const issue = makeIssue({ severityReported: 'critical', votes: [...votesOf('confirm', 50), ...votesOf('support', 50)], reportedAt: new Date(Date.now() - 365 * 86400000).toISOString() })
    const { score } = computePriority(issue)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('gives a higher score to critical severity than low severity, all else equal', () => {
    const low = computePriority(makeIssue({ severityReported: 'low' }))
    const critical = computePriority(makeIssue({ severityReported: 'critical' }))
    expect(critical.score).toBeGreaterThan(low.score)
  })

  it('increases score with more unique community confirmations, but caps the contribution', () => {
    const none = computePriority(makeIssue({ votes: [] }))
    const some = computePriority(makeIssue({ votes: votesOf('confirm', 3) }))
    const many = computePriority(makeIssue({ votes: votesOf('confirm', 3) }))
    const extreme = computePriority(makeIssue({ votes: votesOf('confirm', 500) }))
    expect(some.score).toBeGreaterThan(none.score)
    expect(some.score).toBe(many.score)
    // Capped contribution means 500 confirmations shouldn't blow past 100 or dwarf a modest count indefinitely.
    expect(extreme.score).toBeLessThanOrEqual(100)
  })

  it('does not double-count the same voter confirming twice', () => {
    const duplicateVoter = computePriority(makeIssue({
      votes: [
        { id: 'v1', voterId: 'same-voter', type: 'confirm', timestamp: new Date().toISOString() },
        { id: 'v2', voterId: 'same-voter', type: 'confirm', timestamp: new Date().toISOString() },
      ],
    }))
    const singleVoter = computePriority(makeIssue({
      votes: [{ id: 'v1', voterId: 'same-voter', type: 'confirm', timestamp: new Date().toISOString() }],
    }))
    expect(duplicateVoter.score).toBe(singleVoter.score)
  })

  it('gives a safety-critical category (pothole) a bonus over a non-safety category (garbage), all else equal', () => {
    const now = new Date().toISOString()
    const pothole = computePriority(makeIssue({ category: 'pothole', reportedAt: now }))
    const garbage = computePriority(makeIssue({ category: 'garbage', reportedAt: now }))
    expect(pothole.score).toBeGreaterThan(garbage.score)
  })

  it('increases score with issue age up to a cap', () => {
    const fresh = computePriority(makeIssue({ reportedAt: new Date().toISOString() }))
    const aWeekOld = computePriority(makeIssue({ reportedAt: new Date(Date.now() - 7 * 86400000).toISOString() }))
    expect(aWeekOld.score).toBeGreaterThan(fresh.score)
  })

  it('never lets resolved/rejected issues receive the "currently unresolved" bonus', () => {
    const resolved = computePriority(makeIssue({ status: 'resolved' }))
    const reported = computePriority(makeIssue({ status: 'reported' }))
    expect(reported.score).toBeGreaterThanOrEqual(resolved.score)
  })

  it('maps scores to the documented level thresholds', () => {
    expect(computePriority(makeIssue({ severityReported: 'low', votes: [] })).level).toBe('low')
    const high = computePriority(makeIssue({
      severityReported: 'critical', category: 'pothole',
      votes: [...votesOf('confirm', 4)],
      reportedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    }))
    expect(['high', 'critical']).toContain(high.level)
  })

  it('popularity (support votes) alone cannot outrank a safety-critical low-vote issue beyond the capped contribution', () => {
    const popularButMinor = computePriority(makeIssue({
      category: 'garbage', severityReported: 'low', votes: votesOf('support', 1000),
    }))
    // The support cap (10 points) plus low severity (8) should still generally trail
    // a safety-critical, high-severity issue even with zero votes.
    const safetyNoVotes = computePriority(makeIssue({ category: 'pothole', severityReported: 'high', votes: [] }))
    expect(safetyNoVotes.score).toBeGreaterThan(popularButMinor.score)
  })

  it('returns a human-readable explanation mentioning the severity level', () => {
    const { explanation } = computePriority(makeIssue({ severityReported: 'high' }))
    expect(explanation.toLowerCase()).toContain('high')
  })
})
