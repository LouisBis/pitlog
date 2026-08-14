import { test, takeSnapshot } from '@chromatic-com/playwright'

// HomePage excluded: Three.js ASCII animation renders new frames every tick — no stable screenshot possible

test('Garage', async ({ page }, testInfo) => {
  await page.goto('/pitlog/garage')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'e2e/screenshots/garage.png', fullPage: true })
  await takeSnapshot(page, 'Garage', testInfo)
})

test('Board', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'e2e/screenshots/board.png', fullPage: true })
  await takeSnapshot(page, 'Board', testInfo)
})

test('History', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1/history')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'History', testInfo)
})

test('Reference', async ({ page }, testInfo) => {
  await page.goto('/pitlog/board/1/reference')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'Reference', testInfo)
})
