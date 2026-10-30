import { describe, expect, it } from 'vitest'
import {
  categories,
  countries,
  createCsv,
  datasets,
  elements,
  formatAmount,
  getColor,
  getDataset,
  getOccurrences,
  getScale,
  getWorldShare,
  occurrences,
  parseAtlasQuery,
  rankCountries,
  searchElements,
  serializeAtlasState,
  supportedSymbols,
} from './index'

describe('periodic table', () => {
  it('contains all 118 elements with unique numbers and grid positions', () => {
    expect(elements).toHaveLength(118)
    expect(elements.map((element) => element.number)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1))
    expect(new Set(elements.map((element) => element.symbol)).size).toBe(118)
    expect(new Set(elements.map((element) => `${element.column}:${element.row}`)).size).toBe(118)
    for (const element of elements) {
      expect(categories[element.category]).toBeDefined()
      expect(element.name).toBeTruthy()
      expect(element.summary).toBeTruthy()
      expect(element.uses.length).toBeGreaterThan(0)
      expect(element.column).toBeGreaterThanOrEqual(1)
      expect(element.column).toBeLessThanOrEqual(18)
    }
  })

  it('searches German names, English names, symbols and exact atomic numbers', () => {
    expect(searchElements('Kupfer').map((element) => element.symbol)).toEqual(['Cu'])
    expect(searchElements('copper').map((element) => element.symbol)).toEqual(['Cu'])
    expect(searchElements('  Li  ').some((element) => element.symbol === 'Li')).toBe(true)
    expect(searchElements('26').map((element) => element.symbol)).toEqual(['Fe'])
    expect(searchElements('unbekanntes-element')).toEqual([])
  })

  it('filters by category and availability independently of the search', () => {
    expect(searchElements('', 'noble-gas').every((element) => element.category === 'noble-gas')).toBe(true)
    expect(searchElements('', undefined, true)).toHaveLength(supportedSymbols.length)
  })
})

describe('resource data integrity', () => {
  it('provides finite country centers in longitude-latitude order', () => {
    expect(Object.keys(countries).length).toBeGreaterThan(170)
    for (const country of Object.values(countries)) {
      expect(country.center).toHaveLength(2)
      expect(country.center.every(Number.isFinite)).toBe(true)
      expect(Math.abs(country.center[0])).toBeLessThanOrEqual(180)
      expect(Math.abs(country.center[1])).toBeLessThanOrEqual(90)
    }
  })

  it('keeps production, reserves and occurrence records as distinct datasets', () => {
    expect(supportedSymbols).toHaveLength(12)
    for (const symbol of supportedSymbols) {
      expect(getDataset(symbol, 'production')?.metric).toBe('production')
      expect(getDataset(symbol, 'reserves')?.metric).toBe('reserves')
      expect(getOccurrences(symbol).length).toBeGreaterThan(0)
    }
    expect(getDataset('He', 'reserves')).toBeUndefined()
    expect(getOccurrences('He')).toEqual([])
  })

  it('lists historical sites alphabetically rather than by source-record order', () => {
    const names = getOccurrences('Li').map((site) => site.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'de')))
  })

  it('normalizes source units without confusing bauxite with aluminium metal', () => {
    const copper = getDataset('Cu', 'production')!
    expect(copper.records.find((record) => record.country === 'CHL')?.value).toBe(5_300_000)
    const iron = getDataset('Fe', 'reserves')!
    expect(iron.records.find((record) => record.country === 'AUS')?.value).toBe(27_000_000_000)
    expect(getDataset('Al', 'reserves')?.basis).toBe('Bauxit (Erzgewicht)')
  })

  it('preserves withheld and missing observations rather than turning them into zero', () => {
    const lithium = getDataset('Li', 'production')!
    expect(lithium.records.find((record) => record.country === 'USA')).toMatchObject({
      value: null,
      status: 'withheld',
    })
    expect(getDataset('Ag', 'reserves')?.records.find((record) => record.country === 'SWE')?.value).toBeNull()
    expect(getDataset('Sn', 'production')?.records.find((record) => record.country === 'USA')?.value).toBe(0)
  })

  it('only contains finite, nonnegative quantities, source links and unique countries', () => {
    for (const dataset of datasets) {
      expect(dataset.sourceUrl).toMatch(/^https:\/\/pubs\.usgs\.gov\//)
      expect(dataset.unit).toBe('t')
      expect(new Set(dataset.records.map((record) => record.country)).size).toBe(dataset.records.length)
      for (const record of dataset.records) {
        expect(record.country).toMatch(/^[A-Z]{3}$/)
        if (record.value !== null) {
          expect(Number.isFinite(record.value)).toBe(true)
          expect(record.value).toBeGreaterThanOrEqual(0)
        } else {
          expect(['withheld', 'unavailable']).toContain(record.status)
        }
      }
    }
  })

  it('retains provenance and valid coordinates for every historical occurrence', () => {
    expect(new Set(occurrences.map((site) => site.id)).size).toBe(occurrences.length)
    for (const site of occurrences) {
      expect(site.coordinates[0]).toBeGreaterThanOrEqual(-180)
      expect(site.coordinates[0]).toBeLessThanOrEqual(180)
      expect(site.coordinates[1]).toBeGreaterThanOrEqual(-90)
      expect(site.coordinates[1]).toBeLessThanOrEqual(90)
      expect(site.elements.length).toBeGreaterThan(0)
      expect(site.sourceUrl).toMatch(/^https:\/\/mrdata\.usgs\.gov\//)
      expect(['A', 'B']).toContain(site.quality)
    }
  })
})

describe('quantitative map semantics', () => {
  it('ranks measured quantities and excludes withheld values', () => {
    const ranked = rankCountries(getDataset('Li', 'production')!.records)
    expect(ranked[0].country).toBe('AUS')
    expect(ranked.some((record) => record.country === 'USA')).toBe(false)
    expect(rankCountries([{ country: 'AAA', value: 0, status: 'reported' }])).toHaveLength(1)
  })

  it('distinguishes no data, a reported zero and positive values', () => {
    const scale = getScale(getDataset('Li', 'reserves')!)
    expect(getColor(null, scale)).not.toBe(getColor(0, scale))
    expect(getColor(0, scale)).not.toBe(getColor(9_200_000, scale))
    expect(getColor(60_000, scale)).not.toBe(getColor(9_200_000, scale))
  })

  it('does not calculate shares from lower bounds or totals excluding withheld production', () => {
    expect(getWorldShare(getDataset('Ni', 'reserves')!, 62_000_000)).toBeNull()
    expect(getWorldShare(getDataset('Li', 'production')!, 92_000)).toBeNull()
    expect(getWorldShare(getDataset('Cu', 'production')!, 5_300_000)).toBeCloseTo(23.043, 2)
    expect(getDataset('Li', 'production')!.note).toContain('vertrauliche US-Produktion')
    expect(getDataset('Li', 'reserves')!.note).not.toContain('vertrauliche US-Produktion')
  })

  it('formats zero, unknown and large quantities without changing the stored value', () => {
    expect(formatAmount(0)).toBe('0')
    expect(formatAmount(null)).toBe('Keine Angabe')
    expect(formatAmount(9_200_000, true)).toBe('9,2 Mio.')
  })
})

describe('shareable state and exports', () => {
  it('roundtrips all three map modes', () => {
    for (const mode of ['occurrences', 'production', 'reserves'] as const) {
      const state = { view: 'map' as const, element: 'Cu', mode }
      expect(parseAtlasQuery(serializeAtlasState(state))).toEqual(state)
    }
  })

  it('validates external URL parameters instead of trusting unknown elements or modes', () => {
    expect(parseAtlasQuery('?view=unknown&element=xxx&mode=bad')).toEqual({
      view: 'periodic',
      element: 'Li',
      mode: 'reserves',
    })
    expect(parseAtlasQuery('?view=map&element=cu&mode=occurrences').element).toBe('Cu')
  })

  it('escapes CSV quotes and spreadsheet formulas', () => {
    const csv = createCsv(['Name', 'Wert'], [['=SUM(A1:A2)', 42], ['Ein "Name"', 0]])
    expect(csv).toContain(`"'=SUM(A1:A2)"`)
    expect(csv).toContain('"Ein ""Name"""')
    expect(csv).toContain(',0')
  })
})
