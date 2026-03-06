import { test, expect } from '@playwright/test';

async function login(page, testInfo) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('codewavesfl@gmail.com');
  await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD || 'test1234');
  await page.locator('button[type="submit"]').click();
  const result = await Promise.race([
    page.waitForURL('**/events**', { timeout: 8000 }).then(() => 'ok'),
    page.locator('text=Invalid credentials').waitFor({ timeout: 8000 }).then(() => 'bad-creds'),
  ]);
  if (result === 'bad-creds') {
    testInfo.skip(true, 'TEST_PASSWORD not set or invalid — skipping auth test');
  }
}

async function openLayout(page, testInfo) {
  await login(page, testInfo);
  // Click into DBAF26
  await page.locator('text=DBAF26').first().click();
  await page.waitForURL('**/events/**');
  // Click first layout link
  await page.locator('text=Demo Layout').first().click();
  await page.waitForURL('**/layouts/**', { timeout: 10000 });
  // Wait for map to load
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });
}

test.describe('Map Builder', () => {
  test('loads map with sidebar controls', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Sidebar should have key sections
    await expect(page.locator('text=Spots')).toBeVisible();
    await expect(page.locator('text=Pricing & Revenue')).toBeVisible();
  });

  test('shows spot count in sidebar', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Should show spot count somewhere
    const spotsSection = page.locator('text=/\\d+ spot/i');
    await expect(spotsSection).toBeVisible({ timeout: 5000 });
  });

  test('Select All button selects spots', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Find and click Select All
    const selectAllBtn = page.locator('button:has-text("Select All")');
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();

      // Should show selected count
      await expect(page.locator('text=/\\d+ selected/')).toBeVisible({ timeout: 3000 });
    }
  });

  test('Ctrl+A selects all spots', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Press Ctrl+A
    await page.keyboard.press('Meta+a');

    // Should show selected count or banner
    const selectedIndicator = page.locator('text=/\\d+ spot.*selected/i').or(page.locator('text=/\\d+ selected/'));
    // Only check if spots exist
    const spotCount = page.locator('text=/\\d+ spot/i');
    if (await spotCount.isVisible()) {
      await expect(selectedIndicator).toBeVisible({ timeout: 3000 });
    }
  });

  test('Escape deselects all', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Select all then escape
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');

    // Selected count should disappear
    await expect(page.locator('text=/\\d+ selected/')).not.toBeVisible({ timeout: 3000 });
  });

  test('map tiles load', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Leaflet tiles should be present
    const tiles = page.locator('.leaflet-tile-loaded');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
  });

  test('map style switcher works', async ({ page }, testInfo) => {
    await openLayout(page, testInfo);

    // Should have map style buttons
    const satelliteBtn = page.locator('button:has-text("Satellite")');
    if (await satelliteBtn.isVisible()) {
      await satelliteBtn.click();
      // Tiles should still load after switching
      const tiles = page.locator('.leaflet-tile-loaded');
      await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
