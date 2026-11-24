import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LocateFixed, RotateCcw, AlertTriangle } from 'lucide-react'
import type { CivicIssue } from '../../types'
import { issuesToGeoJSON, STATUS_MAP_COLORS } from './mapIssueLayer'
import { BASEMAP_STYLE } from './basemap'
import { useToast } from '../../state/ToastContext'

const SOURCE_ID = 'civicpulse-issues'

interface MapViewProps {
  issues: CivicIssue[]
  selectedIssueId?: string | null
  onSelectIssue?: (id: string) => void
  heightClassName?: string
  interactive?: boolean
}

export function MapView({ issues, selectedIssueId, onSelectIssue, heightClassName = 'h-[520px]', interactive = true }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const issuesRef = useRef(issues)
  issuesRef.current = issues
  const { showToast } = useToast()

  const fitToIssues = useCallback(() => {
    const map = mapRef.current
    const current = issuesRef.current
    if (!map || current.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    current.forEach((i) => bounds.extend([i.location.lng, i.location.lat]))
    map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 500 })
  }, [])

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [77.19, 28.63],
        zoom: 10.4,
        attributionControl: false,
        cooperativeGestures: false,
      })
    } catch {
      setStatus('error')
      return
    }
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap contributors © CARTO' }), 'bottom-right')

    map.on('error', () => setStatus((s) => (s === 'ready' ? s : 'error')))

    map.on('load', () => {
      map.resize()
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: issuesToGeoJSON(issuesRef.current),
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 15,
      })

      map.addLayer({
        id: 'clusters', type: 'circle', source: SOURCE_ID, filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#2258CF', 10, '#17304F', 25, '#0B1A30'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 25, 25],
          'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF',
        },
      })
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: SOURCE_ID, filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12, 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': '#FFFFFF' },
      })
      map.addLayer({
        id: 'unclustered-point', type: 'circle', source: SOURCE_ID, filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'status'],
            'reported', STATUS_MAP_COLORS.reported,
            'verified', STATUS_MAP_COLORS.verified,
            'in_progress', STATUS_MAP_COLORS.in_progress,
            'resolved', STATUS_MAP_COLORS.resolved,
            'rejected', STATUS_MAP_COLORS.rejected,
            'reopened', STATUS_MAP_COLORS.reopened,
            'duplicate', STATUS_MAP_COLORS.duplicate,
            '#6B7280',
          ],
          'circle-radius': ['interpolate', ['linear'], ['get', 'priorityScore'], 0, 8, 100, 15],
          'circle-stroke-width': ['case', ['==', ['get', 'id'], selectedIssueId ?? ''], 3, 1.5],
          'circle-stroke-color': ['case', ['==', ['get', 'id'], selectedIssueId ?? ''], '#0B1A30', '#FFFFFF'],
        },
      })
      map.addLayer({
        id: 'unclustered-label', type: 'symbol', source: SOURCE_ID, filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'categoryCode'], 'text-size': 10, 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': '#FFFFFF' },
      })

      map.on('click', 'clusters', (e: maplibregl.MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = features[0]?.properties?.cluster_id
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource
        if (clusterId == null) return
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const coords = (features[0].geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
          map.easeTo({ center: coords, zoom })
        }).catch(() => {})
      })

      map.on('click', 'unclustered-point', (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id
        if (id) onSelectIssue?.(id)
      })

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })

      setStatus('ready')
      fitToIssues()
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the source data in sync with filtered issues.
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(issuesToGeoJSON(issues))
  }, [issues, status])

  // Re-paint selection highlight when selectedIssueId changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready' || !map.getLayer('unclustered-point')) return
    map.setPaintProperty('unclustered-point', 'circle-stroke-width', ['case', ['==', ['get', 'id'], selectedIssueId ?? ''], 3, 1.5])
    map.setPaintProperty('unclustered-point', 'circle-stroke-color', ['case', ['==', ['get', 'id'], selectedIssueId ?? ''], '#0B1A30', '#FFFFFF'])
  }, [selectedIssueId, status])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not available in this browser.', 'error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const map = mapRef.current
        if (!map) return
        userMarkerRef.current?.remove()
        const el = document.createElement('div')
        el.style.cssText = 'width:14px;height:14px;border-radius:9999px;background:#2258CF;border:3px solid white;box-shadow:0 0 0 2px rgba(34,88,207,0.35)'
        userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map)
        map.flyTo({ center: [longitude, latitude], zoom: 14 })
      },
      () => showToast('Location permission denied or unavailable.', 'error'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] ${heightClassName}`}>
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Interactive map of reported civic issues in Delhi" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-[var(--color-slate-500)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            Loading map…
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-paper)] p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <p className="text-sm font-medium text-[var(--color-navy-900)]">The live map couldn't be loaded.</p>
          <p className="max-w-xs text-xs text-[var(--color-slate-500)]">
            This can happen if the basemap provider is unreachable. Reports are still fully browsable from the list view.
          </p>
        </div>
      )}

      {interactive && status === 'ready' && (
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white/95 px-2.5 py-1.5 text-xs font-medium text-[var(--color-navy-800)] shadow-sm hover:bg-white"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Locate me
          </button>
          <button
            onClick={fitToIssues}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white/95 px-2.5 py-1.5 text-xs font-medium text-[var(--color-navy-800)] shadow-sm hover:bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset view
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="absolute bottom-3 left-3 rounded-lg border border-[var(--color-border)] bg-white/95 px-3 py-2 text-[11px] text-[var(--color-navy-700)] shadow-sm">
          <p className="mb-1 font-semibold text-[var(--color-navy-900)]">Legend</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <LegendDot color={STATUS_MAP_COLORS.reported} label="Reported" />
            <LegendDot color={STATUS_MAP_COLORS.verified} label="Verified" />
            <LegendDot color={STATUS_MAP_COLORS.in_progress} label="In progress" />
            <LegendDot color={STATUS_MAP_COLORS.resolved} label="Resolved" />
          </div>
          <p className="mt-1 text-[10px] text-[var(--color-slate-500)]">Marker size reflects priority score</p>
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
