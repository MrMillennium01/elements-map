import { expect, test } from '@playwright/test'

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

test('renders the map without depending on external tiles or live APIs', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173')) {
      externalRequests.push(request.url())
    }
  })
  await page.goto('/?view=map&element=Cu&mode=reserves')
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  expect(externalRequests).toEqual([])
})
