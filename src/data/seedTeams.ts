import type { MunicipalTeam } from '../types'

// Simulated municipal teams for demo work assignment -- not real government departments.
export const SEED_TEAMS: MunicipalTeam[] = [
  { id: 'team-road', name: 'Road Maintenance', domain: 'Roads & Potholes', categories: ['pothole', 'infrastructure'] },
  { id: 'team-sanitation', name: 'Sanitation', domain: 'Waste Management', categories: ['garbage'] },
  { id: 'team-electrical', name: 'Electrical Maintenance', domain: 'Street Lighting', categories: ['streetlight'] },
  { id: 'team-drainage', name: 'Drainage Response', domain: 'Waterlogging & Drains', categories: ['waterlogging', 'drainage'] },
  { id: 'team-water', name: 'Water Supply', domain: 'Potable Water Services', categories: ['water_supply'] },
]

export function teamForCategory(category: string): MunicipalTeam | undefined {
  return SEED_TEAMS.find((t) => t.categories.includes(category as never))
}
