import type { CivicIssue, IssueCategory } from '../types'
import { haversineDistanceMeters } from './geo'

// Exposed so the UI, tests, and the municipal console all agree on the same
// configuration -- tune these here, not inline where they're used.
export const DUPLICATE_CONFIG = {
  distanceThresholdMeters: 75,
  descriptionOverlapThreshold: 0.18,
}

// Categories that are considered interchangeable for duplicate-matching purposes
// because citizens commonly mislabel these against each other (e.g. a waterlogged
// street is often filed as either "waterlogging" or "drainage").
const COMPATIBLE_CATEGORY_GROUPS: IssueCategory[][] = [
  ['waterlogging', 'drainage'],
  ['pothole', 'infrastructure'],
]

export function categoriesCompatible(a: IssueCategory, b: IssueCategory): boolean {
  if (a === b) return true
  return COMPATIBLE_CATEGORY_GROUPS.some((group) => group.includes(a) && group.includes(b))
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'on', 'in', 'at', 'of', 'to', 'and',
  'near', 'this', 'that', 'it', 'has', 'have', 'been', 'for', 'with', 'very', 'please',
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )
}

/** Jaccard overlap between two descriptions' significant tokens, 0..1. */
export function descriptionOverlap(a: string, b: string): number {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let intersection = 0
  for (const w of ta) if (tb.has(w)) intersection++
  const union = ta.size + tb.size - intersection
  return union === 0 ? 0 : intersection / union
}

export interface DuplicateSuggestion {
  issue: CivicIssue
  distanceMeters: number
  descriptionOverlap: number
  categoryCompatible: boolean
  confidence: 'likely' | 'possible'
}

/**
 * Finds existing, non-merged-away issues that are plausibly duplicates of the
 * candidate (by location + category + description signal). This is a *suggestion*
 * surfaced to a human (citizen or officer) -- it never auto-merges or auto-rejects.
 */
export function findDuplicateCandidates(
  candidate: Pick<CivicIssue, 'category' | 'description' | 'location' | 'id'>,
  existingIssues: CivicIssue[],
  config = DUPLICATE_CONFIG,
): DuplicateSuggestion[] {
  const results: DuplicateSuggestion[] = []

  for (const issue of existingIssues) {
    if (issue.id === candidate.id) continue
    if (issue.status === 'duplicate' || issue.status === 'rejected') continue
    if (!categoriesCompatible(candidate.category, issue.category)) continue

    const distanceMeters = haversineDistanceMeters(candidate.location, issue.location)
    if (distanceMeters > config.distanceThresholdMeters) continue

    const overlap = descriptionOverlap(candidate.description, issue.description)

    // Within distance + compatible category is already a "possible" match;
    // meaningful description overlap (or very close proximity) raises it to "likely".
    const confidence: DuplicateSuggestion['confidence'] =
      overlap >= config.descriptionOverlapThreshold || distanceMeters <= 25 ? 'likely' : 'possible'

    results.push({
      issue,
      distanceMeters: Math.round(distanceMeters),
      descriptionOverlap: Math.round(overlap * 100) / 100,
      categoryCompatible: true,
      confidence,
    })
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters)
}
