import type { CountryObservation, QuantitativeMetric, ResourceDataset } from '../types'

type SourceValue = number | 'W' | null
type SourceRow = [country: string, production: SourceValue, reserves: SourceValue, reserveNote?: string]

interface Commodity {
  symbol: string
  slug: string
  commodity: string
  basis: string
  productionMultiplier?: number
  reserveMultiplier?: number
  productionTotal: number
  reserveTotal: number
  productionOther: number
  reserveOther: number | null
  reserveLowerBound?: boolean
  otherLowerBound?: boolean
  excludesWithheld?: boolean
  note?: string
  rows: SourceRow[]
}

export const commodities: Commodity[] = [
  {
    symbol: 'Li', slug: 'lithium', commodity: 'Lithium', basis: 'Enthaltenes Lithium',
    productionTotal: 290_000, reserveTotal: 37_000_000, productionOther: 0, reserveOther: 2_400_000,
    excludesWithheld: true,
    note: 'Lithiumgehalt, nicht Lithiumcarbonat-Äquivalent. Die weltweite Förderung schließt die vertrauliche US-Produktion aus.',
    rows: [
      ['USA', 'W', 4_400_000], ['ARG', 23_000, 4_400_000],
      ['AUS', 92_000, 8_400_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 5.100.000 t.'],
      ['BRA', 12_000, 540_000], ['CAN', 5_600, 1_600_000], ['CHL', 56_000, 9_200_000],
      ['CHN', 62_000, 4_600_000], ['MLI', 9_400, 370_000], ['PRT', 380, 60_000], ['ZWE', 28_000, 500_000],
    ],
  },
  {
    symbol: 'Al', slug: 'bauxite-alumina', commodity: 'Bauxit', basis: 'Bauxit (Erzgewicht)',
    productionMultiplier: 1000, reserveMultiplier: 1000,
    productionTotal: 440_000, reserveTotal: 29_000_000, productionOther: 8_000, reserveOther: 5_300_000,
    excludesWithheld: true,
    note: 'Die Karte zeigt Bauxit als Ausgangsrohstoff für Aluminium. Die Werte sind Erzgewicht (trocken), keine Mengen reinen Aluminiums. Die weltweite Förderung schließt die vertrauliche US-Produktion aus.',
    rows: [
      ['USA', 'W', 20_000],
      ['AUS', 97_000, 3_700_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Bauxitreserven: 1,7 Mrd. t.'],
      ['BRA', 33_000, 1_700_000], ['CAN', 0, 0], ['CHN', 87_000, 710_000], ['DEU', 0, 0],
      ['GRC', 960, 0], ['GIN', 150_000, 7_400_000], ['IND', 25_000, 650_000], ['IDN', 10_000, 2_900_000],
      ['IRL', 0, 0], ['JAM', 6_200, 2_000_000], ['KAZ', 4_800, 160_000], ['RUS', 5_700, 650_000],
      ['SAU', 5_700, 180_000], ['ESP', 0, 0], ['TUR', 3_800, 69_000], ['ARE', 0, 0], ['VNM', 3_800, 3_100_000],
    ],
  },
  {
    symbol: 'Mn', slug: 'manganese', commodity: 'Manganerz', basis: 'Enthaltenes Mangan',
    productionMultiplier: 1000, reserveMultiplier: 1000,
    productionTotal: 20_000, reserveTotal: 1_800_000, productionOther: 1_300, reserveOther: null,
    note: 'Die Weltproduktionstabelle bezieht sich auf den Mangangehalt. Reserven sonstiger Länder sind in der Quelle nur als „Small“ angegeben.',
    rows: [
      ['USA', 0, 0], ['AUS', 1_600, 580_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 110 Mio. t Mangan.'],
      ['BRA', 800, 300_000], ['CHN', 700, 260_000], ['CIV', 350, null], ['GAB', 5_000, 61_000],
      ['GHA', 2_000, 13_000], ['IND', 790, 34_000], ['ZAF', 7_600, 550_000],
    ],
  },
  {
    symbol: 'Fe', slug: 'iron-ore', commodity: 'Eisenerz', basis: 'Enthaltenes Eisen',
    productionMultiplier: 1000, reserveMultiplier: 1_000_000,
    productionTotal: 1_600_000, reserveTotal: 87_000, productionOther: 36_000, reserveOther: 6_000,
    note: 'Angezeigt wird der Eiseninhalt, nicht das gesamte Erzgewicht. Die Quelle führt Förderung in Tausend Tonnen und Reserven in Millionen Tonnen; beide wurden in Tonnen Eisen umgerechnet.',
    rows: [
      ['USA', 24_000, 2_700], ['AUS', 600_000, 27_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 10 Mrd. t Eiseninhalt.'],
      ['BRA', 260_000, 15_000], ['CAN', 41_000, 2_300], ['CHL', 12_000, 740], ['CHN', 180_000, 3_000],
      ['IND', 190_000, 3_400], ['IRN', 61_000, 1_500], ['KAZ', 11_000, 1_500], ['MRT', 9_300, 4_400],
      ['MEX', 4_800, 520], ['PER', 14_000, 1_000], ['RUS', 50_000, 14_000], ['ZAF', 42_000, 680],
      ['SWE', 18_000, 600], ['TUR', 11_000, 99],
      ['UKR', 32_000, 2_300, 'Die Reserven entsprechen den Kategorien A und B der sowjetischen Reserveklassifikation.'],
    ],
  },
  {
    symbol: 'Co', slug: 'cobalt', commodity: 'Kobalt', basis: 'Enthaltenes Kobalt',
    productionTotal: 310_000, reserveTotal: 12_000_000, productionOther: 9_100, reserveOther: 780_000,
    rows: [
      ['USA', 300, 70_000], ['AUS', 3_700, 1_700_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 680.000 t.'],
      ['CAN', 3_500, 220_000], ['CHN', 2_000, 160_000], ['COD', 230_000, 6_000_000], ['CUB', 2_000, 500_000],
      ['IDN', 44_000, 760_000], ['MDG', 3_900, 100_000], ['PNG', 2_800, 84_000], ['PHL', 3_700, 260_000],
      ['RUS', 7_700, 800_000, 'Reserveangabe des russischen Ministeriums für natürliche Ressourcen.'], ['TUR', 1_900, 91_000],
    ],
  },
  {
    symbol: 'Ni', slug: 'nickel', commodity: 'Nickel', basis: 'Enthaltenes Nickel',
    productionTotal: 3_900_000, reserveTotal: 140_000_000, productionOther: 290_000, reserveOther: 9_100_000,
    reserveLowerBound: true, otherLowerBound: true,
    note: 'Neukaledonien wird als französisches Überseegebiet separat geführt. Die weltweiten Reserven und die Reserven sonstiger Länder sind Untergrenzen.',
    rows: [
      ['USA', 10_000, 340_000], ['AUS', 45_000, 25_000_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 11 Mio. t.'],
      ['BRA', 70_000, 16_000_000], ['CAN', 140_000, 2_200_000], ['CHN', 120_000, 4_400_000],
      ['IDN', 2_600_000, 62_000_000], ['NCL', 140_000, 7_100_000], ['PHL', 270_000, 4_800_000], ['RUS', 200_000, 8_300_000],
    ],
  },
  {
    symbol: 'Cu', slug: 'copper', commodity: 'Kupfer', basis: 'Enthaltenes Kupfer',
    productionMultiplier: 1000, reserveMultiplier: 1000,
    productionTotal: 23_000, reserveTotal: 980_000, productionOther: 3_000, reserveOther: 210_000,
    note: 'Förderung bezeichnet den Kupferinhalt der Minenproduktion, nicht die geografisch anders verteilte Raffinerieproduktion.',
    rows: [
      ['USA', 1_000, 47_000], ['AUS', 730, 100_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 27 Mio. t.'],
      ['CAN', 500, 7_000], ['CHL', 5_300, 180_000], ['CHN', 1_800, 41_000], ['COD', 3_200, 80_000],
      ['DEU', 0, 0], ['IND', 23, 2_200], ['IDN', 710, 21_000], ['JPN', 0, 0], ['KAZ', 710, 20_000],
      ['KOR', 0, 0], ['MEX', 690, 53_000], ['PER', 2_700, 85_000], ['POL', 410, 33_000],
      ['RUS', 1_300, 80_000], ['ZMB', 940, 21_000],
    ],
  },
  {
    symbol: 'Zn', slug: 'zinc', commodity: 'Zink', basis: 'Enthaltenes Zink',
    productionMultiplier: 1000, reserveMultiplier: 1000,
    productionTotal: 13_000, reserveTotal: 240_000, productionOther: 2_000, reserveOther: 25_000,
    rows: [
      ['USA', 670, 9_300], ['AUS', 1_100, 64_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 19 Mio. t.'],
      ['BOL', 500, null], ['CHN', 4_100, 60_000], ['IND', 870, 10_000], ['KAZ', 360, 7_400],
      ['MEX', 780, 14_000], ['PER', 1_500, 18_000], ['RUS', 430, 29_000], ['SWE', 230, 4_100],
    ],
  },
  {
    symbol: 'Ag', slug: 'silver', commodity: 'Silber', basis: 'Enthaltenes Silber',
    productionTotal: 26_000, reserveTotal: 610_000, productionOther: 2_100, reserveOther: 57_000,
    rows: [
      ['USA', 1_100, 23_000], ['ARG', 800, 6_500],
      ['AUS', 1_000, 91_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 22.000 t.'],
      ['BOL', 1_500, 22_000], ['CAN', 400, 4_900], ['CHL', 1_400, 33_000], ['CHN', 3_400, 67_000],
      ['IND', 800, 8_000], ['KAZ', 630, null], ['MEX', 6_300, 37_000], ['PER', 3_600, 110_000],
      ['POL', 1_300, 59_000], ['RUS', 1_200, 92_000], ['SWE', 400, null],
    ],
  },
  {
    symbol: 'Sn', slug: 'tin', commodity: 'Zinn', basis: 'Enthaltenes Zinn',
    productionTotal: 290_000, reserveTotal: 6_000_000, productionOther: 1_700, reserveOther: 310_000,
    reserveLowerBound: true,
    rows: [
      ['USA', 0, 0], ['AUS', 12_000, 570_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 220.000 t.'],
      ['BOL', 15_000, 400_000], ['BRA', 28_000, 700_000], ['MMR', 12_000, 700_000], ['CHN', 71_000, 1_200_000],
      ['COD', 27_000, 91_000], ['IDN', 61_000, 1_400_000], ['LAO', 1_800, null], ['MYS', 5_000, null],
      ['NGA', 3_500, null], ['PER', 33_000, 150_000], ['RUS', 4_500, 460_000], ['RWA', 4_600, null], ['VNM', 11_000, 23_000],
    ],
  },
  {
    symbol: 'W', slug: 'tungsten', commodity: 'Wolfram', basis: 'Enthaltenes Wolfram',
    productionTotal: 85_000, reserveTotal: 4_700_000, productionOther: 2_400, reserveOther: 950_000,
    reserveLowerBound: true,
    rows: [
      ['USA', 0, null], ['AUS', 1_000, 570_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 220.000 t.'],
      ['AUT', 840, 10_000], ['BOL', 1_700, null], ['CHN', 67_000, 2_500_000], ['KAZ', 2_400, null],
      ['PRK', 2_000, 29_000], ['PRT', 700, 3_400], ['RUS', 2_000, 400_000], ['RWA', 1_300, null],
      ['ESP', 800, 66_000], ['VNM', 3_000, 170_000],
    ],
  },
  {
    symbol: 'Au', slug: 'gold', commodity: 'Gold', basis: 'Enthaltenes Gold',
    productionTotal: 3_300, reserveTotal: 66_000, productionOther: 1_000, reserveOther: 11_000,
    rows: [
      ['USA', 160, 3_000], ['AUS', 280, 13_000, 'USGS-Tabellenwert. JORC-konforme oder äquivalente Reserven: 4.500 t.'],
      ['BRA', 80, 2_500], ['CAN', 200, 3_200], ['CHN', 380, 3_200], ['GHA', 150, 1_000],
      ['IDN', 90, 3_600], ['KAZ', 130, 2_300], ['MEX', 140, 1_400], ['PER', 110, 2_200],
      ['RUS', 310, 12_000], ['ZAF', 90, 5_000], ['UZB', 130, 2_200],
    ],
  },
]

function buildDataset(commodity: Commodity, metric: QuantitativeMetric): ResourceDataset {
  const production = metric === 'production'
  const multiplier = (production ? commodity.productionMultiplier : commodity.reserveMultiplier) ?? 1
  const lowerBound = !production && !!commodity.reserveLowerBound
  const records: CountryObservation[] = commodity.rows.map(([country, mined, reserve, note]) => {
    const sourceValue = production ? mined : reserve
    return {
      country,
      value: typeof sourceValue === 'number' ? sourceValue * multiplier : null,
      status: sourceValue === 'W' ? 'withheld' : sourceValue === null ? 'unavailable' : production ? 'estimated' : 'reported',
      ...(!production && note ? { note } : {}),
    }
  })
  const other = production ? commodity.productionOther : commodity.reserveOther
  return {
    element: commodity.symbol,
    commodity: commodity.commodity,
    basis: commodity.basis,
    metric,
    year: production ? 2025 : 2026,
    unit: 't',
    sourceUrl: `https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-${commodity.slug}.pdf`,
    sourceTitle: 'USGS Mineral Commodity Summaries 2026',
    note: [
      production
        ? 'Minenförderung im Kalenderjahr 2025; vorläufige USGS-Schätzungen. Weltwerte sind gerundet.'
        : 'Reserveangaben der USGS-Ausgabe 2026. Länderspezifische Klassifikationen können abweichen, insbesondere bei Australien. Bekannte Reserven sind keine Schätzung aller geologisch vorhandenen Mengen.',
      commodity.note,
    ].filter(Boolean).join(' '),
    records,
    worldTotal: {
      value: (production ? commodity.productionTotal : commodity.reserveTotal) * multiplier,
      qualifier: lowerBound ? 'lower-bound' : 'rounded',
      comparable: !lowerBound && !(production && commodity.excludesWithheld),
      ...(production && commodity.excludesWithheld ? { note: 'Ohne vertrauliche US-Produktion' } : {}),
    },
    otherCountries: {
      value: other === null ? null : other * multiplier,
      qualifier: other === null ? 'unspecified' : !production && commodity.otherLowerBound ? 'lower-bound' : 'rounded',
    },
  }
}

export const datasets = commodities.flatMap((commodity) => [
  buildDataset(commodity, 'production'),
  buildDataset(commodity, 'reserves'),
])

export const supportedSymbols = commodities.map((commodity) => commodity.symbol)
