import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { CATALOG_BROWSE, CATALOG_PRODUCT_DETAIL, CATALOG_PRODUCT_GALLERY, CATALOG_BACK_NAVIGATION } from '../helpers/flow-tags';

test.describe('Product Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);
  });

  test('should display products catalog page', { tag: [...CATALOG_BROWSE] }, async ({ page }) => {
    await expect(page).toHaveURL(/.*catalog/);

    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    const productCards = page.locator('a[href^="/peluches/"]');
    const count = await productCards.count();

    if (count > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should navigate to peluch detail page', { tag: [...CATALOG_PRODUCT_DETAIL] }, async ({ page }) => {
    // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
    const firstProductCard = page.locator('a[href^="/peluches/"]').first();
    const count = await page.locator('a[href^="/peluches/"]').count();

    if (count > 0) {
      await firstProductCard.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*peluches\/.+/);
    }
  });

  test('should show peluch details including price', { tag: [...CATALOG_PRODUCT_DETAIL] }, async ({ page }) => {
    const productCards = page.locator('a[href^="/peluches/"]');
    const count = await productCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
      const firstCard = productCards.first();
      const titleInList = await firstCard.locator('h3, [class*="title"]').first().textContent();

      await firstCard.click();
      await waitForPageLoad(page);

      if (titleInList) {
        await expect(page.locator(`text=${titleInList}`)).toBeVisible();
      }

      // Price formatted in COP ($XX.XXX)
      await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
    }
  });

  test('should display peluch gallery images', { tag: [...CATALOG_PRODUCT_GALLERY] }, async ({ page }) => {
    const productCards = page.locator('a[href^="/peluches/"]');
    const count = await productCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
      await productCards.first().click();
      await waitForPageLoad(page);

      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
    }
  });

  test('should navigate back to catalog from detail', { tag: [...CATALOG_BACK_NAVIGATION] }, async ({ page }) => {
    const productCards = page.locator('a[href^="/peluches/"]');
    const count = await productCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (product list links uniquely scoped by href pattern)
      await productCards.first().click();
      await waitForPageLoad(page);

      await page.goBack();
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*catalog/);
    }
  });
});
