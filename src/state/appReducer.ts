import type { CivicIssue, IssueStatus, AuditEvent, CommunityVote } from '../types'
import { canTransition } from '../lib/statusWorkflow'

export interface AppState {
  issues: CivicIssue[]
  currentUserId: string
  currentRole: 'citizen' | 'officer'
}

export type AppAction =
  | { type: 'ADD_ISSUE'; issue: CivicIssue }
  | { type: 'CAST_VOTE'; issueId: string; voterId: string; voteType: CommunityVote['type']; comment?: string }
  | { type: 'WITHDRAW_VOTE'; issueId: string; voterId: string }
  | { type: 'CHANGE_STATUS'; issueId: string; to: IssueStatus; actorLabel: string; note?: string; reason?: string }
  | { type: 'ASSIGN_TEAM'; issueId: string; team: string; actorLabel: string }
  | { type: 'ATTACH_RESOLUTION'; issueId: string; note: string; photoUrl?: string; actorLabel: string }
  | { type: 'MERGE_DUPLICATE'; canonicalId: string; duplicateId: string; distanceMeters: number; actorLabel: string }
  | { type: 'ADD_COMMENT'; issueId: string; text: string; authorLabel: string; authorRole: 'citizen' | 'officer' }
  | { type: 'SWITCH_ROLE'; role: 'citizen' | 'officer' }
  | { type: 'RESET'; issues: CivicIssue[] }

function touch(issue: CivicIssue): CivicIssue {
  return { ...issue, updatedAt: new Date().toISOString() }
}

function withAudit(issue: CivicIssue, event: Omit<AuditEvent, 'id' | 'timestamp'>): CivicIssue {
  const audit: AuditEvent = { ...event, id: `aud-${issue.auditTrail.length + 1}-${Date.now()}`, timestamp: new Date().toISOString() }
  return { ...issue, auditTrail: [...issue.auditTrail, audit] }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_ISSUE':
      return { ...state, issues: [action.issue, ...state.issues] }

    case 'CAST_VOTE': {
      return {
        ...state,
        issues: state.issues.map((issue) => {
          if (issue.id !== action.issueId) return issue
          // one active vote per voter per issue -- replace rather than duplicate
          const filtered = issue.votes.filter((v) => v.voterId !== action.voterId)
          const vote: CommunityVote = {
            id: `vote-${Date.now()}-${action.voterId}`,
            voterId: action.voterId,
            type: action.voteType,
            timestamp: new Date().toISOString(),
            comment: action.comment,
          }
          return touch({ ...issue, votes: [...filtered, vote] })
        }),
      }
    }

    case 'WITHDRAW_VOTE': {
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.id === action.issueId
            ? touch({ ...issue, votes: issue.votes.filter((v) => v.voterId !== action.voterId) })
            : issue,
        ),
      }
    }

    case 'CHANGE_STATUS': {
      return {
        ...state,
        issues: state.issues.map((issue) => {
          if (issue.id !== action.issueId) return issue
          if (!canTransition(issue.status, action.to)) return issue
          const event = {
            id: `tl-${issue.timeline.length + 1}-${Date.now()}`,
            status: action.to,
            timestamp: new Date().toISOString(),
            actor: 'officer' as const,
            actorLabel: action.actorLabel,
            note: action.note,
            reason: action.reason,
          }
          let next = touch({
            ...issue,
            status: action.to,
            timeline: [...issue.timeline, event],
            officerVerified: action.to === 'verified' ? true : issue.officerVerified,
            rejectionReason: action.to === 'rejected' ? action.reason : issue.rejectionReason,
            reopenReason: action.to === 'reopened' ? action.reason : issue.reopenReason,
          })
          next = withAudit(next, { actorLabel: action.actorLabel, action: `Status → ${action.to}`, detail: action.note ?? action.reason ?? 'Status updated.' })
          return next
        }),
      }
    }

    case 'ASSIGN_TEAM': {
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.id === action.issueId
            ? withAudit(touch({ ...issue, assignedTeam: action.team }), { actorLabel: action.actorLabel, action: 'Team assigned', detail: action.team })
            : issue,
        ),
      }
    }

    case 'ATTACH_RESOLUTION': {
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.id === action.issueId
            ? touch({
                ...issue,
                resolution: {
                  note: action.note,
                  photoUrl: action.photoUrl,
                  isIllustrative: true,
                  recordedAt: new Date().toISOString(),
                  recordedBy: action.actorLabel,
                },
              })
            : issue,
        ),
      }
    }

    case 'MERGE_DUPLICATE': {
      const duplicateIssue = state.issues.find((i) => i.id === action.duplicateId)
      return {
        ...state,
        issues: state.issues.map((issue) => {
          if (issue.id === action.duplicateId) {
            const event = {
              id: `tl-dup-${Date.now()}`, status: 'duplicate' as const, timestamp: new Date().toISOString(),
              actor: 'officer' as const, actorLabel: action.actorLabel,
              note: `Merged into ${action.canonicalId} as a duplicate report (${Math.round(action.distanceMeters)}m away).`,
            }
            return withAudit(touch({ ...issue, status: 'duplicate', duplicateOf: action.canonicalId, timeline: [...issue.timeline, event] }),
              { actorLabel: action.actorLabel, action: 'Merged as duplicate', detail: `Canonical issue: ${action.canonicalId}` })
          }
          if (issue.id === action.canonicalId) {
            const canonicalFor = Array.from(new Set([...(issue.canonicalFor ?? []), action.duplicateId]))
            // Carry over support from the merged report, but never count a voter
            // twice if they'd already confirmed/supported the canonical issue.
            const existingVoterIds = new Set(issue.votes.map((v) => v.voterId))
            const incomingVotes = (duplicateIssue?.votes ?? []).filter((v) => !existingVoterIds.has(v.voterId))
            return withAudit(touch({ ...issue, canonicalFor, votes: [...issue.votes, ...incomingVotes] }),
              { actorLabel: action.actorLabel, action: 'Duplicate merged in', detail: `Merged report: ${action.duplicateId} (${incomingVotes.length} unique voter(s) carried over)` })
          }
          return issue
        }),
      }
    }

    case 'ADD_COMMENT': {
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.id === action.issueId
            ? touch({
                ...issue,
                comments: [...issue.comments, {
                  id: `cmt-${Date.now()}`, authorLabel: action.authorLabel, authorRole: action.authorRole,
                  timestamp: new Date().toISOString(), text: action.text,
                }],
              })
            : issue,
        ),
      }
    }

    case 'SWITCH_ROLE':
      return { ...state, currentRole: action.role }

    case 'RESET':
      return { ...state, issues: action.issues }

    default:
      return state
  }
}
