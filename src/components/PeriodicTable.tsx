import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowRight, ArrowUpRight, Compass, Globe2, Search, SlidersHorizontal, X } from 'lucide-react'
import { categories, elements, hasMapData, searchElements, supportedSymbols, type Category, type ChemicalElement } from '@elements-map/core'

interface Props {
  selected: string
  onSelect: (element: ChemicalElement) => void
  onExploreMap: () => void
}

export function PeriodicTable({ selected, onSelect, onExploreMap }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | undefined>()
  const [mapOnly, setMapOnly] = useState(false)
  const [focused, setFocused] = useState(selected)
  const grid = useRef<HTMLDivElement>(null)
  const matches = useMemo(() => searchElements(query, category, mapOnly), [query, category, mapOnly])
  const matching = new Set(matches.map((element) => element.symbol))
  const active = matching.has(focused) ? focused : matches[0]?.symbol
  const filtered = !!query || !!category || mapOnly

  const reset = () => { setQuery(''); setCategory(undefined); setMapOnly(false) }

  function navigateGrid(event: KeyboardEvent<HTMLDivElement>) {
    const symbol = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-element]')?.dataset.element
    const current = elements.find((element) => element.symbol === symbol)
    if (!current || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const sameRow = matches.filter((element) => element.row === current.row).sort((a, b) => a.column - b.column)
    const sameColumn = matches.filter((element) => element.column === current.column).sort((a, b) => a.row - b.row)
    const next = event.key === 'ArrowLeft' ? sameRow.filter((element) => element.column < current.column).at(-1)
      : event.key === 'ArrowRight' ? sameRow.find((element) => element.column > current.column)
      : event.key === 'ArrowUp' ? sameColumn.filter((element) => element.row < current.row).at(-1)
      : event.key === 'ArrowDown' ? sameColumn.find((element) => element.row > current.row)
      : event.key === 'Home' ? sameRow[0] : sameRow.at(-1)
    if (next) grid.current?.querySelector<HTMLButtonElement>(`[data-element="${next.symbol}"]`)?.focus()
  }

  return (
    <div className="periodic-page">
      <section className="page-hero">
        <div>
          <div className="eyebrow"><span className="tiny-dot" /> CHEMIE TRIFFT GEOGRAFIE</div>
          <h1>Die Welt steckt voller<br /><span>Elemente.</span></h1>
          <p>Entdecke, was unseren Alltag möglich macht.<br className="desktop-break" /> Und wo die Rohstoffe dafür zu finden sind.</p>
        </div>
        <div className="hero-side">
          <div className="orbit-illustration" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <span className="orbit-center">e<span>.</span></span>
            <i className="orbit-dot one" /><i className="orbit-dot two" /><i className="orbit-dot three" />
            <span className="orbit-tag">ALLES IST VERBUNDEN</span>
          </div>
          <div className="hero-stats">
            <div><strong>118</strong><span>Elemente</span></div>
            <div><strong>{supportedSymbols.length}</strong><span>mit Kartendaten</span></div>
            <div><strong>3</strong><span>Perspektiven</span></div>
          </div>
        </div>
      </section>

      <section className="periodic-section" aria-label="Interaktives Periodensystem">
        <div className="table-toolbar">
          <div className="section-label"><span className="section-number">01 — 118</span><h2>Das Periodensystem</h2></div>
          <div className="table-filters">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input type="search" aria-label="Element suchen" placeholder="Element, Symbol oder Nummer" value={query} onChange={(event) => setQuery(event.target.value)} />
              {query && <button type="button" aria-label="Suche löschen" onClick={() => setQuery('')}><X size={15} /></button>}
            </label>
            <label className="category-select">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <select aria-label="Elementfamilie filtern" value={category ?? ''} onChange={(event) => setCategory(event.target.value ? event.target.value as Category : undefined)}>
                <option value="">Alle Gruppen</option>
                {Object.entries(categories).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
              </select>
            </label>
            <button type="button" className={`map-filter ${mapOnly ? 'active' : ''}`} aria-pressed={mapOnly} onClick={() => setMapOnly(!mapOnly)}>
              <Globe2 size={16} /> <span>Mit Kartendaten</span>
            </button>
          </div>
        </div>

        {filtered && (
          <div className="filter-feedback" role="status">
            <span>{matches.length ? `${matches.length} passende ${matches.length === 1 ? 'Element' : 'Elemente'}` : 'Keine Elemente gefunden. Versuche einen anderen Suchbegriff.'}</span>
            <button type="button" onClick={reset}>Filter zurücksetzen <X size={13} /></button>
          </div>
        )}
        {query.trim() && matches.length > 0 && (
          <div className="search-result-chips" aria-label="Suchtreffer">
            {matches.slice(0, 8).map((element) => (
              <button type="button" key={element.symbol} aria-label={`${element.name} öffnen`} onClick={() => onSelect(element)}>
                <strong>{element.symbol}</strong>{element.name}<ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        )}

        <div className="table-surface">
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Periodensystem, auf kleinen Bildschirmen horizontal scrollbar">
            <div className="periodic-grid" ref={grid} role="group" aria-label="Elemente nach Perioden und Gruppen" onKeyDown={navigateGrid}>
              {Array.from({ length: 18 }, (_, index) => (
                <span className="group-number" key={`group-${index}`} style={{ gridColumn: index + 2, gridRow: 1 }}>{index + 1}</span>
              ))}
              {Array.from({ length: 7 }, (_, index) => (
                <span className="period-number" key={`period-${index}`} style={{ gridColumn: 1, gridRow: index + 2 }}>{index + 1}</span>
              ))}
              <div className="table-introduction">
                <span className="micro-label">VON ATOMEN ZU ANWENDUNGEN</span>
                <h3>Kleine Bausteine.<br />Große Geschichten.</h3>
                <p>Wähle ein Element und entdecke seine Welt.</p>
                <div className="availability-hint"><span className="data-dot" /> Mit geografischen Daten entdecken</div>
              </div>
              {elements.map((element) => {
                const family = categories[element.category]
                const enabled = matching.has(element.symbol)
                const available = hasMapData(element.symbol)
                return (
                  <button
                    key={element.number}
                    type="button"
                    data-element={element.symbol}
                    className={`element-tile ${selected === element.symbol ? 'selected' : ''} ${enabled ? '' : 'muted'}`}
                    style={{
                      gridColumn: element.column + 1,
                      gridRow: element.row,
                      '--element-tint': family.tint,
                      '--element-color': family.color,
                    } as CSSProperties}
                    aria-label={`${element.name} (${element.symbol}), Ordnungszahl ${element.number}`}
                    aria-pressed={selected === element.symbol}
                    disabled={!enabled}
                    tabIndex={element.symbol === active ? 0 : -1}
                    onFocus={() => setFocused(element.symbol)}
                    onClick={() => onSelect(element)}
                  >
                    <span className="element-number">{element.number}</span>
                    {available && <span className="element-data-dot" title="Kartendaten verfügbar" />}
                    <strong>{element.symbol}</strong>
                    <span className="element-name">{element.name}</span>
                  </button>
                )
              })}
              <div className="series-placeholder" style={{ gridColumn: 4, gridRow: 7 }} aria-label="Lanthanoide in der ausgelagerten Reihe">
                <span>57–71</span><strong>La–Lu</strong><span>↙</span>
              </div>
              <div className="series-placeholder" style={{ gridColumn: 4, gridRow: 8 }} aria-label="Actinoide in der ausgelagerten Reihe">
                <span>89–103</span><strong>Ac–Lr</strong><span>↙</span>
              </div>
              <span className="series-label" style={{ gridRow: 10 }}>Lanthanoide <span>57–71</span></span>
              <span className="series-label" style={{ gridRow: 11 }}>Actinoide <span>89–103</span></span>
            </div>
          </div>
          <div className="category-legend" aria-label="Elementfamilien">
            {Object.entries(categories).map(([key, family]) => (
              <button key={key} type="button" aria-pressed={category === key} className={category === key ? 'active' : ''} onClick={() => setCategory(category === key ? undefined : key as Category)}>
                <span style={{ background: family.tint, borderColor: family.color }} />{family.name}
              </button>
            ))}
          </div>
        </div>
        <div className="table-footnote"><span>Die Farben zeigen Elementfamilien, nicht die Häufigkeit eines Elements.</span><span>← → ↑ ↓ Mit den Pfeiltasten entdecken</span></div>
      </section>

      <section className="explore-banner">
        <div className="explore-icon"><Compass size={29} strokeWidth={1.4} /></div>
        <div><span className="eyebrow">DIE NÄCHSTE PERSPEKTIVE</span><h2>Von der Chemie auf die Weltkarte.</h2><p>Wo liegen die Vorkommen? Wer fördert? Was bleibt als Reserve?</p></div>
        <button type="button" className="primary-button" onClick={onExploreMap}>Weltkarte entdecken <ArrowUpRight size={18} /></button>
      </section>
      <div className="discovery-strip">
        <span>Ein guter Anfang</span>
        {[
          ['Li', 'Energie für morgen'],
          ['Cu', 'Eine vernetzte Welt'],
          ['Si', 'Die Basis unserer Chips'],
        ].map(([symbol, label]) => (
          <button key={symbol} type="button" onClick={() => onSelect(elements.find((element) => element.symbol === symbol)!)}>
            <span className="discovery-symbol">{symbol}</span>{label}<ArrowRight size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}
