export type Category =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

export type MapMode = 'occurrences' | 'production' | 'reserves'
export type QuantitativeMetric = Exclude<MapMode, 'occurrences'>

export interface ChemicalElement {
  number: number
  symbol: string
  name: string
  englishName: string
  atomicMass: string
  category: Category
  period: number
  group: number | null
  column: number
  row: number
  phase: 'solid' | 'liquid' | 'gas' | 'unknown'
  meltingPoint: number | null
  boilingPoint: number | null
  density: number | null
  electronConfiguration: string
  discoveryYear: string
  summary: string
  uses: string[]
  foundIn: string[]
  sourceUrl: string
}

export interface CountryObservation {
  country: string
  value: number | null
  status: 'reported' | 'estimated' | 'withheld' | 'unavailable'
  note?: string
}

export interface ResourceDataset {
  element: string
  commodity: string
  basis: string
  metric: QuantitativeMetric
  year: number
  unit: 't'
  sourceUrl: string
  sourceTitle: string
  note: string
  records: CountryObservation[]
  worldTotal: {
    value: number
    qualifier: 'rounded' | 'lower-bound'
    comparable: boolean
    note?: string
  }
  otherCountries: {
    value: number | null
    qualifier: 'rounded' | 'lower-bound' | 'unspecified'
  }
}

export interface Occurrence {
  id: string
  name: string
  coordinates: [number, number]
  elements: string[]
  country: string | null
  historicStatus: string
  quality: 'A' | 'B'
  sourceUrl: string
}

export interface AtlasState {
  view: 'periodic' | 'map'
  element: string
  mode: MapMode
}

export interface ColorScale {
  thresholds: [number, number, number]
  colors: [string, string, string, string]
  max: number
}
