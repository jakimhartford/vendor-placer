import { test, expect } from '@playwright/test';

// These tests require auth — we'll login first
async function login(page, testInfo) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('codewavesfl@gmail.com');
  await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD || 'test1234');
  await page.locator('button[type="submit"]').click();
  // Wait for either successful redirect or error message
  const result = await Promise.race([
    page.waitForURL('**/events**', { timeout: 8000 }).then(() => 'ok'),
    page.locator('text=Invalid credentials').waitFor({ timeout: 8000 }).then(() => 'bad-creds'),
  ]);
  if (result === 'bad-creds') {
    testInfo.skip(true, 'TEST_PASSWORD not set or invalid — skipping auth test');
  }
}

test.describe('Event Config Page', () => {
  test('can navigate to event config and page scrolls', async ({ page }, testInfo) => {
    await login(page, testInfo);

    // Click into DBAF26 event
    await page.locator('text=DBAF26').first().click();
    await page.waitForURL('**/events/**');

    // Click Configure Event button
    await page.locator('text=Configure Event').click();
    await page.waitForURL('**/configure');

    // Should show Event Configuration header
    await expect(page.locator('text=Event Configuration')).toBeVisible();
    await expect(page.locator('text=Event Details')).toBeVisible();

    // Should be able to scroll to Info Sections
    const infoSections = page.locator('text=Event Information Sections');
    await infoSections.scrollIntoViewIfNeeded();
    await expect(infoSections).toBeVisible();
  });

  test('shows key dates section', async ({ page }, testInfo) => {
    await login(page, testInfo);
    await page.locator('text=DBAF26').first().click();
    await page.waitForURL('**/events/**');
    await page.locator('text=Configure Event').click();
    await page.waitForURL('**/configure');

    const keyDates = page.locator('text=Key Dates');
    await keyDates.scrollIntoViewIfNeeded();
    await expect(keyDates).toBeVisible();
  });

  test('shows fees section', async ({ page }, testInfo) => {
    await login(page, testInfo);
    await page.locator('text=DBAF26').first().click();
    await page.waitForURL('**/events/**');
    await page.locator('text=Configure Event').click();
    await page.waitForURL('**/configure');

    const fees = page.locator('text=Application & Event Fees');
    await fees.scrollIntoViewIfNeeded();
    await expect(fees).toBeVisible();
  });

  test('shows media categories', async ({ page }, testInfo) => {
    await login(page, testInfo);
    await page.locator('text=DBAF26').first().click();
    await page.waitForURL('**/events/**');
    await page.locator('text=Configure Event').click();
    await page.waitForURL('**/configure');

    await expect(page.locator('text=Media Categories')).toBeVisible();
    await expect(page.locator('text=Painting')).toBeVisible();
    await expect(page.locator('text=Jewelry')).toBeVisible();
  });

  test('can save with Cmd+S', async ({ page }, testInfo) => {
    await login(page, testInfo);
    await page.locator('text=DBAF26').first().click();
    await page.waitForURL('**/events/**');
    await page.locator('text=Configure Event').click();
    await page.waitForURL('**/configure');

    // Trigger save
    await page.keyboard.press('Meta+s');

    // Should show Saved! button
    await expect(page.locator('text=Saved!')).toBeVisible({ timeout: 5000 });
  });
});
