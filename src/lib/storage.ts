import type { CivicIssue, CommunityVote } from '../types'

// Bump this if the shape of persisted state changes in a way old data can't satisfy.
export const STORAGE_SCHEMA_VERSION = 2
const STORAGE_KEY = 'civicpulse:state'

export interface PersistedState {
  schemaVersion: number
  issues: CivicIssue[]
  currentUserId: string
  currentRole: 'citizen' | 'officer'
  savedAt: string
}

function isValidVote(v: unknown): v is CommunityVote {
  if (typeof v !== 'object' || v === null) return false
  const vote = v as Record<string, unknown>
  return typeof vote.id === 'string' && typeof vote.voterId === 'string' && typeof vote.type === 'string'
}

function isValidIssue(i: unknown): i is CivicIssue {
  if (typeof i !== 'object' || i === null) return false
  const issue = i as Record<string, unknown>
  return (
    typeof issue.id === 'string' &&
    typeof issue.title === 'string' &&
    typeof issue.category === 'string' &&
    typeof issue.status === 'string' &&
    typeof issue.location === 'object' &&
    Array.isArray(issue.timeline) &&
    Array.isArray(issue.votes) &&
    (issue.votes as unknown[]).every(isValidVote)
  )
}

/**
 * Reads persisted app state from localStorage, validating shape and schema version.
 * Returns null (rather than throwing) on any malformed/missing data so callers can
 * safely fall back to fresh seed data.
 */
export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) return null
    if (!Array.isArray(parsed.issues) || !parsed.issues.every(isValidIssue)) return null
    if (typeof parsed.currentUserId !== 'string') return null
    if (parsed.currentRole !== 'citizen' && parsed.currentRole !== 'officer') return null
    return parsed as PersistedState
  } catch {
    return null
  }
}

export function savePersistedState(state: Omit<PersistedState, 'schemaVersion' | 'savedAt'>): void {
  try {
    const toSave: PersistedState = {
      ...state,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Storage can fail (quota, private browsing). Demo state simply won't persist
    // across a refresh in that case -- the app keeps working in-memory.
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function getDemoVoterId(): string {
  try {
    const existing = localStorage.getItem('civicpulse:voterId')
    if (existing) return existing
    const id = `voter-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('civicpulse:voterId', id)
    return id
  } catch {
    return 'voter-session'
  }
}

// Image persistence: small demo photos (user-submitted reports) are stored as
// object URLs in-memory plus a data-URL fallback capped in size for localStorage,
// per issue id, so they survive a refresh without risking quota exhaustion.
const PHOTO_PREFIX = 'civicpulse:photo:'
const MAX_PHOTO_BYTES = 450_000 // keep well under typical 5MB localStorage quota

export function savePhotoDataUrl(issueId: string, dataUrl: string): boolean {
  if (dataUrl.length > MAX_PHOTO_BYTES) return false
  try {
    localStorage.setItem(PHOTO_PREFIX + issueId, dataUrl)
    return true
  } catch {
    return false
  }
}

export function loadPhotoDataUrl(issueId: string): string | null {
  try {
    return localStorage.getItem(PHOTO_PREFIX + issueId)
  } catch {
    return null
  }
}
