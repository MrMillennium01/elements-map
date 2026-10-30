import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const symbols = ['Li', 'Al', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ag', 'Sn', 'W', 'Au']
const userAgent = 'elements-map/0.1 (public scientific data import)'
const targets = new Set(process.argv.slice(2))
const runAll = targets.size === 0
const shouldRun = (target) => runAll || targets.has(target)
const resolve = (path) => new URL(path, root)

async function download(url, cacheName) {
  const path = resolve(`data/raw/${cacheName}`)
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent },
    signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error(`${response.status} while downloading ${url}`)
  const text = await response.text()
  await writeFile(path, text)
  return text
}

async function save(path, data) {
  await writeFile(resolve(path), `${JSON.stringify(data)}\n`)
  console.log(`Saved ${path}`)
}

const digest = (text) => createHash('sha256').update(text).digest('hex')

await mkdir(resolve('data/raw/'), { recursive: true })
await mkdir(resolve('public/data/'), { recursive: true })
await mkdir(resolve('packages/core/src/data/'), { recursive: true })
let provenance = {}
try {
  provenance = JSON.parse(await readFile(resolve('data/provenance.json'), 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

if (shouldRun('elements')) {
  const url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON'
  const text = await download(url, 'pubchem-periodic-table.json')
  const source = JSON.parse(text)
  const columns = source.Table.Columns.Column
  const rows = source.Table.Row.map((row) => Object.fromEntries(columns.map((column, index) => [column, row.Cell[index]])))
  if (rows.length !== 118 || new Set(rows.map((row) => row.Symbol)).size !== 118) {
    throw new Error('PubChem does not contain the expected 118 distinct elements')
  }
  await save('packages/core/src/data/periodic-table.json', rows)
  provenance.elements = { url, sha256: digest(text), importedAt: new Date().toISOString(), records: rows.length }
}

if (shouldRun('geography')) {
  const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
  const text = await download(url, 'natural-earth-countries.geojson')
  const source = JSON.parse(text)
  const countries = source.features
    .filter((feature) => feature.properties.ADM0_A3 !== 'ATA')
    .map((feature) => {
      const properties = feature.properties
      const iso3 = properties.ISO_A3_EH !== '-99' ? properties.ISO_A3_EH : properties.ADM0_A3
      return {
        type: 'Feature',
        id: iso3,
        geometry: feature.geometry,
        properties: {
          iso3,
          name: properties.NAME_DE || properties.NAME_EN,
          center: [properties.LABEL_X, properties.LABEL_Y],
        },
      }
    })
  if (countries.length < 170) throw new Error('Incomplete country boundaries')
  await save('public/data/countries.geojson', { type: 'FeatureCollection', features: countries })
  await save('packages/core/src/data/countries.json', Object.fromEntries(countries.map((feature) => [
    feature.properties.iso3,
    { name: feature.properties.name, center: feature.properties.center },
  ])))
  provenance.geography = {
    url,
    sha256: digest(text),
    importedAt: new Date().toISOString(),
    license: 'Public domain, Natural Earth',
    scale: '1:110m',
  }
}

function ringContains(ring, point) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

if (shouldRun('occurrences')) {
  const service = 'https://energy.usgs.gov/arcgis/rest/services/Hosted/Mineral_Resource_Data_System/FeatureServer/0/query'
  const clauses = symbols.map((symbol) => `code_list LIKE '% ${symbol.toUpperCase()}%'`).join(' OR ')
  const where = `grade IN ('A','B') AND dev_stat <> 'Plant' AND (${clauses})`
  const features = []
  for (let offset = 0; ; offset += 2000) {
    const query = new URLSearchParams({
      where,
      outFields: 'dep_id,site_name,code_list,dev_stat,grade',
      outSR: '4326',
      f: 'geojson',
      resultRecordCount: '2000',
      resultOffset: String(offset),
      orderByFields: 'dep_id,objectid_1',
    })
    const text = await download(`${service}?${query}`, `mrds-${offset}.geojson`)
    const page = JSON.parse(text)
    if (!Array.isArray(page.features) || page.error) throw new Error(`MRDS query failed: ${text.slice(0, 500)}`)
    features.push(...page.features)
    console.log(`Read ${features.length} MRDS records`)
    if (!page.properties?.exceededTransferLimit || page.features.length === 0) break
    if (offset > 100_000) throw new Error('Unexpected MRDS result size')
  }
  const valid = features.filter((feature) => {
    const coordinates = feature.geometry?.coordinates
    return feature.geometry?.type === 'Point'
      && coordinates.every(Number.isFinite)
      && Math.abs(coordinates[0]) <= 180
      && Math.abs(coordinates[1]) <= 90
      && feature.properties.dep_id
      && feature.properties.site_name
      && !/^unnamed|^unknown/i.test(feature.properties.site_name)
  })
  valid.sort((a, b) => a.properties.grade.localeCompare(b.properties.grade)
    || a.properties.dep_id.localeCompare(b.properties.dep_id))
  const selected = new Map()
  const counts = {}
  for (const symbol of symbols) {
    const matches = valid.filter((feature) => feature.properties.code_list.trim().split(/\s+/).includes(symbol.toUpperCase()))
    counts[symbol] = { matching: matches.length, selected: 0 }
    const cells = new Map()
    const seen = new Set()
    for (const feature of matches) {
      const [lng, lat] = feature.geometry.coordinates
      const key = `${Math.floor((lng + 180) / 5)}:${Math.floor((lat + 90) / 5)}`
      const id = feature.properties.dep_id
      if ((cells.get(key) || 0) >= 2 || seen.has(id)) continue
      cells.set(key, (cells.get(key) || 0) + 1)
      seen.add(id)
      counts[symbol].selected++
      const existing = selected.get(id)
      if (existing) existing.elements.push(symbol)
      else selected.set(id, { feature, elements: [symbol] })
    }
    if (counts[symbol].selected === 0) throw new Error(`No occurrences for ${symbol}`)
  }
  const geography = JSON.parse(await readFile(resolve('public/data/countries.geojson'), 'utf8'))
  const polygons = geography.features.flatMap((feature) => {
    const parts = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    return parts.map((rings) => {
      const xs = rings[0].map((point) => point[0])
      const ys = rings[0].map((point) => point[1])
      return { iso3: feature.properties.iso3, rings, bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }
    })
  })
  const records = [...selected.values()].map(({ feature, elements }) => {
    const coordinates = feature.geometry.coordinates.map((value) => Math.round(value * 100_000) / 100_000)
    const [lng, lat] = coordinates
    const country = polygons.find(({ rings, bounds: [left, bottom, right, top] }) => lng >= left && lng <= right
      && lat >= bottom && lat <= top && ringContains(rings[0], coordinates)
      && !rings.slice(1).some((ring) => ringContains(ring, coordinates)))
    return {
      id: feature.properties.dep_id,
      name: feature.properties.site_name,
      coordinates,
      elements,
      country: country?.iso3 || null,
      historicStatus: feature.properties.dev_stat,
      quality: feature.properties.grade,
      sourceUrl: `https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=${feature.properties.dep_id}`,
    }
  }).sort((a, b) => a.id.localeCompare(b.id))
  await save('packages/core/src/data/occurrences.json', records)
  provenance.occurrences = {
    url: service,
    importedAt: new Date().toISOString(),
    sourceStatus: 'MRDS; systematic updates ceased in 2011',
    selection: 'Quality A/B; excludes plants and unnamed records; at most 2 sites per 5-degree cell per element. No inference about deposit size or current operating status.',
    countryAssignment: 'Approximate spatial join against Natural Earth 1:110m boundaries; null if not matched.',
    counts,
    records: records.length,
    query: where,
    sha256: digest(JSON.stringify(features)),
  }
}

await writeFile(resolve('data/provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`)
console.log(`Import finished in ${fileURLToPath(root)}`)
