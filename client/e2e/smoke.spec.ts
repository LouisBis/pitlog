import { test, expect, type Page } from '@playwright/test'

const MOTO = [
  { id: 1, currentKm: 15200, acquiredAt: '2021-03-15T00:00:00.000Z',
    motorcycleId: 1, brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997,
    isCustom: false, catalogSlug: 'suzuki-gsf600-bandit-1995-1999' },
]

const TICKETS = [
  { id: 1, userMotorcycleId: 1, catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
    intervalSlug: 'oil-change', customIntervalId: null, operation: 'Vidange moteur',
    status: 'todo', targetKm: 15000, targetDate: null, doneKm: null, doneAt: null,
    customKm: null, customDays: null },
]

const CATALOG_ENTRY = {
  slug: 'suzuki-gsf600-bandit-1995-1999',
  brand: 'Suzuki', model: 'GSF 600 Bandit', year_start: 1995, year_end: 1999,
  categories: [], torque_specs: [],
}

const CATALOG_SUMMARIES = [
  { slug: CATALOG_ENTRY.slug, brand: CATALOG_ENTRY.brand, model: CATALOG_ENTRY.model,
    year_start: CATALOG_ENTRY.year_start, year_end: CATALOG_ENTRY.year_end },
]

async function setupMocks(page: Page) {
  await page.route('**/api/v1/catalog', (route) => route.fulfill({ json: CATALOG_SUMMARIES }))
  await page.route('**/api/v1/catalog/**', (route) => route.fulfill({ json: CATALOG_ENTRY }))
  await page.route('**/api/v1/tickets**', (route) => route.fulfill({ json: TICKETS }))
  await page.route('**/api/v1/user-motorcycles', (route) => route.fulfill({ json: MOTO }))
  await page.route('**/api/v1/user-motorcycles/*/velocity', (route) =>
    route.fulfill({ json: { kmPerDay: null, dataPoints: 0, periodDays: 0 } })
  )
}

function attachListeners(page: Page) {
  page.on('console', (msg) => console.log(`[browser:${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => console.error(`[page-error] ${err.message}`))
  page.on('request', (req) => console.log(`[req] ${req.method()} ${req.url()}`))
  page.on('response', (res) => console.log(`[res] ${res.status()} ${res.url()}`))
}

async function dumpOnFailure(page: Page, label: string) {
  console.log(`\n=== DIAGNOSTIC: ${label} ===`)
  console.log('[url]', page.url())
  console.log('[html]\n', await page.content())
}

test('garage page loads with mock motorcycle', async ({ page }) => {
  attachListeners(page)
  await setupMocks(page)
  await page.goto('/pitlog/garage')
  const found = await page.waitForSelector('text=GSF 600 Bandit', { state: 'visible', timeout: 15000 }).catch(() => null)
  if (!found) await dumpOnFailure(page, 'garage — GSF 600 Bandit not found')
  expect(found, 'GSF 600 Bandit doit être visible sur la page garage').not.toBeNull()
})

test('board page loads with mock tickets', async ({ page }) => {
  attachListeners(page)
  await setupMocks(page)
  await page.goto('/pitlog/board/1')
  const found = await page.waitForSelector('text=Vidange huile moteur', { state: 'visible', timeout: 15000 }).catch(() => null)
  if (!found) await dumpOnFailure(page, 'board — Vidange huile moteur not found')
  expect(found, 'Vidange huile moteur doit être visible sur la page board').not.toBeNull()
})
