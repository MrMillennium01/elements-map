import { Database, ExternalLink, Factory, Layers3, MapPin } from 'lucide-react'
import { mapModes, occurrenceNotice, occurrences, supportedSymbols } from '@elements-map/core'
import { Dialog } from './Dialog'

interface Props {
  open: boolean
  onClose: () => void
}

export function SourcesDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} label="Daten und Methodik" className="sources-dialog">
      <div className="sources-content">
        <span className="eyebrow"><Database size={15} /> TRANSPARENZ IST EIN ELEMENT DAVON</span>
        <h2>Daten mit Herkunft.</h2>
        <p className="sources-lead">Drei Perspektiven beantworten drei verschiedene Fragen. Eine Fundstelle ist keine Reserve, und Förderung ist kein Maß für das gesamte Vorkommen.</p>
        <div className="method-cards">
          {([
            ['occurrences', MapPin],
            ['production', Factory],
            ['reserves', Layers3],
          ] as const).map(([mode, Icon]) => (
            <div key={mode}><Icon size={21} /><h3>{mapModes[mode].label}</h3><p>{mapModes[mode].description}</p></div>
          ))}
        </div>
        <div className="source-entry">
          <span className="source-index">01</span>
          <div><h3>USGS Mineral Commodity Summaries 2026</h3><p>Manuell geprüfte Ländertabellen für {supportedSymbols.length} Rohstoffe. Förderung: Schätzungen für 2025. Reserven: Berichtsstand 2026. Einheiten wurden in metrische Tonnen umgerechnet; Schätzungen, Untergrenzen und vertrauliche Werte bleiben gekennzeichnet.</p><a href="https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf" target="_blank" rel="noreferrer">Originalbericht ansehen <ExternalLink size={13} /></a></div>
        </div>
        <div className="source-entry">
          <span className="source-index">02</span>
          <div><h3>USGS Mineral Resources Data System</h3><p>{occurrenceNotice}</p><p>Der Atlas enthält {occurrences.length.toLocaleString('de-DE')} Standorte. Auswahl: Qualitätsklassen A/B, ohne Verarbeitungsanlagen und namenlose Einträge; je Element höchstens zwei Standorte pro 5°-Rasterzelle. Landzuordnungen aus vereinfachten Grenzen sind näherungsweise.</p><a href="https://mrdata.usgs.gov/mrds/" target="_blank" rel="noreferrer">Über die Fundstellendaten <ExternalLink size={13} /></a></div>
        </div>
        <div className="source-entry">
          <span className="source-index">03</span>
          <div><h3>PubChem / NCBI & Natural Earth</h3><p>Atomare Eigenschaften der 118 Elemente: PubChem Periodic Table. Ländergeometrien: Natural Earth, Maßstab 1:110 Mio., Public Domain. Grenzen sind generalisiert; kleine Inseln und Gebiete sind nicht immer darstellbar.</p><div className="source-links"><a href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/" target="_blank" rel="noreferrer">PubChem <ExternalLink size={13} /></a><a href="https://github.com/nvkelso/natural-earth-vector" target="_blank" rel="noreferrer">Natural Earth <ExternalLink size={13} /></a></div></div>
        </div>
        <div className="method-note"><strong>Was Farben und Zahlen bedeuten</strong><p>Die Länderfarbe kodiert die absolute Menge, nicht die Dichte pro Fläche. Farbgrenzen werden je Element und Kennzahl berechnet. Fehlende Angaben sind von gemeldeten Nullwerten getrennt. Weltwerte stammen aus dem Bericht und enthalten auch nicht einzeln kartierte Länder. Prozentanteile werden nur bei geeigneten Weltwerten angegeben; diese sind gerundet.</p></div>
        <p className="fine-print">Alle Karten- und Fachdaten werden als lokale, versionierte Momentaufnahme ausgeliefert. Der Atlas enthält keine Live-Abfragen und verwendet keine externen Kartenkacheln. Bei Aluminium wird Bauxit als Rohstoff gezeigt, nicht reines Aluminium. Reserveklassifikationen können zwischen Ländern abweichen.</p>
      </div>
    </Dialog>
  )
}
