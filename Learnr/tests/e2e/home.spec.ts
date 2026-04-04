import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  // Check basic title or content exists
  const title = await page.locator('h1').first();
  await expect(title).toBeVisible();
});
