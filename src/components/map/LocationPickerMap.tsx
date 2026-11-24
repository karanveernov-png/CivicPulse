import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { LocateFixed, AlertTriangle } from 'lucide-react'
import { isWithinDelhiBounds } from '../../lib/geo'
import { BASEMAP_STYLE } from './basemap'
import { useToast } from '../../state/ToastContext'

interface LocationPickerMapProps {
  value: { lat: number; lng: number } | null
  onChange: (loc: { lat: number; lng: number }) => void
}

export function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const { showToast } = useToast()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: value ? [value.lng, value.lat] : [77.19, 28.63],
        zoom: value ? 14 : 10.4,
        attributionControl: false,
      })
    } catch {
      setStatus('error')
      return
    }
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap contributors © CARTO' }), 'bottom-right')
    map.on('error', () => setStatus((s) => (s === 'ready' ? s : 'error')))
    map.on('load', () => setStatus('ready'))

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      onChangeRef.current({ lat: Math.round(e.lngLat.lat * 100000) / 100000, lng: Math.round(e.lngLat.lng * 100000) / 100000 })
    })

    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep marker synced with value.
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    if (!value) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    if (!markerRef.current) {
      const el = document.createElement('div')
      el.style.cssText = 'width:20px;height:20px;border-radius:9999px 9999px 9999px 0;background:#EF7A3C;border:2.5px solid white;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)'
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom-left' }).setLngLat([value.lng, value.lat]).addTo(map)
    } else {
      markerRef.current.setLngLat([value.lng, value.lat])
    }
  }, [value, status])

  const handleLocateMe = () => {
    if (!navigator.geolocation) { showToast('Geolocation is not available in this browser.', 'error'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onChange({ lat: Math.round(latitude * 100000) / 100000, lng: Math.round(longitude * 100000) / 100000 })
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 })
      },
      () => showToast('Location permission denied or unavailable.', 'error'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const outOfBounds = value ? !isWithinDelhiBounds(value.lat, value.lng) : false

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-[var(--color-border)]">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Map for selecting the issue location" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-paper)] p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-xs text-[var(--color-slate-500)]">Map unavailable. You can still submit using "Locate me" once permission is granted.</p>
        </div>
      )}
      {status === 'ready' && (
        <button onClick={handleLocateMe} className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-white">
          <LocateFixed className="h-3.5 w-3.5" /> Use my location
        </button>
      )}
      {!value && status === 'ready' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-[var(--color-navy-950)]/85 px-3 py-1.5 text-xs text-white">
          Tap the map to drop a pin
        </div>
      )}
      {outOfBounds && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs text-white">
          This point falls outside the Delhi demo coverage area.
        </div>
      )}
    </div>
  )
}
