import { test, expect } from '@playwright/test'

test('garage page loads with mock motorcycle', async ({ page }) => {
  await page.goto('/pitlog/garage')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('GSF 600 Bandit')).toBeVisible()
})

test('board page loads with mock tickets', async ({ page }) => {
  await page.goto('/pitlog/board/1')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Vidange huile moteur')).toBeVisible()
})
