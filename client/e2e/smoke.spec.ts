import { test, type Page } from '@playwright/test'

// page.route() intercepts at the Playwright/CDP level — more reliable in CI
// headless Chromium than addInitScript window.fetch override, which can silently
// fail to intercept fetch calls in some headless environments.
//
// URL checks must go from most specific to least specific, because Playwright
// matches routes in LIFO order (last registered = tried first):
// - /user-motorcycles/*/velocity before /user-motorcycles
// - /catalog/** before /catalog

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
  // Least specific first — LIFO means last registered is tried first
  await page.route('**/api/v1/catalog', (route) => route.fulfill({ json: CATALOG_SUMMARIES }))
  await page.route('**/api/v1/catalog/**', (route) => route.fulfill({ json: CATALOG_ENTRY }))
  await page.route('**/api/v1/tickets**', (route) => route.fulfill({ json: TICKETS }))
  await page.route('**/api/v1/user-motorcycles', (route) => route.fulfill({ json: MOTO }))
  await page.route('**/api/v1/user-motorcycles/*/velocity', (route) =>
    route.fulfill({ json: { kmPerDay: null, dataPoints: 0, periodDays: 0 } })
  )
}

test('garage page loads with mock motorcycle', async ({ page }) => {
  await setupMocks(page)
  await page.goto('/pitlog/garage')
  await page.waitForSelector('text=GSF 600 Bandit', { state: 'visible', timeout: 15000 })
})

test('board page loads with mock tickets', async ({ page }) => {
  await setupMocks(page)
  await page.goto('/pitlog/board/1')
  // getOperationLabel resolves intervalSlug 'oil-change' → fr.json → 'Vidange huile moteur'
  await page.waitForSelector('text=Vidange huile moteur', { state: 'visible', timeout: 15000 })
})
