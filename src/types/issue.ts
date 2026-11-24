export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'waterlogging'
  | 'drainage'
  | 'water_supply'
  | 'infrastructure'
  | 'other'

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IssueStatus =
  | 'reported'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'reopened'
  | 'duplicate'

export interface GeoLocation {
  lat: number
  lng: number
  neighborhood: string
  ward: string
  approximateAddress?: string
}

export type TimelineActor = 'citizen' | 'officer' | 'system'

export interface StatusTimelineEvent {
  id: string
  status: IssueStatus
  timestamp: string // ISO
  actor: TimelineActor
  actorLabel: string
  note?: string
  reason?: string
}

export interface IssueComment {
  id: string
  authorLabel: string
  authorRole: TimelineActor
  timestamp: string
  text: string
}

export interface CommunityVote {
  id: string
  voterId: string
  type: 'confirm' | 'support' | 'not_present'
  timestamp: string
  comment?: string
}

export interface ResolutionEvidence {
  note: string
  photoUrl?: string
  isIllustrative: true
  recordedAt: string
  recordedBy: string
}

export interface DuplicateRelationship {
  canonicalIssueId: string
  mergedIssueIds: string[]
  mergedBy: string
  mergedAt: string
  distanceMeters: number
  note?: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  actorLabel: string
  action: string
  detail: string
}

export interface PriorityBreakdown {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  explanation: string
  factors: { label: string; contribution: number }[]
}

export interface CivicIssue {
  id: string
  title: string
  description: string
  category: IssueCategory
  severityReported: IssueSeverity
  status: IssueStatus
  location: GeoLocation
  photoUrl?: string
  reportedAt: string // ISO
  updatedAt: string
  reporterId: string
  reporterLabel: string
  assignedTeam?: string
  timeline: StatusTimelineEvent[]
  comments: IssueComment[]
  votes: CommunityVote[]
  officerVerified: boolean
  rejectionReason?: string
  reopenReason?: string
  resolution?: ResolutionEvidence
  duplicateOf?: string // canonical issue id, if this issue was merged away
  canonicalFor?: string[] // ids merged into this one
  auditTrail: AuditEvent[]
  seeded: boolean
}
