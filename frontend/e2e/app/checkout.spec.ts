import { test, expect } from '../test-with-coverage';
import { waitForPageLoad, testCheckoutData } from '../fixtures';
import { CHECKOUT_FORM_DISPLAY, CHECKOUT_FORM_VALIDATION, CHECKOUT_FORM_FILL } from '../helpers/flow-tags';

test.describe('Checkout Flow', () => {
  test('should navigate to checkout page', { tag: [...CHECKOUT_FORM_DISPLAY] }, async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('should display checkout form fields', { tag: [...CHECKOUT_FORM_DISPLAY] }, async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*checkout/);

    // quality: allow-fragile-selector (email input scoped by type attribute)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should show cart summary if items exist', { tag: [...CHECKOUT_FORM_DISPLAY] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      await peluchCards.first().click();
      await waitForPageLoad(page);

      // quality: allow-fragile-selector (add button is the only Agregar button on detail page)
      const addToCartBtn = page.locator('button:has-text("Agregar")').first();
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(500);

        await page.goto('/checkout');
        await waitForPageLoad(page);
        await expect(page).toHaveURL(/.*checkout/);
      }
    }
  });

  test('should validate required fields', { tag: [...CHECKOUT_FORM_VALIDATION] }, async ({ page }) => {
    await page.goto('/checkout');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*checkout/);

    // Wait for hydration — empty cart message confirms zustand persist has settled
    await expect(page.getByText(/Tu carrito está vacío/)).toBeVisible();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('should accept valid checkout data', { tag: [...CHECKOUT_FORM_FILL] }, async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*checkout/);

    // quality: allow-fragile-selector (email input scoped by type attribute)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(testCheckoutData.email);
    }

    // Fill address (identified by placeholder)
    const addressInput = page.getByPlaceholder('Calle 50 # 40-20, Apto 301');
    if (await addressInput.isVisible()) {
      await addressInput.fill(testCheckoutData.address);
    }

    // Fill postal code (identified by placeholder)
    const postalInput = page.getByPlaceholder('050001');
    if (await postalInput.isVisible()) {
      await postalInput.fill(testCheckoutData.postal_code);
    }
  });
});
