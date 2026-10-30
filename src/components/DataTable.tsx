import { useMemo, useState } from 'react'
import { Download, ExternalLink, Search } from 'lucide-react'
import {
  createCsv,
  formatAmount,
  getCountryName,
  getWorldShare,
  historicStatuses,
  type ChemicalElement,
  type Occurrence,
  type ResourceDataset,
} from '@elements-map/core'

function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const statusLabels = { reported: 'Berichtet', estimated: 'Schätzung', withheld: 'Vertraulich', unavailable: 'Keine Angabe' }

interface QuantityProps {
  dataset: ResourceDataset
  element: ChemicalElement
  selectedCountry: string | null
  onSelect: (country: string) => void
}

export function CountryTable({ dataset, element, selectedCountry, onSelect }: QuantityProps) {
  const rows = [...dataset.records].sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
  const shares = dataset.worldTotal.comparable

  function exportData() {
    const csv = createCsv(
      ['Element', 'Rohstoff', 'Kennzahl', 'Jahr', 'ISO3', 'Land', 'Wert', 'Einheit', 'Status', 'Bezugsstoff', 'Quelle', 'Hinweis'],
      dataset.records.map((record) => [
        element.symbol, dataset.commodity, dataset.metric, dataset.year, record.country, getCountryName(record.country),
        record.value, dataset.unit, statusLabels[record.status], dataset.basis, dataset.sourceUrl, record.note ?? '',
      ]),
    )
    downloadCsv(`elementa-${element.symbol}-${dataset.metric}-${dataset.year}.csv`, csv)
  }

  return (
    <div className="data-table-panel">
      <div className="data-table-toolbar"><span>{dataset.records.length} Länder & Gebiete · {dataset.basis}</span><button type="button" className="text-button" onClick={exportData}><Download size={15} /> CSV herunterladen</button></div>
      <div className="data-table-scroll" tabIndex={0} role="region" aria-label="Ländertabelle scrollen">
        <table className="data-table">
          <caption className="sr-only">Länderwerte für {element.name}: {dataset.metric === 'production' ? 'Förderung' : 'Reserven'}</caption>
          <thead><tr><th scope="col">Land / Gebiet</th><th scope="col" className="numeric">Menge (t)</th>{shares && <th scope="col" className="numeric">Weltanteil ≈</th>}<th scope="col">Status</th></tr></thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.country} className={selectedCountry === record.country ? 'selected' : ''}>
                <th scope="row"><button type="button" onClick={() => onSelect(record.country)}>{getCountryName(record.country)}</button></th>
                <td className="numeric">{record.value === null ? '—' : formatAmount(record.value)}</td>
                {shares && <td className="numeric">{record.value === null ? '—' : `${formatAmount(getWorldShare(dataset, record.value))} %`}</td>}
                <td><span className={`data-status ${record.status}`}>{statusLabels[record.status]}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">Weitere Länder (nicht einzeln kartiert)</th><td className="numeric">{dataset.otherCountries.qualifier === 'lower-bound' ? '> ' : ''}{formatAmount(dataset.otherCountries.value)}</td><td colSpan={shares ? 2 : 1}>USGS-Sammelwert</td></tr>
            <tr><th scope="row">Weltweit (gerundet)</th><td className="numeric">{dataset.worldTotal.qualifier === 'lower-bound' ? '> ' : ''}{formatAmount(dataset.worldTotal.value)}</td><td colSpan={shares ? 2 : 1}>{dataset.worldTotal.note ?? 'USGS-Weltwert'}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="data-table-source"><span>Ein Klick auf ein Land öffnet Details und etwaige Quellennotizen.</span><a href={dataset.sourceUrl} target="_blank" rel="noreferrer">Originaltabelle <ExternalLink size={12} /></a></div>
    </div>
  )
}

interface OccurrenceProps {
  sites: Occurrence[]
  element: ChemicalElement
  onSelect: (id: string) => void
}

export function OccurrenceTable({ sites, element, onSelect }: OccurrenceProps) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(50)
  const filtered = useMemo(() => sites.filter((site) => `${site.name} ${getCountryName(site.country)}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de'))), [sites, query])

  function exportData() {
    const csv = createCsv(
      ['Element', 'MRDS-ID', 'Standort', 'ISO3 (näherungsweise)', 'Längengrad', 'Breitengrad', 'Historischer Status', 'Qualitätsklasse', 'Quelle', 'Hinweis'],
      sites.map((site) => [
        element.symbol, site.id, site.name, site.country, site.coordinates[0], site.coordinates[1],
        site.historicStatus, site.quality, site.sourceUrl, 'Historischer MRDS-Auszug; keine Aussage über aktuellen Betrieb oder Rohstoffmenge.',
      ]),
    )
    downloadCsv(`elementa-${element.symbol}-historische-vorkommen.csv`, csv)
  }

  return (
    <div className="data-table-panel">
      <div className="data-table-toolbar">
        <label className="search-field small"><Search size={16} /><input type="search" aria-label="Fundstellen in der Tabelle suchen" placeholder="Standort oder Land suchen" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(50) }} /></label>
        <button type="button" className="text-button" onClick={exportData}><Download size={15} /> CSV herunterladen</button>
      </div>
      <div className="data-table-scroll" tabIndex={0} role="region" aria-label="Fundstellentabelle scrollen">
        <table className="data-table occurrence-table">
          <caption className="sr-only">Historische Fundstellen für {element.name}</caption>
          <thead><tr><th scope="col">Standort</th><th scope="col">Land (näherungsweise)</th><th scope="col">Historischer Status</th><th scope="col">Quelle</th></tr></thead>
          <tbody>
            {filtered.slice(0, limit).map((site) => (
              <tr key={site.id}><th scope="row"><button type="button" onClick={() => onSelect(site.id)}>{site.name}</button><small>{site.coordinates[1].toFixed(3)}°, {site.coordinates[0].toFixed(3)}°</small></th><td>{getCountryName(site.country)}</td><td>{historicStatuses[site.historicStatus] ?? site.historicStatus}</td><td><a href={site.sourceUrl} target="_blank" rel="noreferrer" aria-label={`MRDS-Quelle für ${site.name}`}><ExternalLink size={15} /></a></td></tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="table-empty">Keine passenden Standorte. Versuche einen anderen Suchbegriff.</p>}
        {filtered.length > limit && <button type="button" className="load-more" onClick={() => setLimit(limit + 50)}>Weitere 50 Standorte anzeigen</button>}
      </div>
      <div className="data-table-source"><span>{Math.min(limit, filtered.length)} von {filtered.length} Standorten · MRDS-Auszug · kein aktueller Betriebsstatus</span></div>
    </div>
  )
}
