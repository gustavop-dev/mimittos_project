import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { HOME_LOADS, NAVIGATION_BETWEEN_PAGES, NAVIGATION_HEADER, NAVIGATION_FOOTER } from '../helpers/flow-tags';

// The header nav (Inicio / Catálogo / Historia / Contacto) and the footer expose
// /catalog, /about and /contact links — there is no /blogs entry in either.
test.describe('Navigation', () => {
  test('should navigate to home page', { tag: [...HOME_LOADS] }, async ({ page }) => {
    // quality: allow-no-interaction (home is the app entry point; the hero heading assertion is a real content check)
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Cada abrazo|Peluchelandia|peluche/i }).first()).toBeVisible();
  });

  test('should have working header navigation', { tag: [...NAVIGATION_HEADER] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // The header "Historia" link opens the about page.
    // quality: allow-fragile-selector (the about link appears in header and footer; .first() is the header one)
    await page.locator('a[href="/about"]').first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*about/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('should have working footer', { tag: [...NAVIGATION_FOOTER] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // The footer "Contacto" link opens the contact page.
    await page.locator('footer').locator('a[href="/contact"]').first().click();

    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*contact/);
  });

  test('should navigate between pages via the header nav', { tag: [...NAVIGATION_BETWEEN_PAGES] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (nav links appear in header and footer; .first() is the header one)
    await page.locator('a[href="/catalog"]').first().click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);

    await page.locator('a[href="/contact"]').first().click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*contact/);
  });
});
