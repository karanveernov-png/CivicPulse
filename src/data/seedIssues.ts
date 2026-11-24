import type {
  CivicIssue, IssueCategory, IssueSeverity, IssueStatus, StatusTimelineEvent, CommunityVote, AuditEvent,
} from '../types'
import { DELHI_NEIGHBORHOODS } from '../lib/geo'
import { TEMPLATES, REPORTER_NAMES } from './seedTemplates'
import { teamForCategory } from './seedTeams'

// Deterministic PRNG (mulberry32) so re-generating the seed set (e.g. after a
// "Reset Demo Data") produces the same stable dataset every time within a session.
function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)

interface Spec {
  category: IssueCategory
  neighborhoodIndex: number
  severity: IssueSeverity
  status: IssueStatus
  daysAgo: number
  templateIndex: number
  confirm: number
  support: number
  notPresent: number
  hasPhoto: boolean
  reporterIndex: number
}

// Explicit spec table: deliberately distributed across statuses so the dashboard,
// map, and municipal console all have a convincing mixture to demonstrate. Indices
// into DELHI_NEIGHBORHOODS: 0 CP, 1 Karol Bagh, 2 Lajpat Nagar, 3 Dwarka, 4 Rohini,
// 5 Saket, 6 Civil Lines, 7 Shahdara, 8 Janakpuri.
const SPECS: Spec[] = [
  { category: 'pothole', neighborhoodIndex: 0, severity: 'high', status: 'in_progress', daysAgo: 9, templateIndex: 0, confirm: 6, support: 11, notPresent: 0, hasPhoto: true, reporterIndex: 0 },
  { category: 'pothole', neighborhoodIndex: 0, severity: 'high', status: 'reported', daysAgo: 1, templateIndex: 2, confirm: 1, support: 2, notPresent: 0, hasPhoto: true, reporterIndex: 1 }, // near-duplicate of #0 (same neighborhood, close coords, same category)
  { category: 'pothole', neighborhoodIndex: 3, severity: 'critical', status: 'verified', daysAgo: 5, templateIndex: 2, confirm: 9, support: 14, notPresent: 0, hasPhoto: true, reporterIndex: 2 },
  { category: 'pothole', neighborhoodIndex: 4, severity: 'medium', status: 'resolved', daysAgo: 28, templateIndex: 3, confirm: 4, support: 6, notPresent: 1, hasPhoto: true, reporterIndex: 3 },
  { category: 'pothole', neighborhoodIndex: 8, severity: 'low', status: 'reported', daysAgo: 2, templateIndex: 1, confirm: 0, support: 1, notPresent: 0, hasPhoto: false, reporterIndex: 4 },
  { category: 'pothole', neighborhoodIndex: 6, severity: 'medium', status: 'rejected', daysAgo: 14, templateIndex: 3, confirm: 0, support: 2, notPresent: 3, hasPhoto: false, reporterIndex: 5 },

  { category: 'garbage', neighborhoodIndex: 1, severity: 'medium', status: 'in_progress', daysAgo: 6, templateIndex: 0, confirm: 5, support: 7, notPresent: 0, hasPhoto: true, reporterIndex: 6 },
  { category: 'garbage', neighborhoodIndex: 1, severity: 'medium', status: 'reported', daysAgo: 1, templateIndex: 0, confirm: 2, support: 1, notPresent: 0, hasPhoto: true, reporterIndex: 7 }, // near-duplicate of previous
  { category: 'garbage', neighborhoodIndex: 7, severity: 'high', status: 'resolved', daysAgo: 20, templateIndex: 1, confirm: 7, support: 9, notPresent: 0, hasPhoto: true, reporterIndex: 8 },
  { category: 'garbage', neighborhoodIndex: 5, severity: 'low', status: 'verified', daysAgo: 4, templateIndex: 2, confirm: 3, support: 4, notPresent: 0, hasPhoto: false, reporterIndex: 9 },
  { category: 'garbage', neighborhoodIndex: 2, severity: 'medium', status: 'reported', daysAgo: 0.4, templateIndex: 3, confirm: 0, support: 0, notPresent: 0, hasPhoto: true, reporterIndex: 10 },

  { category: 'streetlight', neighborhoodIndex: 2, severity: 'high', status: 'in_progress', daysAgo: 11, templateIndex: 0, confirm: 4, support: 5, notPresent: 0, hasPhoto: false, reporterIndex: 11 },
  { category: 'streetlight', neighborhoodIndex: 6, severity: 'medium', status: 'reported', daysAgo: 3, templateIndex: 1, confirm: 1, support: 2, notPresent: 0, hasPhoto: false, reporterIndex: 12 },
  { category: 'streetlight', neighborhoodIndex: 3, severity: 'low', status: 'resolved', daysAgo: 35, templateIndex: 2, confirm: 2, support: 3, notPresent: 0, hasPhoto: true, reporterIndex: 13 },
  { category: 'streetlight', neighborhoodIndex: 4, severity: 'high', status: 'verified', daysAgo: 2, templateIndex: 3, confirm: 6, support: 8, notPresent: 0, hasPhoto: true, reporterIndex: 14 },

  { category: 'waterlogging', neighborhoodIndex: 7, severity: 'critical', status: 'in_progress', daysAgo: 4, templateIndex: 0, confirm: 11, support: 16, notPresent: 0, hasPhoto: true, reporterIndex: 0 },
  { category: 'waterlogging', neighborhoodIndex: 7, severity: 'high', status: 'reported', daysAgo: 1, templateIndex: 1, confirm: 3, support: 4, notPresent: 0, hasPhoto: true, reporterIndex: 2 }, // near-duplicate
  { category: 'waterlogging', neighborhoodIndex: 3, severity: 'high', status: 'verified', daysAgo: 3, templateIndex: 2, confirm: 8, support: 10, notPresent: 0, hasPhoto: true, reporterIndex: 4 },
  { category: 'waterlogging', neighborhoodIndex: 0, severity: 'medium', status: 'resolved', daysAgo: 40, templateIndex: 3, confirm: 5, support: 6, notPresent: 0, hasPhoto: false, reporterIndex: 6 },

  { category: 'drainage', neighborhoodIndex: 8, severity: 'high', status: 'reported', daysAgo: 2, templateIndex: 0, confirm: 2, support: 3, notPresent: 0, hasPhoto: true, reporterIndex: 8 },
  { category: 'drainage', neighborhoodIndex: 1, severity: 'medium', status: 'in_progress', daysAgo: 8, templateIndex: 1, confirm: 3, support: 5, notPresent: 0, hasPhoto: false, reporterIndex: 10 },
  { category: 'drainage', neighborhoodIndex: 5, severity: 'medium', status: 'resolved', daysAgo: 22, templateIndex: 2, confirm: 4, support: 4, notPresent: 0, hasPhoto: true, reporterIndex: 12 },
  { category: 'drainage', neighborhoodIndex: 6, severity: 'low', status: 'reopened', daysAgo: 6, templateIndex: 3, confirm: 2, support: 3, notPresent: 1, hasPhoto: false, reporterIndex: 14 },

  { category: 'water_supply', neighborhoodIndex: 4, severity: 'high', status: 'verified', daysAgo: 1, templateIndex: 0, confirm: 7, support: 9, notPresent: 0, hasPhoto: false, reporterIndex: 1 },
  { category: 'water_supply', neighborhoodIndex: 2, severity: 'medium', status: 'in_progress', daysAgo: 5, templateIndex: 1, confirm: 3, support: 4, notPresent: 0, hasPhoto: true, reporterIndex: 3 },
  { category: 'water_supply', neighborhoodIndex: 8, severity: 'high', status: 'resolved', daysAgo: 15, templateIndex: 2, confirm: 5, support: 5, notPresent: 0, hasPhoto: false, reporterIndex: 5 },
  { category: 'water_supply', neighborhoodIndex: 0, severity: 'low', status: 'reported', daysAgo: 0.8, templateIndex: 3, confirm: 0, support: 1, notPresent: 0, hasPhoto: false, reporterIndex: 7 },

  { category: 'infrastructure', neighborhoodIndex: 5, severity: 'medium', status: 'reported', daysAgo: 3, templateIndex: 0, confirm: 1, support: 2, notPresent: 0, hasPhoto: true, reporterIndex: 9 },
  { category: 'infrastructure', neighborhoodIndex: 3, severity: 'low', status: 'verified', daysAgo: 7, templateIndex: 1, confirm: 2, support: 2, notPresent: 0, hasPhoto: false, reporterIndex: 11 },
  { category: 'infrastructure', neighborhoodIndex: 1, severity: 'medium', status: 'resolved', daysAgo: 18, templateIndex: 2, confirm: 3, support: 3, notPresent: 0, hasPhoto: true, reporterIndex: 13 },
  { category: 'infrastructure', neighborhoodIndex: 6, severity: 'high', status: 'rejected', daysAgo: 10, templateIndex: 3, confirm: 0, support: 1, notPresent: 4, hasPhoto: false, reporterIndex: 0 },

  { category: 'other', neighborhoodIndex: 2, severity: 'low', status: 'reported', daysAgo: 1.5, templateIndex: 0, confirm: 0, support: 1, notPresent: 0, hasPhoto: false, reporterIndex: 2 },
  { category: 'other', neighborhoodIndex: 8, severity: 'medium', status: 'in_progress', daysAgo: 12, templateIndex: 1, confirm: 2, support: 3, notPresent: 0, hasPhoto: true, reporterIndex: 4 },
  { category: 'other', neighborhoodIndex: 4, severity: 'low', status: 'verified', daysAgo: 4, templateIndex: 2, confirm: 1, support: 2, notPresent: 0, hasPhoto: false, reporterIndex: 6 },
]

function jitteredCoords(neighborhoodIndex: number, salt: number): { lat: number; lng: number } {
  const n = DELHI_NEIGHBORHOODS[neighborhoodIndex]
  // ~1 degree latitude is ~111km; convert a meter radius to a rough degree jitter.
  const maxDegJitter = n.radiusMeters / 111000
  const angle = rand() * Math.PI * 2 + salt
  const radius = rand() * maxDegJitter
  return {
    lat: Math.round((n.lat + Math.cos(angle) * radius) * 100000) / 100000,
    lng: Math.round((n.lng + Math.sin(angle) * radius) * 100000) / 100000,
  }
}

function makeVotes(confirm: number, support: number, notPresent: number, baseTime: Date): CommunityVote[] {
  const votes: CommunityVote[] = []
  let counter = 0
  const push = (type: CommunityVote['type'], count: number) => {
    for (let i = 0; i < count; i++) {
      counter++
      const t = new Date(baseTime.getTime() + counter * 3 * 60 * 60 * 1000)
      votes.push({
        id: `seed-vote-${counter}-${type}-${Math.round(baseTime.getTime())}`,
        voterId: `seed-voter-${counter}-${Math.round(rand() * 1e6)}`,
        type,
        timestamp: t.toISOString(),
      })
    }
  }
  push('confirm', confirm)
  push('support', support)
  push('not_present', notPresent)
  return votes
}

function buildTimeline(status: IssueStatus, reportedAt: Date, team?: string): StatusTimelineEvent[] {
  const events: StatusTimelineEvent[] = []
  let t = reportedAt.getTime()
  const add = (status: IssueStatus, actor: StatusTimelineEvent['actor'], actorLabel: string, hoursLater: number, note?: string, reason?: string) => {
    t += hoursLater * 60 * 60 * 1000
    events.push({ id: `tl-${events.length}-${t}`, status, timestamp: new Date(t).toISOString(), actor, actorLabel, note, reason })
  }
  add('reported', 'citizen', 'Citizen report submitted', 0)
  if (status === 'reported') return events
  add('verified', 'officer', 'Ward Officer', 10, 'Field inspection confirms the reported issue.')
  if (status === 'verified') return events
  if (status === 'rejected') {
    events.pop()
    add('rejected', 'officer', 'Ward Officer', 14, undefined, 'Could not be located at the reported coordinates during inspection.')
    return events
  }
  add('in_progress', 'officer', team ? `${team} Team` : 'Municipal Team', 20, 'Work order issued and crew dispatched.')
  if (status === 'in_progress') return events
  if (status === 'resolved') {
    add('resolved', 'officer', team ? `${team} Team` : 'Municipal Team', 48, 'Repair work completed and verified on site.')
    return events
  }
  if (status === 'reopened') {
    add('resolved', 'officer', team ? `${team} Team` : 'Municipal Team', 48, 'Repair work completed and verified on site.')
    add('reopened', 'citizen', 'Citizen report', 72, undefined, 'Issue recurred shortly after the initial repair.')
    return events
  }
  return events
}

function buildAudit(status: IssueStatus): AuditEvent[] {
  const events: AuditEvent[] = [
    { id: 'aud-1', timestamp: new Date().toISOString(), actorLabel: 'System', action: 'Report created', detail: 'Issue entered the system via citizen report.' },
  ]
  if (status === 'verified' || status === 'in_progress' || status === 'resolved' || status === 'reopened') {
    events.push({ id: 'aud-2', timestamp: new Date().toISOString(), actorLabel: 'Ward Officer', action: 'Verified', detail: 'Field inspection completed.' })
  }
  return events
}

// A handful of seeded reports are attributed to the demo citizen so "My Reports"
// has believable content immediately on first launch, without requiring the
// visitor to submit anything first.
const MY_REPORT_INDICES = new Set([0, 6, 13, 20, 27])

export function generateSeedIssues(): CivicIssue[] {
  const now = new Date()
  const issues: CivicIssue[] = SPECS.map((spec, i) => {
    const template = TEMPLATES[spec.category][spec.templateIndex % TEMPLATES[spec.category].length]
    const neighborhood = DELHI_NEIGHBORHOODS[spec.neighborhoodIndex]
    const coords = jitteredCoords(spec.neighborhoodIndex, i)
    const reportedAt = new Date(now.getTime() - spec.daysAgo * 24 * 60 * 60 * 1000)
    const team = teamForCategory(spec.category)
    const timeline = buildTimeline(spec.status, reportedAt, team?.name)
    const reporter = REPORTER_NAMES[spec.reporterIndex % REPORTER_NAMES.length]

    const id = `CP-${(1000 + i).toString()}`
    const isAssigned = ['in_progress', 'resolved', 'reopened'].includes(spec.status)

    const issue: CivicIssue = {
      id,
      title: template.title.replace('{n}', neighborhood.name),
      description: template.description.replace(/{n}/g, neighborhood.name),
      category: spec.category,
      severityReported: spec.severity,
      status: spec.status,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        neighborhood: neighborhood.name,
        ward: neighborhood.ward,
        approximateAddress: `Near ${neighborhood.name}, Delhi`,
      },
      photoUrl: spec.hasPhoto ? `/issues/${spec.category}.jpg` : undefined,
      reportedAt: reportedAt.toISOString(),
      updatedAt: timeline[timeline.length - 1]?.timestamp ?? reportedAt.toISOString(),
      reporterId: MY_REPORT_INDICES.has(i) ? 'demo-citizen-1' : `seed-citizen-${spec.reporterIndex}`,
      reporterLabel: MY_REPORT_INDICES.has(i) ? 'You (Demo Citizen)' : reporter,
      assignedTeam: isAssigned ? team?.name : undefined,
      timeline,
      comments: [],
      votes: makeVotes(spec.confirm, spec.support, spec.notPresent, reportedAt),
      officerVerified: spec.status !== 'reported',
      rejectionReason: spec.status === 'rejected' ? 'Could not be located at the reported coordinates during inspection.' : undefined,
      reopenReason: spec.status === 'reopened' ? 'Issue recurred shortly after the initial repair.' : undefined,
      resolution: spec.status === 'resolved' || spec.status === 'reopened'
        ? {
          note: 'Repair completed by the assigned crew; site inspected and confirmed clear.',
          photoUrl: spec.hasPhoto ? `/issues/${spec.category}.jpg` : undefined,
          isIllustrative: true,
          recordedAt: timeline.find((e) => e.status === 'resolved')?.timestamp ?? timeline[timeline.length - 1].timestamp,
          recordedBy: team ? `${team.name} Team` : 'Municipal Team',
        }
        : undefined,
      auditTrail: buildAudit(spec.status),
      seeded: true,
    }
    return issue
  })

  // Wire up a couple of explicit duplicate merges among the intentionally
  // near-identical pairs above (indices 0/1 pothole-CP, 6/7 garbage-KarolBagh).
  const canonicalA = issues[0]
  const dupA = issues[1]
  dupA.status = 'duplicate'
  dupA.duplicateOf = canonicalA.id
  dupA.timeline.push({
    id: 'tl-dup-a', status: 'duplicate', timestamp: new Date().toISOString(), actor: 'officer',
    actorLabel: 'Ward Officer', note: `Merged into ${canonicalA.id} as a duplicate report (same location and issue type).`,
  })
  canonicalA.canonicalFor = [dupA.id]

  const canonicalB = issues[6]
  const dupB = issues[7]
  dupB.status = 'duplicate'
  dupB.duplicateOf = canonicalB.id
  dupB.timeline.push({
    id: 'tl-dup-b', status: 'duplicate', timestamp: new Date().toISOString(), actor: 'officer',
    actorLabel: 'Ward Officer', note: `Merged into ${canonicalB.id} as a duplicate report (same location and issue type).`,
  })
  canonicalB.canonicalFor = [dupB.id]

  // Issues 15/16 (waterlogging, Shahdara) are left as live duplicate *candidates*
  // (not yet merged) so the municipal console has something to actually review.

  return issues
}
