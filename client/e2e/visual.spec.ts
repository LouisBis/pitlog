import { test } from '@chromatic-com/playwright'

// HomePage excluded: Three.js ASCII animation renders new frames every tick — no stable screenshot possible

test('Garage', async ({ page, takeSnapshot }) => {
  await page.goto('/pitlog/garage')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'Garage')
})

test('Board', async ({ page, takeSnapshot }) => {
  await page.goto('/pitlog/board/1')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'Board')
})

test('History', async ({ page, takeSnapshot }) => {
  await page.goto('/pitlog/board/1/history')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'History')
})

test('Reference', async ({ page, takeSnapshot }) => {
  await page.goto('/pitlog/board/1/reference')
  await page.waitForLoadState('networkidle')
  await takeSnapshot(page, 'Reference')
})
