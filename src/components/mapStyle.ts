import type { ExpressionSpecification } from 'maplibre-gl'
import { getColor, getScale, missingColor, type ResourceDataset } from '@elements-map/core'

export function getCountryFill(dataset?: ResourceDataset): string | ExpressionSpecification {
  const [first, ...rest] = dataset?.records ?? []
  if (!dataset || !first) return missingColor
  const scale = getScale(dataset)
  return [
    'match', ['get', 'iso3'],
    first.country, getColor(first.value, scale),
    ...rest.flatMap((record) => [record.country, getColor(record.value, scale)]),
    missingColor,
  ]
}
