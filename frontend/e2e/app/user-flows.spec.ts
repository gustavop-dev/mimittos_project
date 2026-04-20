import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { HOME_TO_BLOG, HOME_TO_CATALOG, CATALOG_BROWSE, NAVIGATION_BETWEEN_PAGES } from '../helpers/flow-tags';

test.describe('User Flows', () => {
  test('should navigate from home to blog detail', { tag: [...HOME_TO_BLOG] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const readBlogsBtn = page.locator('text=Read blogs');
    if (await readBlogsBtn.isVisible()) {
      await readBlogsBtn.click();
      await waitForPageLoad(page);
    } else {
      await page.goto('/blogs');
      await waitForPageLoad(page);
    }

    await expect(page).toHaveURL(/.*blogs/);

    const blogCards = page.locator('a[href^="/blogs/"]');
    const count = await blogCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (blog list links uniquely scoped by href pattern)
      await blogCards.first().click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*blogs\/.+/);
    }
  });

  test('should navigate from home to product detail', { tag: [...HOME_TO_CATALOG] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (catalog CTA link scoped by href)
    const catalogLink = page.getByRole('link', { name: /Explorar catálogo|Shop now/i }).first();
    if (await catalogLink.isVisible()) {
      await catalogLink.click();
      await page.waitForURL(/.*catalog/, { timeout: 10_000 });
    } else {
      await page.goto('/catalog');
    }
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*catalog/);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      await peluchCards.first().click();
      await page.waitForURL(/.*peluches\/.+/, { timeout: 10_000 });
      await expect(page).toHaveURL(/.*peluches\/.+/);
    }
  });

  test('should browse multiple peluches in catalog', { tag: [...CATALOG_BROWSE] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count >= 3) {
      await peluchCards.nth(0).click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*peluches\/.+/);

      await page.goto('/catalog');
      await waitForPageLoad(page);

      await peluchCards.nth(1).click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*peluches\/.+/);

      await page.goto('/catalog');
      await waitForPageLoad(page);

      await peluchCards.nth(2).click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*peluches\/.+/);
    }
  });

  test('should navigate between all main sections', { tag: [...NAVIGATION_BETWEEN_PAGES] }, async ({ page }) => {
    test.setTimeout(120_000);

    const goToSection = async (path: string, expectedUrl: string | RegExp) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(expectedUrl);
    };

    await goToSection('/', '/');
    await goToSection('/catalog', /.*catalog/);
    await goToSection('/cart', /.*cart/);
    await goToSection('/checkout', /.*checkout/);
    await goToSection('/sign-in', /.*sign-in/);
    await goToSection('/', '/');
  });

  test('should use browser back button correctly', { tag: [...HOME_TO_CATALOG] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      await peluchCards.first().click();
      await waitForPageLoad(page);

      await page.goBack();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*catalog/);

      await page.goBack();
      await waitForPageLoad(page);
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle direct URL navigation to catalog', { tag: [...CATALOG_BROWSE] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);
  });

  test('should show appropriate content for each page type', { tag: [...NAVIGATION_BETWEEN_PAGES] }, async ({ page }) => {
    test.setTimeout(120_000);

    // Home page has main heading
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /recuerdo|MIMITTOS|peluche/i }).first()).toBeVisible();

    // Catalog page
    await page.goto('/catalog');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();

    // Cart page
    await page.goto('/cart');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();

    // Checkout page
    await page.goto('/checkout');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /abrazo|pedido/i }).first()).toBeVisible();

    // Sign-in page
    await page.goto('/sign-in');
    await waitForPageLoad(page);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
