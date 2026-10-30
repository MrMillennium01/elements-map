import { describe, expect, it } from 'vitest'
import { getDataset, missingColor, zeroColor } from '@elements-map/core'
import { getCountryFill } from './mapStyle'

describe('country fill expressions', () => {
  it('uses a constant fallback instead of an invalid empty match expression', () => {
    expect(getCountryFill()).toBe(missingColor)
    expect(getCountryFill({ ...getDataset('Li', 'reserves')!, records: [] })).toBe(missingColor)
  })

  it('builds a valid match even when only one observation exists', () => {
    expect(getCountryFill({
      ...getDataset('Cu', 'production')!,
      records: [{ country: 'DEU', value: 0, status: 'estimated' }],
    })).toEqual(['match', ['get', 'iso3'], 'DEU', zeroColor, missingColor])
  })

  it('keeps confidential production uncolored while displaying reported values', () => {
    const fill = getCountryFill(getDataset('Li', 'production'))
    expect(Array.isArray(fill)).toBe(true)
    const expression = fill as unknown[]
    expect(expression[expression.indexOf('USA') + 1]).toBe(missingColor)
    expect(expression[expression.indexOf('AUS') + 1]).not.toBe(missingColor)
    expect(expression.at(-1)).toBe(missingColor)
  })
})
