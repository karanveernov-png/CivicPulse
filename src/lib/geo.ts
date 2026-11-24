import type { GeoLocation } from '../types'

const EARTH_RADIUS_M = 6371000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine great-circle distance between two lat/lng points, in meters.
 * Used for duplicate-proximity detection across the demo dataset.
 */
export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_M * c
}

// Rough bounding box for the Delhi NCT demo area. Used only as a plausibility
// check for manually-dropped map pins -- this is not a legal/administrative boundary.
export const DELHI_BOUNDS = {
  minLat: 28.40,
  maxLat: 28.90,
  minLng: 76.80,
  maxLng: 77.40,
}

export function isWithinDelhiBounds(lat: number, lng: number): boolean {
  return (
    lat >= DELHI_BOUNDS.minLat &&
    lat <= DELHI_BOUNDS.maxLat &&
    lng >= DELHI_BOUNDS.minLng &&
    lng <= DELHI_BOUNDS.maxLng
  )
}

export interface NeighborhoodSeed {
  name: string
  ward: string
  lat: number
  lng: number
  radiusMeters: number
}

// Seed neighborhoods with approximate real-world centers used to generate
// plausible coordinates and to estimate a neighborhood for a manually-dropped pin.
export const DELHI_NEIGHBORHOODS: NeighborhoodSeed[] = [
  { name: 'Connaught Place', ward: 'Ward 1 – New Delhi', lat: 28.6315, lng: 77.2167, radiusMeters: 900 },
  { name: 'Karol Bagh', ward: 'Ward 2 – Karol Bagh', lat: 28.6519, lng: 77.1909, radiusMeters: 1000 },
  { name: 'Lajpat Nagar', ward: 'Ward 3 – South Delhi', lat: 28.5677, lng: 77.2431, radiusMeters: 900 },
  { name: 'Dwarka', ward: 'Ward 4 – Dwarka', lat: 28.5921, lng: 77.0460, radiusMeters: 1400 },
  { name: 'Rohini', ward: 'Ward 5 – North West Delhi', lat: 28.7041, lng: 77.1025, radiusMeters: 1300 },
  { name: 'Saket', ward: 'Ward 6 – South Delhi', lat: 28.5245, lng: 77.2066, radiusMeters: 900 },
  { name: 'Civil Lines', ward: 'Ward 7 – North Delhi', lat: 28.6792, lng: 77.2214, radiusMeters: 800 },
  { name: 'Shahdara', ward: 'Ward 8 – East Delhi', lat: 28.6694, lng: 77.2890, radiusMeters: 1000 },
  { name: 'Janakpuri', ward: 'Ward 9 – West Delhi', lat: 28.6219, lng: 77.0877, radiusMeters: 1100 },
]

export function nearestNeighborhood(lat: number, lng: number): NeighborhoodSeed {
  let best = DELHI_NEIGHBORHOODS[0]
  let bestDist = Infinity
  for (const n of DELHI_NEIGHBORHOODS) {
    const d = haversineDistanceMeters({ lat, lng }, { lat: n.lat, lng: n.lng })
    if (d < bestDist) {
      bestDist = d
      best = n
    }
  }
  return best
}

export function buildLocation(lat: number, lng: number): GeoLocation {
  const n = nearestNeighborhood(lat, lng)
  return {
    lat,
    lng,
    neighborhood: n.name,
    ward: n.ward,
    approximateAddress: `Near ${n.name}, Delhi (estimated from coordinates)`,
  }
}
