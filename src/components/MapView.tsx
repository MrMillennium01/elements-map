import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Database, ExternalLink, Factory,
  Globe2, Info, Layers3, MapPin, Search, Share2, Table2, X,
} from 'lucide-react'
import {
  categories, elements, formatAmount, formatObservation, getCountryName, getDataset, getOccurrences,
  getScale, getWorldShare, hasMapData, historicStatuses, mapModes, missingColor, occurrenceNotice,
  rankCountries, supportedSymbols, zeroColor,
  type AtlasState, type ChemicalElement, type MapMode, type Occurrence, type ResourceDataset,
} from '@elements-map/core'
import { CountryTable, OccurrenceTable } from './DataTable'

const WorldMap = lazy(() => import('./WorldMap'))
const modeIcons = { occurrences: MapPin, production: Factory, reserves: Layers3 }

interface Props {
  state: AtlasState
  element: ChemicalElement
  onNavigate: (patch: Partial<AtlasState>) => void
  onElementInfo: () => void
  onSources: () => void
}

function MapLegend({ dataset, occurrences }: { dataset?: ResourceDataset; occurrences: boolean }) {
  if (occurrences) {
    return (
      <div className="map-legend occurrence-legend"><span className="legend-heading">HISTORISCHE STANDORTE</span><div><i className="legend-site-dot" /> Belegter Standort</div><div><i className="legend-cluster-dot" /> Mehrere Standorte · zum Zoomen klicken</div><p>Punktgröße ist keine Rohstoffmenge.</p></div>
    )
  }
  if (!dataset) return null
  const scale = getScale(dataset)
  return (
    <div className="map-legend">
      <span className="legend-heading">MENGE IN TONNEN · {dataset.metric === 'production' ? '2025' : 'STAND 2026'}</span>
      <div className="legend-steps">
        {scale.colors.map((color, index) => (
          <div key={color}><i style={{ background: color }} /><span>{index < 3 ? `≤ ${formatAmount(scale.thresholds[index], true)}` : `> ${formatAmount(scale.thresholds[2], true)}`}</span></div>
        ))}
      </div>
      <div className="legend-missing"><span><i style={{ background: missingColor }} /> Keine Angabe</span><span><i style={{ background: zeroColor }} /> Gemeldet: 0</span></div>
      <p>Relative Klassen je Element und Kennzahl</p>
    </div>
  )
}

function QuantitySidebar({ dataset, country, onCountry, onTable }: {
  dataset: ResourceDataset
  country: string | null
  onCountry: (country: string | null) => void
  onTable: () => void
}) {
  const ranked = rankCountries(dataset.records)
  const selected = country ? dataset.records.find((record) => record.country === country) : undefined
  const share = selected ? getWorldShare(dataset, selected.value) : null
  const top = ranked[0]?.value || 1
  return (
    <aside className="map-sidebar">
      <div className="sidebar-total"><span className="micro-label">{dataset.metric === 'production' ? 'WELTWEITE FÖRDERUNG' : 'WELTWEITE RESERVEN'}</span><div><strong>{dataset.worldTotal.qualifier === 'lower-bound' ? '> ' : '≈ '}{formatAmount(dataset.worldTotal.value, true)}</strong><span>t</span></div><p>{dataset.basis}</p><span className="total-note">{dataset.worldTotal.note ?? 'USGS-Weltwert, einschließlich weiterer Länder'}</span></div>
      {country && (
        <div className="selected-country">
          <button className="icon-button" type="button" aria-label="Länderauswahl aufheben" onClick={() => onCountry(null)}><X size={15} /></button>
          <span className="micro-label">DEINE AUSWAHL</span><h3>{getCountryName(country)}</h3>
          <strong>{selected ? formatObservation(selected) : 'Keine Angabe'}</strong>
          {share !== null && <p>≈ {formatAmount(share)} % des gemeldeten Weltwerts</p>}
          {selected?.status === 'estimated' && <p>Vorläufige Schätzung für 2025</p>}
          {(!selected || selected.value === null) && <p>{selected?.status === 'withheld' ? 'Zum Schutz von Unternehmensdaten nicht veröffentlicht.' : 'Im Länderdatensatz ist keine Menge angegeben. Das ist kein Nachweis dafür, dass hier nichts vorkommt.'}</p>}
          {selected?.note && <p className="country-source-note">{selected.note}</p>}
          <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">Quellennachweis <ExternalLink size={12} /></a>
        </div>
      )}
      <div className="sidebar-section-heading"><h3>Die führenden Länder</h3><span>nach Menge</span></div>
      <ol className="country-rankings">
        {ranked.slice(0, 7).map((record, index) => (
          <li key={record.country}>
            <button type="button" onClick={() => onCountry(record.country)} className={country === record.country ? 'active' : ''}>
              <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="rank-content"><span className="rank-top"><span>{getCountryName(record.country)}</span><strong>{formatAmount(record.value, true)}</strong></span><span className="rank-bar"><span style={{ width: `${record.value / top * 100}%` }} /></span></span>
            </button>
          </li>
        ))}
      </ol>
      <button className="sidebar-link" type="button" onClick={onTable}>Alle Länderwerte ansehen <ArrowRight size={15} /></button>
      <div className="sidebar-footnote"><Info size={14} /><p>Länderfarben und Rangliste zeigen absolute Mengen. Große Flächen bedeuten nicht automatisch große Reserven.</p></div>
    </aside>
  )
}

function OccurrenceSidebar({ sites, selected, onSite, onTable }: {
  sites: Occurrence[]
  selected: Occurrence | undefined
  onSite: (id: string | null) => void
  onTable: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = sites.filter((site) => `${site.name} ${getCountryName(site.country)}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')))
  return (
    <aside className="map-sidebar">
      <div className="sidebar-total"><span className="micro-label">DOKUMENTIERTE STANDORTE</span><div><strong>{formatAmount(sites.length)}</strong><span>im Auszug</span></div><p>Historische Fundstellen</p><span className="total-note">Geografische Auswahl aus dem USGS-MRDS-Archiv</span></div>
      {selected && (
        <div className="selected-country selected-site">
          <button className="icon-button" type="button" aria-label="Standortauswahl aufheben" onClick={() => onSite(null)}><X size={15} /></button>
          <span className="micro-label">DOKUMENTIERTER STANDORT</span><h3>{selected.name}</h3>
          <p>{getCountryName(selected.country)} · Zuordnung näherungsweise</p>
          <p>{Math.abs(selected.coordinates[1]).toFixed(4)}° {selected.coordinates[1] >= 0 ? 'N' : 'S'} · {Math.abs(selected.coordinates[0]).toFixed(4)}° {selected.coordinates[0] >= 0 ? 'O' : 'W'}</p>
          <span className="historic-status">{historicStatuses[selected.historicStatus] ?? selected.historicStatus}</span>
          <p>Historischer Eintrag · Datenklasse {selected.quality} · keine aktuelle Betriebsauskunft</p>
          <a href={selected.sourceUrl} target="_blank" rel="noreferrer">MRDS-Datensatz {selected.id} <ExternalLink size={12} /></a>
        </div>
      )}
      <div className="sidebar-section-heading"><h3>Standorte entdecken</h3><span>alphabetisch</span></div>
      <label className="search-field sidebar-search"><Search size={15} /><input type="search" aria-label="Standorte auf der Karte suchen" placeholder="Standort oder Land" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <ul className="site-list">
        {filtered.slice(0, 6).map((site) => <li key={site.id}><button type="button" className={selected?.id === site.id ? 'active' : ''} onClick={() => onSite(site.id)}><MapPin size={16} /><span><strong>{site.name}</strong><small>{getCountryName(site.country)}</small></span><ArrowUpRight size={14} /></button></li>)}
      </ul>
      {!filtered.length && <p className="sidebar-no-results">Keine passenden Standorte.</p>}
      <button className="sidebar-link" type="button" onClick={onTable}>Alle {sites.length} Standorte ansehen <ArrowRight size={15} /></button>
      <div className="sidebar-footnote"><Info size={14} /><p>Dies ist eine Auswahl, keine Rangliste. Datenbankabdeckung und Punktzahl lassen keine Rückschlüsse auf Rohstoffmengen zu.</p></div>
    </aside>
  )
}

export function MapView({ state, element, onNavigate, onElementInfo, onSources }: Props) {
  const [display, setDisplay] = useState<'map' | 'table'>('map')
  const [country, setCountry] = useState<string | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [shareState, setShareState] = useState<'copied' | 'manual' | null>(null)
  const dataset = state.mode === 'occurrences' ? undefined : getDataset(element.symbol, state.mode)
  const sites = useMemo(() => getOccurrences(element.symbol), [element.symbol])
  const selectedSite = sites.find((site) => site.id === siteId)
  const isOccurrences = state.mode === 'occurrences'
  const available = isOccurrences ? sites.length > 0 : !!dataset
  const family = categories[element.category]
  const mode = mapModes[state.mode]
  const mapElements = elements.filter((item) => hasMapData(item.symbol))
  const otherElements = elements.filter((item) => !hasMapData(item.symbol))

  function changeMode(mode: MapMode) {
    setCountry(null)
    setSiteId(null)
    setShareState(null)
    onNavigate({ mode })
  }

  function changeElement(symbol: string) {
    setCountry(null)
    setSiteId(null)
    setShareState(null)
    onNavigate({ element: symbol })
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareState('copied')
    } catch {
      setShareState('manual')
    }
  }

  return (
    <div className="map-page">
      <section className="map-hero">
        <div><div className="eyebrow"><span className="tiny-dot" /> DER INTERAKTIVE ROHSTOFFATLAS</div><h1>Ein Element.<br className="mobile-break" /> <span>Eine ganze Welt.</span></h1></div>
        <p>Von einem Punkt im Periodensystem<br />zu den Orten, die unsere Welt bewegen.</p>
      </section>

      <div className="map-toolbar">
        <div className="map-element-picker">
          <span className="picker-symbol" style={{ background: family.tint, color: family.color }}>{element.symbol}</span>
          <label><span>DEIN ELEMENT</span><span className="element-select-wrap"><select aria-label="Element auf der Karte" value={element.symbol} onChange={(event) => changeElement(event.target.value)}>
            <optgroup label="Mit Kartendaten">{mapElements.map((item) => <option value={item.symbol} key={item.symbol}>{item.name}</option>)}</optgroup>
            <optgroup label="Noch ohne Kartendaten">{otherElements.map((item) => <option value={item.symbol} key={item.symbol}>{item.name}</option>)}</optgroup>
          </select><ChevronDown size={15} aria-hidden="true" /></span></label>
          <button className="icon-button element-info-button" type="button" aria-label={`Steckbrief von ${element.name} öffnen`} onClick={onElementInfo}><Info size={18} /></button>
        </div>
        <div className="mode-switch" role="group" aria-label="Kartenansicht wählen">
          {(Object.keys(mapModes) as MapMode[]).map((key) => {
            const Icon = modeIcons[key]
            return <button type="button" key={key} aria-pressed={state.mode === key} className={state.mode === key ? 'active' : ''} onClick={() => changeMode(key)}><Icon size={17} />{mapModes[key].label}</button>
          })}
        </div>
        <div className="share-control">
          <button type="button" aria-label="Ansicht teilen" className={`secondary-button share-button ${shareState === 'copied' ? 'copied' : ''}`} onClick={share}>{shareState === 'copied' ? <Check size={16} /> : <Share2 size={16} />}<span>{shareState === 'copied' ? 'Kopiert' : 'Teilen'}</span></button>
          {shareState === 'manual' && <div className="share-fallback"><label>Link zum Kopieren<input aria-label="Link zum Kopieren" readOnly value={window.location.href} onFocus={(event) => event.target.select()} autoFocus /></label></div>}
          <span className="sr-only" role="status">{shareState === 'copied' ? 'Link zur aktuellen Ansicht kopiert' : ''}</span>
        </div>
      </div>

      <div className="metric-explainer"><p>{mode.description}</p><button type="button" onClick={onSources}><Info size={15} /> Kennzahlen verstehen</button></div>

      <div className={`map-layout ${available ? '' : 'no-data-layout'}`}>
        <section className="map-panel" aria-label={`${mode.title} für ${element.name}`}>
          <div className="map-panel-header">
            <div><span className="live-dot" /><h2>{mode.title}</h2><span className="metric-period" data-testid="metric-period">{isOccurrences ? 'MRDS · historisch' : dataset ? state.mode === 'production' ? '2025 · Schätzung' : 'Stand 2026' : 'Keine Daten'}</span></div>
            <div className="display-switch" role="group" aria-label="Darstellung wählen">
              <button type="button" className={display === 'map' ? 'active' : ''} aria-pressed={display === 'map'} aria-label="Karte" onClick={() => setDisplay('map')}><Globe2 size={15} /><span>Karte</span></button>
              <button type="button" className={display === 'table' ? 'active' : ''} aria-pressed={display === 'table'} aria-label="Datentabelle" onClick={() => setDisplay('table')}><Table2 size={15} /><span>Datentabelle</span></button>
            </div>
          </div>
          {!available ? (
            <div className="no-map-data"><span className="empty-map-icon"><Globe2 size={40} strokeWidth={1} /></span><span className="eyebrow">{element.symbol} · {element.name}</span><h2>Noch keine Kartendaten</h2><p>Für {element.name} sind in dieser Ansicht noch keine geprüften Daten hinterlegt. Das bedeutet nicht, dass es keine Vorkommen oder Nutzung gibt.</p><div>{['Li', 'Cu', 'Au'].map((symbol) => <button type="button" className="secondary-button" key={symbol} onClick={() => changeElement(symbol)}>{symbol} entdecken <ArrowRight size={14} /></button>)}</div></div>
          ) : display === 'table' ? (
            isOccurrences
              ? <OccurrenceTable key={`${element.symbol}-sites`} sites={sites} element={element} onSelect={setSiteId} />
              : <CountryTable dataset={dataset!} element={element} selectedCountry={country} onSelect={setCountry} />
          ) : (
            <div className="map-viewport">
              <Suspense fallback={<div className="map-loading" role="status"><Globe2 size={35} strokeWidth={1.2} /><span>Deine Weltkarte wird geladen …</span></div>}>
                <WorldMap key={element.symbol} mode={state.mode} dataset={dataset} sites={sites} selectedCountry={country} selectedSite={selectedSite} onCountry={setCountry} onSite={setSiteId} onTable={() => setDisplay('table')} />
              </Suspense>
              <div className="map-corner-label"><span>ELEMENTA / WORLD ATLAS</span><strong>{element.symbol}</strong><span>{dataset?.basis ?? 'DOKUMENTIERTE FUNDSTELLEN'}</span></div>
              <MapLegend dataset={dataset} occurrences={isOccurrences} />
            </div>
          )}
          <div className="map-panel-footer"><span><Database size={13} />{isOccurrences ? `${sites.length} Standorte im Auszug` : dataset ? `${dataset.records.filter((record) => record.value !== null).length} Länder & Gebiete mit Mengenangaben` : `${supportedSymbols.length} andere Elemente mit Kartendaten`}</span><button type="button" onClick={onSources}>Quellen & Datenstand <ArrowUpRight size={13} /></button></div>
        </section>
        {available && (isOccurrences
          ? <OccurrenceSidebar key={element.symbol} sites={sites} selected={selectedSite} onSite={setSiteId} onTable={() => setDisplay('table')} />
          : <QuantitySidebar dataset={dataset!} country={country} onCountry={setCountry} onTable={() => setDisplay('table')} />)}
      </div>

      <div className="data-caveat"><Info size={17} /><p>{isOccurrences ? occurrenceNotice : dataset?.note ?? 'Die Datenbasis wird elementweise erweitert. Fehlende Angaben werden niemals als Null interpretiert.'}</p></div>
      <div className="map-bottom-row">
        <button className="back-to-elements" type="button" onClick={() => onNavigate({ view: 'periodic' })}><ArrowLeft size={17} /> Zurück zu den Elementen</button>
        <div className="map-element-reminder" style={{ '--element-tint': family.tint } as CSSProperties}><span>{element.symbol}</span><p>{element.name} im Alltag: <strong>{element.uses[0]}</strong></p><button type="button" onClick={onElementInfo}>Mehr entdecken <ArrowUpRight size={15} /></button></div>
      </div>
    </div>
  )
}
