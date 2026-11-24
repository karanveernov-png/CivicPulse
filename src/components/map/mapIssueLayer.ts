import type { CivicIssue, IssueCategory } from '../../types'
import { computePriority } from '../../lib/prioritization'

export const CATEGORY_CODE: Record<IssueCategory, string> = {
  pothole: 'P', garbage: 'G', streetlight: 'L', waterlogging: 'W',
  drainage: 'D', water_supply: 'S', infrastructure: 'I', other: 'O',
}

export const STATUS_MAP_COLORS: Record<string, string> = {
  reported: '#6B7280',
  verified: '#2563EB',
  in_progress: '#B45309',
  resolved: '#15803D',
  rejected: '#B91C1C',
  reopened: '#C2410C',
  duplicate: '#7C3AED',
}

import type { FeatureCollection } from 'geojson'

export function issuesToGeoJSON(issues: CivicIssue[]): FeatureCollection {
  const now = new Date()
  return {
    type: 'FeatureCollection',
    features: issues.map((issue) => {
      const priority = computePriority(issue, now)
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [issue.location.lng, issue.location.lat] },
        properties: {
          id: issue.id,
          status: issue.status,
          category: issue.category,
          categoryCode: CATEGORY_CODE[issue.category],
          priorityScore: priority.score,
          priorityLevel: priority.level,
          title: issue.title,
        },
      }
    }),
  }
}
