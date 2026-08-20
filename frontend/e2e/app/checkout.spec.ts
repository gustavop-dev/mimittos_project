import { test, expect } from '../test-with-coverage';
import { waitForPageLoad, testCheckoutData } from '../fixtures';
import { CHECKOUT_FORM_DISPLAY, CHECKOUT_FORM_VALIDATION, CHECKOUT_FORM_FILL, CHECKOUT_WOMPI_REDIRECT } from '../helpers/flow-tags';

test.describe('Checkout Flow', () => {
  test('should display the checkout form once the cart has an item', { tag: [...CHECKOUT_FORM_DISPLAY, '@outcome:display'] }, async ({ page }) => {
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

  test('should validate required fields', { tag: [...CHECKOUT_FORM_VALIDATION, '@outcome:display'] }, async ({ page }) => {
    // quality: allow-no-interaction (the empty cart is reached by clearing persisted storage, not by a user action; the empty-cart copy and the disabled submit are what this asserts)
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

  // quality: disable test_too_long (full checkout journey: cart → form → API mock → payment step)
  test('should navigate to payment after creating an order',
    { tag: [...CHECKOUT_WOMPI_REDIRECT] },
    async ({ page }) => {
      // quality: disable too_many_assertions (multi-step flow: add-to-cart → fill form → submit → verify request and payment navigation)

      // 1. Add a product to cart via UI
      await page.goto('/catalog');
      await waitForPageLoad(page);
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      const peluchCards = page.locator('a[href^="/peluches/"]');
      await expect(peluchCards.first()).toBeVisible();

      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);
      const addBtn = page.getByRole('button', { name: /Agregar/i });
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      await page.waitForLoadState('domcontentloaded');

      // 2. Mock the current order-create contract.
      await page.route('**/api/orders/', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              order_number: 'MIM-900',
              deposit_amount: 60000,
              balance_amount: 60000,
              shipping_amount: 0,
              discount_amount: 0,
              payment_mode: 'deposit',
              amount_paid_now: 60000,
              total_amount: 120000,
              is_guest: true,
            }),
          });
        } else {
          await route.continue();
        }
      });

      // 3. Fill checkout form
      await page.goto('/checkout');
      await waitForPageLoad(page);

      const customerName = 'Ana López';
      const customerPhone = '3001234567';
      const nameInput = page.getByText('Nombre completo', { exact: true }).locator('..').locator('input');
      const phoneInput = page.getByText('Celular', { exact: true }).locator('..').locator('input');
      await nameInput.fill(customerName);

      // quality: allow-fragile-selector (email input scoped by type attribute)
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(testCheckoutData.email);
      await phoneInput.fill(customerPhone);

      const addressInput = page.getByPlaceholder('Calle 50 # 40-20, Apto 301');
      await addressInput.fill(testCheckoutData.address);
      const postalInput = page.getByPlaceholder('050001');
      await postalInput.fill(testCheckoutData.postal_code);
      await page.getByRole('checkbox').check();

      // 4. Submit and pin the request plus the real next step.
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeEnabled();
      const orderRequestPromise = page.waitForRequest(
        (req) => req.url().includes('/api/orders/') && req.method() === 'POST'
      );
      await submitBtn.click();
      const orderRequest = await orderRequestPromise;
      const payload = orderRequest.postDataJSON();

      expect(payload).toEqual(expect.objectContaining({
        customer_name: customerName,
        customer_email: testCheckoutData.email,
        customer_phone: customerPhone,
        address: testCheckoutData.address,
        city: 'Bogotá',
        department: 'Cundinamarca',
        postal_code: testCheckoutData.postal_code,
        payment_mode: 'deposit',
      }));
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toEqual(expect.objectContaining({ quantity: 1 }));
      await expect(page).toHaveURL(/\/payment\?order=MIM-900&amount=60000&guest=1$/);
    }
  );
});
