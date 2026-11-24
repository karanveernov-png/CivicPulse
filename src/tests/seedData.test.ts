import { describe, it, expect } from 'vitest'
import { generateSeedIssues } from '../data/seedIssues'
import { isWithinDelhiBounds } from '../lib/geo'

describe('seed dataset integrity', () => {
  const issues = generateSeedIssues()

  it('generates between 30 and 40 records', () => {
    expect(issues.length).toBeGreaterThanOrEqual(30)
    expect(issues.length).toBeLessThanOrEqual(40)
  })

  it('every issue has a unique, stable-format id', () => {
    const ids = issues.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^CP-\d+$/)
  })

  it('every coordinate falls within the Delhi demo bounding box', () => {
    for (const issue of issues) {
      expect(isWithinDelhiBounds(issue.location.lat, issue.location.lng)).toBe(true)
    }
  })

  it('includes a mix of all seven primary categories', () => {
    const categories = new Set(issues.map((i) => i.category))
    expect(categories.size).toBeGreaterThanOrEqual(6)
  })

  it('includes at least one issue in each core status', () => {
    const statuses = new Set(issues.map((i) => i.status))
    for (const s of ['reported', 'verified', 'in_progress', 'resolved']) {
      expect(statuses.has(s as never)).toBe(true)
    }
  })

  it('every resolved issue has resolution evidence with an isIllustrative flag', () => {
    for (const issue of issues.filter((i) => i.status === 'resolved')) {
      expect(issue.resolution).toBeDefined()
      expect(issue.resolution?.isIllustrative).toBe(true)
    }
  })

  it('every in_progress or resolved issue has a timeline that passed through verified first', () => {
    for (const issue of issues.filter((i) => ['in_progress', 'resolved'].includes(i.status))) {
      const statuses = issue.timeline.map((e) => e.status)
      expect(statuses).toContain('verified')
      expect(statuses).toContain('reported')
    }
  })

  it('timeline events are in non-decreasing chronological order', () => {
    for (const issue of issues) {
      const times = issue.timeline.map((e) => new Date(e.timestamp).getTime())
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
      }
    }
  })

  it('a rejected issue carries a rejection reason', () => {
    for (const issue of issues.filter((i) => i.status === 'rejected')) {
      expect(issue.rejectionReason).toBeTruthy()
    }
  })

  it('vote unique-voter counts are internally consistent (no two votes share an id)', () => {
    for (const issue of issues) {
      const voteIds = issue.votes.map((v) => v.id)
      expect(new Set(voteIds).size).toBe(voteIds.length)
    }
  })

  it('is deterministic across repeated generation (same seed -> same ids and count)', () => {
    const again = generateSeedIssues()
    expect(again.length).toBe(issues.length)
    expect(again.map((i) => i.id)).toEqual(issues.map((i) => i.id))
  })
})
