import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { CATALOG_BROWSE, CATALOG_PRODUCT_DETAIL, CATALOG_PRODUCT_GALLERY, CATALOG_BACK_NAVIGATION } from '../helpers/flow-tags';

// The E2E backend is seeded with peluches (see ci.yml "Seed E2E test data"),
// so these tests assert real catalog data instead of guarding on an empty list.
test.describe('Product Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);
  });

  test('should display products catalog page', { tag: [...CATALOG_BROWSE] }, async ({ page }) => {
    // quality: allow-no-interaction (browse is a display-class flow; it asserts the seeded product grid renders)
    await expect(page).toHaveURL(/.*catalog/);

    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    const productCards = page.locator('a[href^="/peluches/"]');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(1);
  });

  test('should show peluch details including price', { tag: [...CATALOG_PRODUCT_DETAIL] }, async ({ page }) => {
    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    await page.locator('a[href^="/peluches/"]').first().click();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*peluches\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Price formatted in COP ($XX.XXX)
    await expect(page.locator('text=/\\$\\d+/').first()).toBeVisible();
  });

  test('should display peluch gallery images', { tag: [...CATALOG_PRODUCT_GALLERY] }, async ({ page }) => {
    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    await page.locator('a[href^="/peluches/"]').first().click();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*peluches\/.+/);
    // Seeded peluches carry a 3-image gallery.
    await expect(page.getByRole('img').first()).toBeVisible();
    expect(await page.getByRole('img').count()).toBeGreaterThan(1);
  });

  test('should navigate back to catalog from detail', { tag: [...CATALOG_BACK_NAVIGATION] }, async ({ page }) => {
    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    await page.locator('a[href^="/peluches/"]').first().click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*peluches\/.+/);

    await page.goBack();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*catalog/);
  });
});
