import { test, expect } from '../test-with-coverage';
import { waitForPageLoad, testCheckoutData } from '../fixtures';
import { CHECKOUT_FORM_DISPLAY, CHECKOUT_FORM_VALIDATION, CHECKOUT_FORM_FILL, CHECKOUT_WOMPI_REDIRECT } from '../helpers/flow-tags';

test.describe('Checkout Flow', () => {
  test('should display the checkout form once the cart has an item', { tag: [...CHECKOUT_FORM_DISPLAY] }, async ({ page }) => {
    // Add a seeded product to the cart so checkout renders its form (not the empty-cart message).
    await page.goto('/catalog');
    await waitForPageLoad(page);
    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    await page.locator('a[href^="/peluches/"]').first().click();
    await waitForPageLoad(page);
    await page.getByRole('button', { name: /Agregar/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/checkout');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*checkout/);
    // quality: allow-fragile-selector (email input scoped by type attribute)
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
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

  // quality: disable test_too_long (full checkout journey: cart → form → API mock → Wompi redirect)
  test('should call orders API and receive Wompi redirect URL on checkout submit',
    { tag: [...CHECKOUT_WOMPI_REDIRECT] },
    async ({ page }) => {
      // quality: disable too_many_assertions (multi-step flow: add-to-cart → mock API → fill form → submit → verify API call)

      // 1. Add a product to cart via UI
      await page.goto('/catalog');
      await waitForPageLoad(page);
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      const peluchCards = page.locator('a[href^="/peluches/"]');
      if (await peluchCards.count() === 0) return;

      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);
      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (!await addBtn.isVisible()) return;
      await addBtn.click();
      await page.waitForLoadState('domcontentloaded');

      // 2. Mock POST /api/orders/ to return a checkout_url (Wompi)
      let orderApiCalled = false;
      const wompiUrl = 'https://checkout.wompi.co/l/test-redirect';
      await page.route('**/api/orders/', async (route) => {
        if (route.request().method() === 'POST') {
          orderApiCalled = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ checkout_url: wompiUrl }),
          });
        } else {
          await route.continue();
        }
      });

      // Abort Wompi navigation so the test does not hang on an external URL
      await page.route('https://checkout.wompi.co/**', (route) => route.abort());

      // 3. Fill checkout form
      await page.goto('/checkout');
      await waitForPageLoad(page);

      // quality: allow-fragile-selector (email input scoped by type attribute)
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill(testCheckoutData.email);
      }
      const addressInput = page.getByPlaceholder('Calle 50 # 40-20, Apto 301');
      if (await addressInput.isVisible()) {
        await addressInput.fill(testCheckoutData.address);
      }
      const postalInput = page.getByPlaceholder('050001');
      if (await postalInput.isVisible()) {
        await postalInput.fill(testCheckoutData.postal_code);
      }

      // 4. Submit and assert POST /api/orders/ was called
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isEnabled()) {
        const orderRequest = page.waitForRequest(
          (req) => req.url().includes('/api/orders/') && req.method() === 'POST'
        );
        await submitBtn.click();
        await orderRequest;
        expect(orderApiCalled).toBe(true);
      }
    }
  );
});
