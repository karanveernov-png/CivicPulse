import { describe, it, expect } from 'vitest'
import { canTransition, nextStatusOptions, VALID_TRANSITIONS } from '../lib/statusWorkflow'
import type { IssueStatus } from '../types'

describe('status workflow', () => {
  it('allows reported -> verified', () => {
    expect(canTransition('reported', 'verified')).toBe(true)
  })
  it('allows reported -> rejected', () => {
    expect(canTransition('reported', 'rejected')).toBe(true)
  })
  it('does not allow reported -> resolved directly (must pass through verification/progress)', () => {
    expect(canTransition('reported', 'resolved')).toBe(false)
  })
  it('does not allow resolved -> in_progress directly (must reopen first)', () => {
    expect(canTransition('resolved', 'in_progress')).toBe(false)
  })
  it('allows resolved -> reopened', () => {
    expect(canTransition('resolved', 'reopened')).toBe(true)
  })
  it('allows rejected -> reopened (citizens can contest a rejection)', () => {
    expect(canTransition('rejected', 'reopened')).toBe(true)
  })
  it('does not allow any transition out of duplicate', () => {
    expect(nextStatusOptions('duplicate')).toHaveLength(0)
  })
  it('every transition target is itself a key of the state machine (no dangling states)', () => {
    const allStates = Object.keys(VALID_TRANSITIONS) as IssueStatus[]
    for (const from of allStates) {
      for (const to of VALID_TRANSITIONS[from]) {
        expect(allStates).toContain(to)
      }
    }
  })
})
