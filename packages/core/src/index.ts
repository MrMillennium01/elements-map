import rawElements from './data/periodic-table.json'
import rawOccurrences from './data/occurrences.json'
import rawCountries from './data/countries.json'
import { elementContent } from './data/element-content'
import { datasets, supportedSymbols } from './data/minerals'
import type {
  AtlasState,
  Category,
  ChemicalElement,
  ColorScale,
  CountryObservation,
  MapMode,
  Occurrence,
  QuantitativeMetric,
  ResourceDataset,
} from './types'

export * from './types'
export { datasets, supportedSymbols }

export const categories: Record<Category, { name: string; color: string; tint: string }> = {
  alkali: { name: 'Alkalimetalle', color: '#66743d', tint: '#e4ebcc' },
  'alkaline-earth': { name: 'Erdalkalimetalle', color: '#827042', tint: '#eee8ce' },
  transition: { name: 'Übergangsmetalle', color: '#456b58', tint: '#dce9e0' },
  'post-transition': { name: 'Andere Metalle', color: '#71618b', tint: '#e7e1ef' },
  metalloid: { name: 'Halbmetalle', color: '#6b7b3c', tint: '#e0e9c7' },
  nonmetal: { name: 'Nichtmetalle', color: '#4d6d3d', tint: '#d1e0c2' },
  halogen: { name: 'Halogene', color: '#976443', tint: '#f0dfce' },
  'noble-gas': { name: 'Edelgase', color: '#57718e', tint: '#dde6f0' },
  lanthanide: { name: 'Lanthanoide', color: '#527787', tint: '#dce9ed' },
  actinide: { name: 'Actinoide', color: '#8a6177', tint: '#ecdee5' },
}

const categoryLookup: Record<string, Category> = {
  'Alkali metal': 'alkali',
  'Alkaline earth metal': 'alkaline-earth',
  'Transition metal': 'transition',
  'Post-transition metal': 'post-transition',
  Metalloid: 'metalloid',
  Nonmetal: 'nonmetal',
  Halogen: 'halogen',
  'Noble gas': 'noble-gas',
  Lanthanide: 'lanthanide',
  Actinide: 'actinide',
}

function position(number: number) {
  if (number >= 57 && number <= 71) return { period: 6, row: 10, column: number - 54, group: null }
  if (number >= 89 && number <= 103) return { period: 7, row: 11, column: number - 86, group: null }
  const period = [2, 10, 18, 36, 54, 86, 118].findIndex((end) => number <= end) + 1
  const column = period === 1 ? (number === 1 ? 1 : 18)
    : period === 2 ? (number <= 4 ? number - 2 : number + 8)
    : period === 3 ? (number <= 12 ? number - 10 : number)
    : period === 4 ? number - 18
    : period === 5 ? number - 36
    : period === 6 ? (number <= 56 ? number - 54 : number - 68)
    : number <= 88 ? number - 86 : number - 100
  return { period, row: period + 1, column, group: column }
}

const numeric = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null
const phaseLookup: Record<string, ChemicalElement['phase']> = { Solid: 'solid', Liquid: 'liquid', Gas: 'gas' }

export const elements: ChemicalElement[] = rawElements.map((raw) => {
  const text = elementContent[raw.Symbol]
  const number = Number(raw.AtomicNumber)
  return {
    number,
    symbol: raw.Symbol,
    name: text.name,
    englishName: raw.Name,
    atomicMass: raw.AtomicMass,
    category: categoryLookup[raw.GroupBlock],
    ...position(number),
    phase: phaseLookup[raw.StandardState] ?? 'unknown',
    meltingPoint: numeric(raw.MeltingPoint),
    boilingPoint: numeric(raw.BoilingPoint),
    density: numeric(raw.Density),
    electronConfiguration: raw.ElectronConfiguration,
    discoveryYear: raw.YearDiscovered,
    summary: text.summary,
    uses: text.uses,
    foundIn: text.foundIn,
    sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/element/${raw.Name}`,
  }
})

export const occurrences = rawOccurrences as Occurrence[]
export const countries = rawCountries as Record<string, { name: string; center: [number, number] }>
const supported = new Set(supportedSymbols)
const normalize = (text: string) => text.trim().toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ß', 'ss')

export function getElement(symbol: string) {
  return elements.find((element) => element.symbol.toLowerCase() === symbol.toLowerCase())
}

export function hasMapData(symbol: string) {
  return supported.has(symbol)
}

export function searchElements(query: string, category?: Category, mapOnly = false) {
  const needle = normalize(query)
  const atomicNumber = /^\d+$/.test(needle) ? Number(needle) : null
  return elements.filter((element) => (!category || element.category === category)
    && (!mapOnly || hasMapData(element.symbol))
    && (atomicNumber !== null
      ? element.number === atomicNumber
      : [element.name, element.englishName, element.symbol].some((value) => normalize(value).includes(needle))))
}

export function getDataset(symbol: string, metric: QuantitativeMetric) {
  return datasets.find((dataset) => dataset.element === symbol && dataset.metric === metric)
}

export function getOccurrences(symbol: string) {
  return occurrences.filter((site) => site.elements.includes(symbol))
}

export function getCountryName(code: string | null) {
  return code ? countries[code]?.name ?? code : 'Land nicht zugeordnet'
}

export const mapModes: Record<MapMode, { label: string; title: string; description: string; short: string }> = {
  occurrences: {
    label: 'Vorkommen',
    title: 'Belegte Vorkommen',
    description: 'Wo das Element nachgewiesen wurde. Historische Standorte, keine Aussage über Menge oder heutigen Abbau.',
    short: 'Wo es gefunden wurde',
  },
  production: {
    label: 'Förderung',
    title: 'Jährliche Förderung',
    description: 'Was tatsächlich gewonnen wird. Geschätzte Minenförderung im Kalenderjahr 2025, nach Ländern und Gebieten.',
    short: 'Was jährlich gewonnen wird',
  },
  reserves: {
    label: 'Reserven',
    title: 'Bekannte Reserven',
    description: 'Was nach heutigem Kenntnisstand wirtschaftlich gewinnbar ist. Länderangaben der USGS-Ausgabe 2026.',
    short: 'Was wirtschaftlich gewinnbar ist',
  },
}

export const occurrenceNotice = 'MRDS wird seit 2011 nicht mehr systematisch aktualisiert. Geografisch ausgedünnter Auszug der Qualitätsklassen A/B; keine vollständige Bestandsaufnahme und kein aktueller Minenstatus. Die Zahl der Punkte sagt nichts über die Rohstoffmenge aus.'

export const historicStatuses: Record<string, string> = {
  Occurrence: 'Nachweis',
  Prospect: 'Prospektionsstandort',
  Producer: 'Damals als Produzent erfasst',
  'Past Producer': 'Damals als ehemaliger Produzent erfasst',
  Unknown: 'Historischer Status unbekannt',
}

export function rankCountries(records: CountryObservation[]) {
  return records
    .filter((record): record is CountryObservation & { value: number } => record.value !== null)
    .sort((a, b) => b.value - a.value || getCountryName(a.country).localeCompare(getCountryName(b.country), 'de'))
}

export const missingColor = '#344d50'
export const zeroColor = '#829294'

export function getScale(dataset: ResourceDataset): ColorScale {
  const max = Math.max(0, ...dataset.records.map((record) => record.value ?? 0))
  const ceiling = max || 1
  return {
    max,
    thresholds: [ceiling * 0.01, ceiling * 0.1, ceiling * 0.5],
    colors: ['#dce8ce', '#b6cf8a', '#e4b26b', '#ed865b'],
  }
}

export function getColor(value: number | null | undefined, scale: ColorScale) {
  if (value === null || value === undefined) return missingColor
  if (value === 0) return zeroColor
  const index = scale.thresholds.findIndex((threshold) => value <= threshold)
  return scale.colors[index === -1 ? 3 : index]
}

export function getWorldShare(dataset: ResourceDataset, value: number | null) {
  return value !== null && dataset.worldTotal.comparable && dataset.worldTotal.value > 0
    ? value / dataset.worldTotal.value * 100
    : null
}

export function formatAmount(value: number | null, compact = false) {
  if (value === null) return 'Keine Angabe'
  if (!compact) return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value)
  const magnitude = value >= 1_000_000_000 ? 1_000_000_000 : value >= 1_000_000 ? 1_000_000 : value >= 10_000 ? 1_000 : 1
  const suffix = magnitude === 1_000_000_000 ? ' Mrd.' : magnitude === 1_000_000 ? ' Mio.' : magnitude === 1_000 ? ' Tsd.' : ''
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value / magnitude)}${suffix}`
}

export function formatObservation(record: CountryObservation) {
  if (record.status === 'withheld') return 'Vertraulich'
  if (record.value === null) return 'Keine Angabe'
  return `${formatAmount(record.value)} t`
}

export function parseAtlasQuery(search: string): AtlasState {
  const params = new URLSearchParams(search)
  const mode = params.get('mode')
  return {
    view: params.get('view') === 'map' ? 'map' : 'periodic',
    element: getElement(params.get('element') ?? '')?.symbol ?? 'Li',
    mode: mode === 'occurrences' || mode === 'production' || mode === 'reserves' ? mode : 'reserves',
  }
}

export function serializeAtlasState(state: AtlasState) {
  return `?${new URLSearchParams({ view: state.view, element: state.element, mode: state.mode })}`
}

export function createCsv(headers: string[], rows: (string | number | null)[][]) {
  const cell = (value: string | number | null) => {
    if (typeof value === 'number') return String(value)
    const text = value ?? ''
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  return `\uFEFF${[headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')}`
}
