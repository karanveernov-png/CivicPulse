import { describe, it, expect } from 'vitest'
import { haversineDistanceMeters, isWithinDelhiBounds, nearestNeighborhood, buildLocation, DELHI_NEIGHBORHOODS } from '../lib/geo'

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 28.6315, lng: 77.2167 }
    expect(haversineDistanceMeters(p, p)).toBeCloseTo(0, 5)
  })

  it('computes a known real-world distance (Connaught Place to Karol Bagh) within a sane range', () => {
    const cp = { lat: 28.6315, lng: 77.2167 }
    const kb = { lat: 28.6519, lng: 77.1909 }
    const d = haversineDistanceMeters(cp, kb)
    // These two Delhi neighborhoods are roughly 3-4km apart.
    expect(d).toBeGreaterThan(2500)
    expect(d).toBeLessThan(5000)
  })

  it('is symmetric', () => {
    const a = { lat: 28.60, lng: 77.20 }
    const b = { lat: 28.70, lng: 77.10 }
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 6)
  })

  it('scales roughly linearly for small displacements', () => {
    const base = { lat: 28.6315, lng: 77.2167 }
    const near = { lat: 28.6316, lng: 77.2167 } // ~11m north
    const far = { lat: 28.6335, lng: 77.2167 } // ~222m north (20x)
    const dNear = haversineDistanceMeters(base, near)
    const dFar = haversineDistanceMeters(base, far)
    expect(dFar / dNear).toBeGreaterThan(15)
    expect(dFar / dNear).toBeLessThan(25)
  })
})

describe('isWithinDelhiBounds', () => {
  it('accepts coordinates inside the Delhi demo bounding box', () => {
    expect(isWithinDelhiBounds(28.63, 77.21)).toBe(true)
  })
  it('rejects coordinates far outside Delhi (e.g. Mumbai)', () => {
    expect(isWithinDelhiBounds(19.076, 72.8777)).toBe(false)
  })
  it('rejects coordinates just outside the box edges', () => {
    expect(isWithinDelhiBounds(29.5, 77.2)).toBe(false)
    expect(isWithinDelhiBounds(28.6, 78.0)).toBe(false)
  })
})

describe('nearestNeighborhood / buildLocation', () => {
  it('finds the exact seeded neighborhood when given its own coordinates', () => {
    for (const n of DELHI_NEIGHBORHOODS) {
      expect(nearestNeighborhood(n.lat, n.lng).name).toBe(n.name)
    }
  })

  it('buildLocation attaches a neighborhood, ward, and approximate address', () => {
    const loc = buildLocation(28.6315, 77.2167)
    expect(loc.neighborhood).toBe('Connaught Place')
    expect(loc.ward).toContain('New Delhi')
    expect(loc.approximateAddress).toMatch(/Connaught Place/)
  })
})
