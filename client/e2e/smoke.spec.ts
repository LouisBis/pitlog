import { test } from '@playwright/test'

// MSW service worker registration can hang in CI headless chromium —
// if worker.start() never resolves, React never mounts and the page stays blank.
// We override window.fetch via addInitScript instead: same JS-level interception
// used by visual.spec.ts, no service worker involved.
//
// URL checks must go from most-specific to least-specific — /api/v1/catalog/:slug
// must be checked before /api/v1/catalog or the entry endpoint gets the summaries
// array, making TorquePanel crash on entry.torque_specs.filter().

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

function mockFetch(mocks: { moto: string; tickets: string; catalogEntry: string; catalogSummaries: string }) {
  const _fetch = window.fetch
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const json = (data: string) => Promise.resolve(new Response(data, { status: 200, headers: { 'Content-Type': 'application/json' } }))
    if (url.includes('/api/v1/user-motorcycles/') && url.includes('/velocity')) return json('{"kmPerDay":null,"dataPoints":0,"periodDays":0}')
    if (url.includes('/api/v1/user-motorcycles')) return json(mocks.moto)
    if (url.includes('/api/v1/tickets')) return json(mocks.tickets)
    if (url.includes('/api/v1/catalog/')) return json(mocks.catalogEntry)
    if (url.includes('/api/v1/catalog')) return json(mocks.catalogSummaries)
    return _fetch(input, init)
  }
}

test('garage page loads with mock motorcycle', async ({ page }) => {
  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
  })
  await page.goto('/pitlog/garage')
  // waitForSelector polls the DOM directly with a generous timeout — more reliable
  // in CI than networkidle + toBeVisible() when all fetches are mocked (no network).
  await page.waitForSelector('text=GSF 600 Bandit', { state: 'visible', timeout: 15000 })
})

test('board page loads with mock tickets', async ({ page }) => {
  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
  })
  await page.goto('/pitlog/board/1')
  await page.waitForSelector('text=Vidange huile moteur', { state: 'visible', timeout: 15000 })
})
