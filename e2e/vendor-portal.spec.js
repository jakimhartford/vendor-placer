import { test, expect } from '@playwright/test';

test.describe('Vendor Portal', () => {
  test('loads portal page with event name and info sections', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');
    await expect(page.locator('h1')).toContainText('Halifax Art Festival');
    await expect(page.locator('text=Welcome to the Halifax Art Festival')).toBeVisible();
    await expect(page.locator('text=Event Information')).toBeVisible();
    await expect(page.locator('text=General Information')).toBeVisible();
  });

  test('shows fees section with amounts', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');
    // Use exact match to avoid matching "Bank fees..." text
    await expect(page.getByText('Fees', { exact: true })).toBeVisible();
    await expect(page.getByText('Jury Fee', { exact: true })).toBeVisible();
    await expect(page.getByText('$40', { exact: true })).toBeVisible();
  });

  test('shows key dates', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');
    await expect(page.getByText('Key Dates')).toBeVisible();
    await expect(page.getByText('Application Deadline')).toBeVisible();
    await expect(page.getByText('Payment Due')).toBeVisible();
  });

  test('shows category dropdown with HAF categories', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');
    // Scroll down to the form
    const select = page.locator('select').first();
    await select.scrollIntoViewIfNeeded();
    await expect(select).toBeVisible({ timeout: 5000 });

    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Clay/Ceramics');
    expect(options).toContain('Painting');
    expect(options).toContain('Photography');
    expect(options).toContain('Jewelry');
  });

  test('DBAF portal loads and shows categories', async ({ page }) => {
    await page.goto('/vendor/dbaf26-demo');
    await expect(page.locator('h1')).toContainText('Daytona Beach');

    // Scroll to the form area
    const select = page.locator('select').first();
    await select.scrollIntoViewIfNeeded();
    await expect(select).toBeVisible({ timeout: 5000 });

    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Painting');
    expect(options).toContain('Jewelry');
    expect(options).toContain('Glass Art');
    expect(options).toContain('Edibles');
    expect(options).toContain('Bath & Body Products');
  });

  test('can fill out application form on DBAF', async ({ page }) => {
    await page.goto('/vendor/dbaf26-demo');

    // Scroll to form
    const nameInput = page.locator('input').first();
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.fill('Test Vendor E2E');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('test-e2e@example.com');

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Should show success or error (deadline may have passed)
    await expect(
      page.getByText('Application Submitted').or(page.getByText('Signup deadline has passed'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('portal page is scrollable', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');
    await expect(page.locator('h1')).toContainText('Halifax Art Festival');

    // Should be able to scroll down to the submit button
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeVisible();
  });

  test('info sections are expandable', async ({ page }) => {
    await page.goto('/vendor/haf25-demo');

    // Click on Event Information to expand it
    const eventInfoBtn = page.locator('button:has-text("Event Information")');
    await eventInfoBtn.click();

    // Should show content about the festival
    await expect(page.getByText('Halifax Art Festival', { exact: false }).nth(1)).toBeVisible({ timeout: 3000 });
  });
});
