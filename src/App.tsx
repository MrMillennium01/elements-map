import { useState } from 'react'
import { ArrowUpRight, CircleHelp, Globe2, Grid2X2 } from 'lucide-react'
import { getElement, type ChemicalElement } from '@elements-map/core'
import { useAtlasState } from './hooks/useAtlasState'
import { PeriodicTable } from './components/PeriodicTable'
import { ElementSheet } from './components/ElementSheet'
import { SourcesDialog } from './components/SourcesDialog'
import { MapView } from './components/MapView'

export default function App() {
  const [state, navigate] = useAtlasState()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const element = getElement(state.element)!

  const selectElement = (selected: ChemicalElement) => {
    navigate({ element: selected.symbol })
    setSheetOpen(true)
  }

  const showMap = () => {
    setSheetOpen(false)
    navigate({ view: 'map' })
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="brand" aria-label="elementa Startseite" onClick={() => navigate({ view: 'periodic' })}>
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>elementa<span className="brand-period">.</span></span>
          </button>
          <nav className="main-navigation" aria-label="Hauptnavigation">
            <button type="button" className={state.view === 'periodic' ? 'active' : ''} aria-current={state.view === 'periodic' ? 'page' : undefined} onClick={() => navigate({ view: 'periodic' })}>
              <Grid2X2 size={17} /> Periodensystem
            </button>
            <button type="button" className={state.view === 'map' ? 'active' : ''} aria-current={state.view === 'map' ? 'page' : undefined} onClick={() => navigate({ view: 'map' })}>
              <Globe2 size={17} /> Weltkarte
            </button>
          </nav>
          <button type="button" className="header-about" aria-label="Über die Daten" onClick={() => setSourcesOpen(true)}><CircleHelp size={17} /><span>Über die Daten</span></button>
        </div>
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {state.view === 'periodic'
          ? <PeriodicTable selected={state.element} onSelect={selectElement} onExploreMap={showMap} />
          : <MapView state={state} element={element} onNavigate={navigate} onElementInfo={() => setSheetOpen(true)} onSources={() => setSourcesOpen(true)} />}
      </main>
      <footer className="site-footer">
        <div className="footer-brand"><span className="footer-dot" /> Die Welt in ihren Elementen.</div>
        <div><span>Mit Neugier gemacht. Auf Daten gebaut.</span><button type="button" onClick={() => setSourcesOpen(true)}>Quellen & Methodik <ArrowUpRight size={14} /></button></div>
      </footer>
      <ElementSheet element={element} open={sheetOpen} onClose={() => setSheetOpen(false)} onShowMap={showMap} />
      <SourcesDialog open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </>
  )
}
