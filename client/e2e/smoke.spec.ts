import { test, expect } from '@playwright/test'

// MSW service worker registration can hang in CI headless chromium —
// if worker.start() never resolves, React never mounts and the page stays blank.
// We override window.fetch via addInitScript instead: same JS-level interception
// used by visual.spec.ts, no service worker involved.

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

function mockFetch(mocks: { moto: string; tickets: string }) {
  const _fetch = window.fetch
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const json = (data: string) => Promise.resolve(new Response(data, { status: 200, headers: { 'Content-Type': 'application/json' } }))
    if (url.includes('/api/v1/user-motorcycles')) return json(mocks.moto)
    if (url.includes('/api/v1/tickets')) return json(mocks.tickets)
    return _fetch(input, init)
  }
}

test('garage page loads with mock motorcycle', async ({ page }) => {
  await page.addInitScript(mockFetch, { moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS) })
  await page.goto('/pitlog/garage')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('GSF 600 Bandit')).toBeVisible()
})

test('board page loads with mock tickets', async ({ page }) => {
  await page.addInitScript(mockFetch, { moto: JSON.stringify(MOTO), tickets: JSON.stringify(TICKETS) })
  await page.goto('/pitlog/board/1')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Vidange huile moteur')).toBeVisible()
})
