import type { CSSProperties } from 'react'
import { ArrowUpRight, Atom, Check, ExternalLink, Globe2, Layers3, Sparkles } from 'lucide-react'
import { categories, formatAmount, hasMapData, type ChemicalElement } from '@elements-map/core'
import { Dialog } from './Dialog'

interface Props {
  element: ChemicalElement
  open: boolean
  onClose: () => void
  onShowMap: () => void
}

const phaseNames = { solid: 'Fest', liquid: 'Flüssig', gas: 'Gasförmig', unknown: 'Nicht gesichert' }

export function ElementSheet({ element, open, onClose, onShowMap }: Props) {
  const family = categories[element.category]
  const available = hasMapData(element.symbol)
  const temperature = element.meltingPoint === null ? 'Keine Angabe' : `${formatAmount(Math.round((element.meltingPoint - 273.15) * 10) / 10)} °C`

  return (
    <Dialog open={open} onClose={onClose} label={`${element.name} entdecken`} className="element-dialog">
      <div className="element-sheet">
        <div className="sheet-eyebrow"><Atom size={15} /> EIN ELEMENT, VIELE MÖGLICHKEITEN</div>
        <div className="sheet-element-card" style={{ '--element-tint': family.tint, '--element-color': family.color } as CSSProperties}>
          <div className="sheet-element-top"><span>Ordnungszahl {element.number}</span><span>{element.atomicMass.replace('.', ',')} u</span></div>
          <strong className="sheet-symbol">{element.symbol}</strong>
          <h2>{element.name}</h2>
          <span className="family-pill">{family.name}</span>
          <div className="element-card-orbits" aria-hidden="true"><span /><span /></div>
        </div>
        <p className="sheet-summary">{element.summary}</p>
        <div className="element-properties">
          <div><span>Aggregatzustand</span><strong>{phaseNames[element.phase]}</strong></div>
          <div><span>Schmelzpunkt</span><strong>{temperature}</strong></div>
          <div><span>Periode</span><strong>{element.period}</strong></div>
          <div><span>Gruppe</span><strong>{element.group ?? 'f-Block'}</strong></div>
        </div>
        <section className="sheet-section">
          <h3><Sparkles size={17} /> Dafür brauchen wir es</h3>
          <ul className="use-list">
            {element.uses.map((use) => <li key={use}><span><Check size={13} /></span>{use}</li>)}
          </ul>
        </section>
        <section className="sheet-section">
          <h3><Layers3 size={17} /> So kommt es vor</h3>
          <div className="mineral-tags">{element.foundIn.map((mineral) => <span key={mineral}>{mineral}</span>)}</div>
        </section>
        <div className={`sheet-map-callout ${available ? '' : 'unavailable'}`}>
          <Globe2 size={22} />
          <div><strong>{available ? 'Ein Element. Drei Perspektiven.' : 'Mehr Wissen, Schritt für Schritt.'}</strong><p>{available ? 'Entdecke Vorkommen, Förderung und Reserven auf der Weltkarte.' : 'Für dieses Element sind im aktuellen Atlas noch keine geografischen Datensätze hinterlegt.'}</p></div>
        </div>
        <button type="button" className="primary-button sheet-map-button" onClick={onShowMap}>
          {available ? 'Auf der Weltkarte entdecken' : 'Datenverfügbarkeit auf der Karte ansehen'} <ArrowUpRight size={18} />
        </button>
        <a className="sheet-source" href={element.sourceUrl} target="_blank" rel="noreferrer">
          Stoffdaten: PubChem / NCBI <ExternalLink size={13} />
        </a>
        <p className="fine-print">Anwendungen sind vereinfachte Kurztexte. Stoffwerte gelten unter den Bedingungen der Quelle; Werte superschwerer Elemente können Vorhersagen sein.</p>
      </div>
    </Dialog>
  )
}
