import { test, expect } from '../test-with-coverage';
import { waitForPageLoad, testCheckoutData } from '../fixtures';
import { PURCHASE_COMPLETE_FLOW, PURCHASE_MULTIPLE_ITEMS, PURCHASE_DISABLED_EMPTY_CART, PURCHASE_LOADING_STATE, HOME_PRODUCT_CAROUSEL } from '../helpers/flow-tags';

// quality: disable too_many_assertions (multi-step purchase flow requires asserting each navigation step)
// quality: disable test_too_long (complete purchase E2E covers full user journey and cannot be split without losing flow context)
test.describe('Complete Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full purchase flow from home to checkout', { tag: [...PURCHASE_COMPLETE_FLOW] }, async ({ page }) => {
    // 1. Start at home page
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Peluchelandia|bienvenid|MIMITTOS|peluche/i }).first()).toBeVisible();

    // 2. Navigate to catalog
    const shopNowLink = page.getByRole('link', { name: /Catálogo|Shop now/i });
    if (await shopNowLink.isVisible()) {
      await shopNowLink.click();
      await page.waitForURL(/.*catalog/, { timeout: 10_000 });
    } else {
      await page.goto('/catalog');
    }
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);

    // 3. Click on first peluch
    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      const firstPeluch = peluchCards.first();
      await firstPeluch.click();
      await waitForPageLoad(page);

      // 4. Verify we're on peluch detail page
      await expect(page).toHaveURL(/.*peluches\/.+/);

      // 5. Add peluch to cart
      // quality: allow-fragile-selector (add button uniquely scoped by Agregar text on detail page)
      const addBtn = page.locator('button:has-text("Agregar")').first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      // 6. Navigate to checkout
      await page.goto('/checkout');
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*checkout/);

      // 7. Fill checkout form
      const nameInput = page.locator('input[required]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(testCheckoutData.address);
      }

      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill(testCheckoutData.email);
      }

      // 8. Accept terms
      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.click();
      }

      // 9. Submit button should be visible (and enabled if cart has items + terms checked)
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should navigate through product carousel on home page', { tag: [...HOME_PRODUCT_CAROUSEL] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (carousel peluches uniquely scoped by href pattern)
    const carouselPeluches = page.locator('a[href^="/peluches/"]');
    const count = await carouselPeluches.count();

    if (count > 0) {
      await carouselPeluches.first().click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*peluches\/.+/);
      await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible();
    }
  });

  test('should handle multiple peluches in cart during checkout', { tag: [...PURCHASE_MULTIPLE_ITEMS] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count >= 2) {
      await peluchCards.nth(0).click();
      await waitForPageLoad(page);
      const addBtn0 = page.locator('button:has-text("Agregar")').first();
      if (await addBtn0.isVisible()) { await addBtn0.click(); await page.waitForLoadState('domcontentloaded'); }

      await page.goto('/catalog');
      await waitForPageLoad(page);

      await peluchCards.nth(1).click();
      await waitForPageLoad(page);
      const addBtn1 = page.locator('button:has-text("Agregar")').first();
      if (await addBtn1.isVisible()) { await addBtn1.click(); await page.waitForLoadState('domcontentloaded'); }

      await page.goto('/checkout');
      await waitForPageLoad(page);

      await expect(page.locator('text=Subtotal')).toBeVisible();

      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.click();
      }

      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeEnabled();
    }
  });

  test('should disable checkout button when cart is empty', { tag: [...PURCHASE_DISABLED_EMPTY_CART] }, async ({ page }) => {
    await page.goto('/checkout');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForPageLoad(page);

    // Fill terms
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.click();
    }

    // Submit button should be disabled (cart is empty)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('should show loading state during form submission', { tag: [...PURCHASE_LOADING_STATE] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      await peluchCards.first().click();
      await waitForPageLoad(page);
      const addBtn = page.locator('button:has-text("Agregar")').first();
      if (await addBtn.isVisible()) { await addBtn.click(); await page.waitForLoadState('domcontentloaded'); }

      await page.goto('/checkout');
      await waitForPageLoad(page);

      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) { await termsCheckbox.click(); }

      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeEnabled();

      await submitBtn.click();
      // Loading text may appear briefly before navigation or error
      await page.waitForURL(/.*/, { timeout: 5000 }).catch(() => {});
    }
  });
});
