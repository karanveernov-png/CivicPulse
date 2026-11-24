import type { IssueStatus } from '../types'

// Valid forward/lateral transitions for the municipal console. Keeping this as a
// single table makes the workflow explicit and testable, instead of scattering
// `if` chains across the UI.
export const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported: ['verified', 'rejected', 'duplicate'],
  verified: ['in_progress', 'rejected', 'duplicate'],
  in_progress: ['resolved', 'reopened'],
  resolved: ['reopened'],
  rejected: ['reopened'],
  reopened: ['verified', 'in_progress'],
  duplicate: [],
}

export function canTransition(from: IssueStatus, to: IssueStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function nextStatusOptions(from: IssueStatus): IssueStatus[] {
  return VALID_TRANSITIONS[from] ?? []
}
