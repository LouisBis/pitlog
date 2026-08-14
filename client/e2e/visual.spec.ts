import { test, takeSnapshot } from '@chromatic-com/playwright'

// HomePage excluded: Three.js ASCII animation renders new frames every tick — no stable screenshot possible

// MSW intercepts API calls via service worker — Playwright's networkidle fires before data arrives.
// Each test waits for a data-dependent element instead.

test('Garage', async ({ page }, testInfo) => {
  await page.goto('/pitlog/garage')
  await page.waitForSelector('[class*="card"]')
  await takeSnapshot(page, 'Garage', testInfo)
})

test('Board', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1')
  await page.waitForSelector('[class*="column"]')
  await takeSnapshot(page, 'Board', testInfo)
})

test('History', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1/history')
  await page.waitForSelector('[class*="row"], [class*="empty"]')
  await takeSnapshot(page, 'History', testInfo)
})

test('Reference', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1/reference')
  await page.waitForSelector('[class*="details"]')
  await takeSnapshot(page, 'Reference', testInfo)
})
