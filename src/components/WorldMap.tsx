import { useEffect, useRef, useState } from 'react'
import { Compass, Globe2, Minus, Plus, RefreshCw, Table2 } from 'lucide-react'
import { AttributionControl, Map as MapLibreMap, type ExpressionSpecification, type GeoJSONSource, type MapLayerMouseEvent, type StyleSpecification } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import {
  countries, formatObservation, getColor, getCountryName, getScale, missingColor,
  type MapMode, type Occurrence, type ResourceDataset,
} from '@elements-map/core'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Props {
  mode: MapMode
  dataset?: ResourceDataset
  sites: Occurrence[]
  selectedCountry: string | null
  selectedSite: Occurrence | undefined
  onCountry: (country: string) => void
  onSite: (id: string) => void
  onTable: () => void
}

interface HoverInfo {
  label: string
  detail: string
  mode: MapMode
}

const emptySites: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] }
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const worldZoom = (width: number) => Math.max(0.05, Math.log2(Math.max(width, 280) / 512) - 0.15)

export default function WorldMap({ mode, dataset, sites, selectedCountry, selectedSite, onCountry, onSite, onTable }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const latest = useRef({ mode, dataset, sites, onCountry, onSite })

  useEffect(() => {
    latest.current = { mode, dataset, sites, onCountry, onSite }
  }, [mode, dataset, sites, onCountry, onSite])

  useEffect(() => {
    const target = container.current
    if (!target) return
    const controller = new AbortController()
    let destroyed = false
    let map: MapLibreMap | undefined
    const resize = new ResizeObserver(() => map?.resize())

    async function initialize() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/countries.geojson`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Country data unavailable: ${response.status}`)
        const geography = await response.json() as FeatureCollection
        if (destroyed) return
        const style: StyleSpecification = {
          version: 8,
          sources: {
            countries: {
              type: 'geojson',
              data: geography,
              promoteId: 'iso3',
              attribution: 'Länder: <a href="https://github.com/nvkelso/natural-earth-vector" target="_blank" rel="noreferrer">Natural Earth</a> · Daten: USGS',
            },
            sites: { type: 'geojson', data: emptySites, cluster: true, clusterRadius: 32, clusterMaxZoom: 5 },
          },
          layers: [
            { id: 'water', type: 'background', paint: { 'background-color': '#183337' } },
            { id: 'countries-fill', type: 'fill', source: 'countries', paint: { 'fill-color': missingColor, 'fill-opacity': 1 } },
            { id: 'countries-borders', type: 'line', source: 'countries', paint: { 'line-color': '#183337', 'line-width': 0.75, 'line-opacity': 0.8 } },
            { id: 'country-hover', type: 'line', source: 'countries', filter: ['==', ['get', 'iso3'], ''], paint: { 'line-color': '#fff5df', 'line-width': 1.7 } },
            { id: 'country-selected', type: 'line', source: 'countries', filter: ['==', ['get', 'iso3'], ''], paint: { 'line-color': '#fff5df', 'line-width': 2.6 } },
            {
              id: 'site-clusters', type: 'circle', source: 'sites', filter: ['has', 'point_count'],
              paint: {
                'circle-color': '#e9ad75', 'circle-opacity': 0.84, 'circle-stroke-color': '#f7dfba',
                'circle-stroke-width': 1.5, 'circle-radius': ['step', ['get', 'point_count'], 10, 8, 14, 30, 18, 100, 23],
              },
            },
            {
              id: 'site-points', type: 'circle', source: 'sites', filter: ['!', ['has', 'point_count']],
              paint: { 'circle-color': '#f3b27d', 'circle-radius': 4.5, 'circle-stroke-width': 1.3, 'circle-stroke-color': '#fff0d6' },
            },
            {
              id: 'site-selected', type: 'circle', source: 'sites', filter: ['==', ['get', 'siteId'], ''],
              paint: { 'circle-color': '#fff4de', 'circle-radius': 7, 'circle-stroke-width': 3, 'circle-stroke-color': '#ee9868' },
            },
          ],
        }
        map = new MapLibreMap({
          container: target!,
          style,
          center: [12, 18],
          zoom: worldZoom(target!.clientWidth),
          minZoom: 0,
          maxZoom: 8,
          maxPitch: 0,
          dragRotate: false,
          touchPitch: false,
          renderWorldCopies: false,
          cooperativeGestures: true,
          attributionControl: false,
          locale: {
            'AttributionControl.ToggleAttribution': 'Quellen anzeigen',
            'CooperativeGesturesHandler.WindowsHelpText': 'Strg + Scrollen zum Zoomen',
            'CooperativeGesturesHandler.MacHelpText': '⌘ + Scrollen zum Zoomen',
            'CooperativeGesturesHandler.MobileHelpText': 'Karte mit zwei Fingern bewegen',
          },
        })
        mapRef.current = map
        map.touchZoomRotate.disableRotation()
        map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
        resize.observe(target!)
        map.on('load', () => { if (!destroyed) setReady(true) })
        map.on('error', () => {
          if (!destroyed) setError('Die Kartenansicht konnte nicht vollständig geladen werden. Alle Zahlen stehen weiterhin in der Datentabelle zur Verfügung.')
        })

        const showHover = (info: HoverInfo) => {
          setHover((previous) => previous?.label === info.label && previous.detail === info.detail && previous.mode === info.mode ? previous : info)
        }
        const clearHover = () => {
          if (destroyed) return
          map!.getCanvas().style.cursor = ''
          map!.setFilter('country-hover', ['==', ['get', 'iso3'], ''])
          setHover(null)
        }
        map.on('mousemove', 'countries-fill', (event: MapLayerMouseEvent) => {
          const current = latest.current
          const code = event.features?.[0]?.properties?.iso3 as string | undefined
          if (current.mode === 'occurrences' || !code) return
          map!.getCanvas().style.cursor = 'pointer'
          map!.setFilter('country-hover', ['==', ['get', 'iso3'], code])
          const record = current.dataset?.records.find((row) => row.country === code)
          showHover({ label: getCountryName(code), detail: record ? formatObservation(record) : 'Keine Angabe im Datensatz', mode: current.mode })
        })
        map.on('mouseleave', 'countries-fill', clearHover)
        map.on('click', 'countries-fill', (event: MapLayerMouseEvent) => {
          const code = event.features?.[0]?.properties?.iso3 as string | undefined
          if (latest.current.mode !== 'occurrences' && code) latest.current.onCountry(code)
        })
        map.on('mousemove', 'site-points', (event: MapLayerMouseEvent) => {
          if (latest.current.mode !== 'occurrences') return
          const id = event.features?.[0]?.properties?.siteId as string | undefined
          const site = latest.current.sites.find((item) => item.id === id)
          if (!site) return
          map!.getCanvas().style.cursor = 'pointer'
          showHover({ label: site.name, detail: 'Historisch dokumentierter Standort · zum Auswählen klicken', mode: 'occurrences' })
        })
        map.on('mouseleave', 'site-points', clearHover)
        map.on('click', 'site-points', (event: MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.siteId as string | undefined
          if (latest.current.mode === 'occurrences' && id) latest.current.onSite(id)
        })
        map.on('mousemove', 'site-clusters', (event: MapLayerMouseEvent) => {
          if (latest.current.mode !== 'occurrences') return
          map!.getCanvas().style.cursor = 'pointer'
          showHover({ label: `${event.features?.[0]?.properties?.point_count} historische Standorte`, detail: 'Zum Vergrößern klicken · keine Aussage über Rohstoffmenge', mode: 'occurrences' })
        })
        map.on('mouseleave', 'site-clusters', clearHover)
        map.on('click', 'site-clusters', async (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0]
          if (!feature || feature.geometry.type !== 'Point' || latest.current.mode !== 'occurrences') return
          const id = Number(feature.properties?.cluster_id)
          const coordinates = feature.geometry.coordinates as [number, number]
          try {
            const zoom = await (map!.getSource('sites') as GeoJSONSource).getClusterExpansionZoom(id)
            if (!destroyed && latest.current.mode === 'occurrences') map!.easeTo({ center: coordinates, zoom, duration: reducedMotion() ? 0 : 500 })
          } catch {
            if (!destroyed) map!.easeTo({ center: coordinates, zoom: Math.min(map!.getZoom() + 1, 8), duration: 0 })
          }
        })
      } catch {
        if (!destroyed && !controller.signal.aborted) setError('Die Weltkarte ist auf diesem Gerät gerade nicht verfügbar. Öffne die Datentabelle oder versuche es erneut.')
      }
    }
    void initialize()
    return () => {
      destroyed = true
      controller.abort()
      resize.disconnect()
      map?.remove()
      mapRef.current = null
    }
  }, [attempt])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    let fill: string | ExpressionSpecification = missingColor
    if (mode !== 'occurrences' && dataset) {
      const scale = getScale(dataset)
      fill = ['match', ['get', 'iso3'], ...dataset.records.flatMap((record) => [record.country, getColor(record.value, scale)]), missingColor] as ExpressionSpecification
    }
    map.setPaintProperty('countries-fill', 'fill-color', fill)
    map.setFilter('country-hover', ['==', ['get', 'iso3'], ''])
    const source = map.getSource('sites') as GeoJSONSource
    source.setData(mode === 'occurrences' ? {
      type: 'FeatureCollection',
      features: sites.map((site) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: site.coordinates },
        properties: { siteId: site.id },
      })),
    } : emptySites)
    for (const layer of ['site-clusters', 'site-points', 'site-selected']) {
      map.setLayoutProperty(layer, 'visibility', mode === 'occurrences' ? 'visible' : 'none')
    }
  }, [mode, dataset, sites, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    map.setFilter('country-selected', ['==', ['get', 'iso3'], mode === 'occurrences' ? '' : selectedCountry ?? ''])
    map.setFilter('site-selected', ['==', ['get', 'siteId'], selectedSite?.id ?? ''])
    if (selectedSite && mode === 'occurrences') {
      map.flyTo({ center: selectedSite.coordinates, zoom: 5.5, duration: reducedMotion() ? 0 : 650 })
    } else if (selectedCountry && mode !== 'occurrences' && countries[selectedCountry]) {
      map.easeTo({ center: countries[selectedCountry].center, zoom: Math.max(map.getZoom(), 1.7), duration: reducedMotion() ? 0 : 500 })
    }
  }, [selectedCountry, selectedSite, mode, ready])

  const retry = () => { setReady(false); setError(null); setHover(null); setAttempt(attempt + 1) }
  const reset = () => {
    if (mapRef.current && container.current) mapRef.current.flyTo({ center: [12, 18], zoom: worldZoom(container.current.clientWidth), duration: reducedMotion() ? 0 : 650 })
  }

  return (
    <div className="world-map" data-testid="map-canvas" data-ready={ready && !error ? 'true' : 'false'}>
      <div ref={container} className="map-canvas-container" role="img" aria-label="Interaktive Weltkarte. Alle Karteninformationen sind auch über die Datentabelle und die Standortliste zugänglich." />
      {!ready && !error && <div className="map-loading" role="status"><Globe2 size={35} strokeWidth={1.2} /><span>Die Welt nimmt Form an …</span></div>}
      {error && <div className="map-error" role="alert"><Globe2 size={34} /><h3>Die Karte braucht einen neuen Anlauf.</h3><p>{error}</p><div><button type="button" onClick={retry}><RefreshCw size={15} /> Erneut versuchen</button><button type="button" onClick={onTable}><Table2 size={15} /> Tabelle öffnen</button></div></div>}
      {ready && !error && (
        <div className="map-controls" aria-label="Kartensteuerung">
          <button type="button" aria-label="Karte vergrößern" title="Vergrößern" onClick={() => mapRef.current?.zoomIn({ duration: reducedMotion() ? 0 : 250 })}><Plus size={18} /></button>
          <button type="button" aria-label="Karte verkleinern" title="Verkleinern" onClick={() => mapRef.current?.zoomOut({ duration: reducedMotion() ? 0 : 250 })}><Minus size={18} /></button>
          <button type="button" aria-label="Weltübersicht wiederherstellen" title="Weltübersicht" onClick={reset}><Compass size={18} /></button>
        </div>
      )}
      {ready && !error && hover?.mode === mode && <div className="map-hover-card" role="status"><strong>{hover.label}</strong><span>{hover.detail}</span></div>}
    </div>
  )
}
