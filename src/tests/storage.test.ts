import { describe, it, expect, beforeEach } from 'vitest'
import { loadPersistedState, savePersistedState, STORAGE_SCHEMA_VERSION } from '../lib/storage'
import { generateSeedIssues } from '../data/seedIssues'

describe('storage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    expect(loadPersistedState()).toBeNull()
  })

  it('round-trips a valid state', () => {
    const issues = generateSeedIssues().slice(0, 3)
    savePersistedState({ issues, currentUserId: 'demo-citizen-1', currentRole: 'citizen' })
    const loaded = loadPersistedState()
    expect(loaded).not.toBeNull()
    expect(loaded?.issues).toHaveLength(3)
    expect(loaded?.schemaVersion).toBe(STORAGE_SCHEMA_VERSION)
  })

  it('recovers gracefully (returns null) from malformed JSON', () => {
    localStorage.setItem('civicpulse:state', '{not valid json')
    expect(loadPersistedState()).toBeNull()
  })

  it('recovers gracefully from a schema version mismatch', () => {
    localStorage.setItem('civicpulse:state', JSON.stringify({ schemaVersion: 9999, issues: [], currentUserId: 'x', currentRole: 'citizen' }))
    expect(loadPersistedState()).toBeNull()
  })

  it('recovers gracefully when issues is missing or malformed', () => {
    localStorage.setItem('civicpulse:state', JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, issues: 'not-an-array', currentUserId: 'x', currentRole: 'citizen' }))
    expect(loadPersistedState()).toBeNull()
  })

  it('recovers gracefully when currentRole is an invalid value', () => {
    const issues = generateSeedIssues().slice(0, 1)
    localStorage.setItem('civicpulse:state', JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, issues, currentUserId: 'x', currentRole: 'superadmin' }))
    expect(loadPersistedState()).toBeNull()
  })
})
