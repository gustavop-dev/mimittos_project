import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { HOME_LOADS, NAVIGATION_BETWEEN_PAGES, NAVIGATION_HEADER, NAVIGATION_FOOTER } from '../helpers/flow-tags';

test.describe('Navigation', () => {
  test('should navigate to home page', { tag: [...HOME_LOADS] }, async ({ page }) => {
    // quality: allow-no-interaction (home is the app entry point; the hero heading assertion is a real content check)
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Cada abrazo|Peluchelandia|peluche/i }).first()).toBeVisible();
  });

  test('should navigate to blogs page', { tag: [...NAVIGATION_BETWEEN_PAGES] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (the blogs link lives in both header and footer; .first() is the header one)
    await page.locator('a[href="/blogs"]').first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*blogs/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('should navigate to catalog page', { tag: [...NAVIGATION_BETWEEN_PAGES] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (the catalog link lives in both header and footer; .first() is the header one)
    await page.locator('a[href="/catalog"]').first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('should have working header navigation', { tag: [...NAVIGATION_HEADER] }, async ({ page }) => {
    await page.goto('/blogs');
    await waitForPageLoad(page);

    // The header catalog link carries the user from one page to another.
    // quality: allow-fragile-selector (the catalog link lives in both header and footer; .first() is the header one)
    await page.locator('a[href="/catalog"]').first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);
  });

  test('should have working footer', { tag: [...NAVIGATION_FOOTER] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // The footer links navigate to another page.
    await page.locator('footer').getByRole('link', { name: /blog/i }).first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*blogs/);
  });
});
