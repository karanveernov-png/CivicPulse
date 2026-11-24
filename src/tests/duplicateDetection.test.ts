import { describe, it, expect } from 'vitest'
import { categoriesCompatible, descriptionOverlap, findDuplicateCandidates, DUPLICATE_CONFIG } from '../lib/duplicateDetection'
import { generateSeedIssues } from '../data/seedIssues'
import type { CivicIssue } from '../types'

function makeIssue(overrides: Partial<CivicIssue>): CivicIssue {
  const now = new Date().toISOString()
  return {
    id: 'TEST-0', title: 'Test issue', description: 'A generic test description long enough to pass validation checks.',
    category: 'pothole', severityReported: 'medium', status: 'reported',
    location: { lat: 28.6315, lng: 77.2167, neighborhood: 'Connaught Place', ward: 'Ward 1 – New Delhi' },
    reportedAt: now, updatedAt: now, reporterId: 'r1', reporterLabel: 'Tester',
    timeline: [], comments: [], votes: [], officerVerified: false, auditTrail: [], seeded: false,
    ...overrides,
  }
}

describe('categoriesCompatible', () => {
  it('treats identical categories as compatible', () => {
    expect(categoriesCompatible('pothole', 'pothole')).toBe(true)
  })
  it('treats waterlogging and drainage as compatible (common mislabeling)', () => {
    expect(categoriesCompatible('waterlogging', 'drainage')).toBe(true)
    expect(categoriesCompatible('drainage', 'waterlogging')).toBe(true)
  })
  it('treats unrelated categories as incompatible', () => {
    expect(categoriesCompatible('pothole', 'garbage')).toBe(false)
    expect(categoriesCompatible('streetlight', 'water_supply')).toBe(false)
  })
})

describe('descriptionOverlap', () => {
  it('returns 0 for completely disjoint text', () => {
    expect(descriptionOverlap('apple banana cherry', 'xylophone zebra quilt')).toBe(0)
  })
  it('returns a high score for near-identical descriptions', () => {
    const a = 'A large pothole has formed on the main road causing vehicles to swerve'
    const b = 'A large pothole has formed on the main road causing cars to swerve'
    expect(descriptionOverlap(a, b)).toBeGreaterThan(0.5)
  })
  it('is symmetric', () => {
    const a = 'garbage overflowing near the market entrance'
    const b = 'overflowing garbage bin near the market'
    expect(descriptionOverlap(a, b)).toBeCloseTo(descriptionOverlap(b, a), 6)
  })
})

describe('findDuplicateCandidates', () => {
  const nearby = makeIssue({ id: 'EXISTING-1' })
  const farAway = makeIssue({ id: 'EXISTING-2', location: { lat: 28.70, lng: 77.10, neighborhood: 'Rohini', ward: 'Ward 5' } })
  const wrongCategory = makeIssue({ id: 'EXISTING-3', category: 'garbage' })
  const rejected = makeIssue({ id: 'EXISTING-4', status: 'rejected' })

  it('flags an issue within the distance threshold and compatible category', () => {
    const candidate = makeIssue({ id: 'NEW' })
    const results = findDuplicateCandidates(candidate, [nearby, farAway, wrongCategory])
    expect(results.map((r) => r.issue.id)).toContain('EXISTING-1')
  })

  it('excludes issues beyond the configured distance threshold', () => {
    const candidate = makeIssue({ id: 'NEW' })
    const results = findDuplicateCandidates(candidate, [farAway])
    expect(results).toHaveLength(0)
  })

  it('excludes incompatible categories even at distance 0', () => {
    const candidate = makeIssue({ id: 'NEW' })
    const results = findDuplicateCandidates(candidate, [wrongCategory])
    expect(results).toHaveLength(0)
  })

  it('excludes already-rejected and already-merged (duplicate) issues from suggestions', () => {
    const candidate = makeIssue({ id: 'NEW' })
    const duplicateStatus = makeIssue({ id: 'EXISTING-5', status: 'duplicate' })
    const results = findDuplicateCandidates(candidate, [rejected, duplicateStatus])
    expect(results).toHaveLength(0)
  })

  it('never includes the candidate itself even if present in the search set', () => {
    const candidate = makeIssue({ id: 'SELF' })
    const results = findDuplicateCandidates(candidate, [candidate])
    expect(results).toHaveLength(0)
  })

  it('respects a custom (tighter) distance threshold', () => {
    // ~44m north of `nearby` -- inside the default 75m threshold, outside a tight 20m one.
    const candidate = makeIssue({ id: 'NEW', location: { ...nearby.location, lat: nearby.location.lat + 0.0004 } })
    const resultsDefault = findDuplicateCandidates(candidate, [nearby], DUPLICATE_CONFIG)
    const resultsTight = findDuplicateCandidates(candidate, [nearby], { ...DUPLICATE_CONFIG, distanceThresholdMeters: 20 })
    expect(resultsDefault.map((r) => r.issue.id)).toContain('EXISTING-1')
    expect(resultsTight).toHaveLength(0)
  })

  it('marks very close + overlapping-description matches as "likely" rather than "possible"', () => {
    const candidate = makeIssue({ id: 'NEW', description: nearby.description })
    const [result] = findDuplicateCandidates(candidate, [nearby])
    expect(result.confidence).toBe('likely')
  })
})

describe('seed dataset duplicate integrity', () => {
  it('every duplicateOf reference points to an existing issue id', () => {
    const issues = generateSeedIssues()
    const ids = new Set(issues.map((i) => i.id))
    for (const issue of issues) {
      if (issue.duplicateOf) expect(ids.has(issue.duplicateOf)).toBe(true)
    }
  })

  it('every canonicalFor reference points to an existing issue id that in turn points back', () => {
    const issues = generateSeedIssues()
    const byId = new Map(issues.map((i) => [i.id, i]))
    for (const issue of issues) {
      for (const mergedId of issue.canonicalFor ?? []) {
        const merged = byId.get(mergedId)
        expect(merged).toBeDefined()
        expect(merged?.duplicateOf).toBe(issue.id)
      }
    }
  })
})
