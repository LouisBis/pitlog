import { test, takeSnapshot } from '@chromatic-com/playwright'

// page.route() conflicts with @chromatic-com/playwright's CDP ResourceArchiver:
// both call Fetch.enable() and whichever calls Fetch.continueRequest first wins,
// bypassing the mock. We override window.fetch via addInitScript() instead —
// this intercepts at the JS level before any network request is made, so CDP
// never sees the API calls and networkidle works correctly.

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
  { id: 2, userMotorcycleId: 1, catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
    intervalSlug: 'air-filter-inspection', customIntervalId: null, operation: 'Filtre à air',
    status: 'todo', targetKm: 15350, targetDate: null, doneKm: null, doneAt: null,
    customKm: null, customDays: null },
  { id: 3, userMotorcycleId: 1, catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
    intervalSlug: 'spark-plugs-replacement', customIntervalId: null, operation: 'Bougies',
    status: 'in_progress', targetKm: 15650, targetDate: null, doneKm: null, doneAt: null,
    customKm: null, customDays: null },
  { id: 4, userMotorcycleId: 1, catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
    intervalSlug: 'brake-fluid-replacement', customIntervalId: null, operation: 'Liquide de frein',
    status: 'done', targetKm: 14000, targetDate: null, doneKm: 14050, doneAt: '2025-11-20T00:00:00.000Z',
    customKm: null, customDays: null },
]

const CATALOG_ENTRY = {
  slug: 'suzuki-gsf600-bandit-1995-1999',
  brand: 'Suzuki', model: 'GSF 600 Bandit', year_start: 1995, year_end: 1999,
  categories: [
    { slug: 'engine', intervals: [
      { slug: 'oil-change', operation: 'Engine oil change', km: 6000, days: 365 },
      { slug: 'oil-filter', operation: 'Engine oil filter', km: 12000, days: 730 },
      { slug: 'air-filter-inspection', operation: 'Air filter inspection', km: 6000, days: 365 },
      { slug: 'spark-plugs-replacement', operation: 'Spark plugs replacement', km: 12000, days: 730 },
      { slug: 'valve-clearance-check', operation: 'Valve clearance check', km: 48000, days: null },
    ]},
    { slug: 'brakes', intervals: [
      { slug: 'brake-fluid-replacement', operation: 'Brake fluid replacement', km: null, days: 730 },
    ]},
  ],
  torque_specs: [
    { slug: 'spark-plug', category: 'engine', component: 'Spark plug', nm: 20, note: null, related_intervals: ['spark-plugs-replacement'] },
    { slug: 'oil-drain-bolt', category: 'engine', component: 'Oil drain bolt', nm: 35, note: null, related_intervals: ['oil-change', 'oil-filter'] },
    { slug: 'front-axle', category: 'chassis', component: 'Front wheel axle', nm: 65, note: null, related_intervals: [] },
  ],
}

const CATALOG_SUMMARIES = [
  { slug: CATALOG_ENTRY.slug, brand: CATALOG_ENTRY.brand, model: CATALOG_ENTRY.model,
    year_start: CATALOG_ENTRY.year_start, year_end: CATALOG_ENTRY.year_end },
]

const VELOCITY = { kmPerDay: 6.99, dataPoints: 4, periodDays: 458.5 }

type FetchMocks = { moto: string; tickets: string; catalogEntry: string; catalogSummaries: string; velocity: string }

function mockFetch(mocks: FetchMocks) {
  const _fetch = window.fetch
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const json = (data: string) => {
      console.log('[mock] intercepted:', url)
      return Promise.resolve(new Response(data, { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    if (url.includes('/api/v1/user-motorcycles/') && url.includes('/velocity')) return json(mocks.velocity)
    if (url.includes('/api/v1/user-motorcycles')) return json(mocks.moto)
    if (url.includes('/api/v1/tickets')) return json(mocks.tickets)
    if (url.includes('/api/v1/catalog/suzuki-gsf600-bandit-1995-1999')) return json(mocks.catalogEntry)
    if (url.includes('/api/v1/catalog')) return json(mocks.catalogSummaries)
    console.log('[mock] passthrough:', url)
    return _fetch(input, init)
  }
}

// HomePage excluded: Three.js ASCII animation renders new frames every tick — no stable screenshot possible.

test('Garage', async ({ page }, testInfo) => {
  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
    velocity: JSON.stringify(VELOCITY),
  })
  await page.goto('/pitlog/garage')
  await page.waitForLoadState('networkidle')
  await testInfo.attach('garage.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await takeSnapshot(page, 'Garage', testInfo)
})

test('Board', async ({ page }, testInfo) => {
  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
    velocity: JSON.stringify(VELOCITY),
  })
  await page.goto('/pitlog/board/1')
  await page.waitForLoadState('networkidle')
  await testInfo.attach('board.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await takeSnapshot(page, 'Board', testInfo)
})

test('History', async ({ page }, testInfo) => {
  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
    velocity: JSON.stringify(VELOCITY),
  })
  await page.goto('/pitlog/board/1/history')
  await page.waitForLoadState('networkidle')
  await testInfo.attach('history.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await takeSnapshot(page, 'History', testInfo)
})

test('Reference', async ({ page }, testInfo) => {
  const consoleLogs: string[] = []
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`))

  await page.addInitScript(mockFetch, {
    moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS),
    catalogEntry: JSON.stringify(CATALOG_ENTRY), catalogSummaries: JSON.stringify(CATALOG_SUMMARIES),
    velocity: JSON.stringify(VELOCITY),
  })
  await page.goto('/pitlog/board/1/reference')
  await page.waitForLoadState('networkidle')

  // Capture state right after networkidle for CI debugging
  await testInfo.attach('reference-after-networkidle.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await testInfo.attach('console.txt', { body: consoleLogs.join('\n'), contentType: 'text/plain' })

  // useCatalogEntry depends on moto?.catalogSlug which loads after useUserMotorcycles —
  // two sequential async rounds means networkidle fires before the second render completes.
  // Wait for <details> (CategorySection) which only appears once the catalog entry is loaded.
  await page.waitForSelector('details', { state: 'visible', timeout: 10000 })
  await testInfo.attach('reference.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await takeSnapshot(page, 'Reference', testInfo)
})
