import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('explores an element and switches between all three map modes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Die Welt steckt voller/ })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Element suchen' }).fill('Lithium')
  await page.getByRole('button', { name: 'Lithium (Li), Ordnungszahl 3', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Lithium entdecken' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByText('Batterien & Energiespeicher', { exact: true })).toBeVisible()
  await sheet.getByRole('button', { name: 'Auf der Weltkarte entdecken' }).click()
  await expect(page).toHaveURL(/view=map/)
  await expect(page.getByRole('button', { name: 'Reserven', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  await page.getByRole('button', { name: 'Förderung', exact: true }).click()
  await expect(page).toHaveURL(/mode=production/)
  await expect(page.getByTestId('metric-period')).toContainText('2025')
  await page.getByRole('button', { name: 'Vorkommen', exact: true }).click()
  await expect(page).toHaveURL(/mode=occurrences/)
  await expect(page.getByText('Historische Fundstellen', { exact: true })).toBeVisible()
  await expect(page.getByText(/seit 2011 nicht mehr systematisch/).first()).toBeVisible()
})

test('restores a deep link and browser history while preserving the element', async ({ page }) => {
  await page.goto('/?view=map&element=Cu&mode=production')
  await expect(page.getByRole('combobox', { name: 'Element auf der Karte' })).toHaveValue('Cu')
  await page.getByRole('button', { name: 'Reserven', exact: true }).click()
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Förderung', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Periodensystem', exact: true }).click()
  await page.getByRole('button', { name: 'Weltkarte', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Element auf der Karte' })).toHaveValue('Cu')
})

test('explains unavailable data and retains a usable numerical view', async ({ page }) => {
  await page.goto('/?view=map&element=He&mode=reserves')
  await expect(page.getByRole('heading', { name: 'Noch keine Kartendaten' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Element auf der Karte' }).selectOption('Li')
  await page.getByRole('button', { name: 'Datentabelle', exact: true }).click()
  const table = page.getByRole('table', { name: /Länderwerte/ })
  await expect(table).toBeVisible()
  await expect(table.getByRole('rowheader', { name: 'Chile', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Förderung', exact: true }).click()
  await expect(table.getByText('Vertraulich', { exact: true })).toBeVisible()
})

test('is keyboard usable and keeps the page inside the mobile viewport', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Element suchen' }).fill('Gold')
  const gold = page.getByRole('button', { name: 'Gold (Au), Ordnungszahl 79', exact: true })
  await gold.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Gold entdecken' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(width.document).toBeLessThanOrEqual(width.viewport)
})

test('renders the map without depending on external tiles or live APIs', async ({ page, baseURL }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) {
      externalRequests.push(request.url())
    }
  })
  await page.goto('/?view=map&element=Cu&mode=reserves')
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  const mapBounds = await page.locator('.map-canvas-container').boundingBox()
  expect(mapBounds?.height).toBeGreaterThan(400)
  expect(externalRequests).toEqual([])
})

test('keeps icon-only controls accessible on small screens', async ({ page }) => {
  await page.goto('/?view=map&element=Li&mode=reserves')
  await expect(page.getByRole('button', { name: '', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ansicht teilen', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Über die Daten', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Daten und Methodik' })).toBeVisible()
})

test('selects a country from rendered map geometry', async ({ page }) => {
  await page.goto('/?view=map&element=Li&mode=reserves')
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  const map = page.locator('.map-canvas-container')
  await map.scrollIntoViewIfNeeded()
  const bounds = (await map.boundingBox())!
  expect(bounds.height).toBeGreaterThan(400)
  const worldSize = 512 * 2 ** Math.max(0.05, Math.log2(bounds.width / 512) - 0.15)
  const mercator = (latitude: number) => (1 - Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360)) / Math.PI) / 2
  const point = {
    x: bounds.width / 2 + (-95 - 12) / 360 * worldSize,
    y: bounds.height / 2 + (mercator(55) - mercator(18)) * worldSize,
  }
  await expect(async () => {
    await map.hover({ position: point })
    await expect(page.locator('.map-hover-card')).toContainText('Kanada')
  }).toPass()
  await map.click({ position: point })
  await expect(page.locator('.selected-country h3')).toHaveText('Kanada')
  await expect(page.locator('.selected-country')).toContainText('1.600.000 t')
})

test('selects an actual historical marker after zooming to a site', async ({ page }) => {
  await page.goto('/?view=map&element=Li&mode=occurrences')
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  const firstSite = page.locator('.site-list button').first()
  const name = await firstSite.locator('strong').innerText()
  await firstSite.click()
  await expect(page.locator('.selected-site h3')).toHaveText(name)
  await page.getByRole('button', { name: 'Karte vergrößern', exact: true }).click()
  await page.getByRole('button', { name: 'Standortauswahl aufheben', exact: true }).click()
  const map = page.locator('.map-canvas-container')
  await map.scrollIntoViewIfNeeded()
  const bounds = (await map.boundingBox())!
  const point = { x: bounds.width / 2, y: bounds.height / 2 }
  await expect(async () => {
    await map.hover({ position: point })
    await expect(page.locator('.map-hover-card')).toContainText(name)
  }).toPass()
  await map.click({ position: point })
  await expect(page.locator('.selected-site h3')).toHaveText(name)
  await expect(page.locator('.selected-site a')).toHaveAttribute('href', /^https:\/\/mrdata\.usgs\.gov\/mrds\/show-mrds\.php\?dep_id=\d+$/)
})

test('retains data access on a map failure and recovers on retry', async ({ page }) => {
  await page.route('**/data/countries.geojson', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/?view=map&element=Li&mode=reserves')
  await expect(page.locator('.map-error')).toBeVisible()
  await page.getByRole('button', { name: 'Tabelle öffnen', exact: true }).click()
  await expect(page.getByRole('table', { name: /Länderwerte/ })).toBeVisible()
  await page.getByRole('button', { name: 'Karte', exact: true }).click()
  await expect(page.locator('.map-error')).toBeVisible()
  await page.unroute('**/data/countries.geojson')
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click()
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  expect((await page.locator('.map-canvas-container').boundingBox())?.height).toBeGreaterThan(400)
})

test('exports the selected metric with units, sources and confidential values preserved', async ({ page }) => {
  await page.goto('/?view=map&element=Li&mode=production')
  await page.getByRole('button', { name: 'Datentabelle', exact: true }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV herunterladen', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('elementa-Li-production-2025.csv')
  const csv = await readFile((await download.path())!, 'utf8')
  expect(csv).toContain('"Enthaltenes Lithium"')
  expect(csv).toContain('https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf')
  expect(csv.split('\r\n').find((line) => line.includes('"USA"'))).toContain(',"","t","Vertraulich"')
  expect(csv.split('\r\n').find((line) => line.includes('"AUS"'))).toContain(',92000,"t","Schätzung"')
})

test('shares the current element and mode and offers a fallback when clipboard access is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => { sessionStorage.setItem('test-shared-url', text) } },
    })
  })
  await page.goto('/?view=map&element=Cu&mode=production')
  await page.getByRole('button', { name: 'Ansicht teilen', exact: true }).click()
  expect(await page.evaluate(() => sessionStorage.getItem('test-shared-url'))).toBe(page.url())
  await expect(page.getByRole('status').filter({ hasText: 'Link zur aktuellen Ansicht kopiert' })).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => { throw new Error('Clipboard access denied') } },
    })
  })
  await page.getByRole('button', { name: 'Vorkommen', exact: true }).click()
  await page.getByRole('button', { name: 'Ansicht teilen', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Link zum Kopieren' })).toHaveValue(page.url())
})
