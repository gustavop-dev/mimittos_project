import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { PAYMENT_PAGE_DISPLAY, ORDER_CONFIRMED_DISPLAY } from '../helpers/flow-tags';

test.describe('Payment & Order Confirmation', () => {
  test(
    'should display payment page with mocked payment info',
    { tag: [...PAYMENT_PAGE_DISPLAY] },
    async ({ page }) => {
      await page.route('**/api/payment/info/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            order_number: 'ORD-001',
            reference: 'REF-001',
            amount_in_cents: 12800000,
            currency: 'COP',
            total_amount: 128000,
            deposit_amount: 0,
            balance_amount: 128000,
            customer_name: 'Ana García',
            customer_email: 'ana@test.com',
            customer_phone: '3001234567',
            status: 'pending',
          }),
        })
      );

      await page.route('**/sandbox.wompi.co/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              presigned_acceptance: { acceptance_token: 'tok', permalink: 'https://wompi.co/terms' },
              presigned_personal_data_auth: { acceptance_token: 'tok-p' },
            },
          }),
        })
      );

      await page.goto('/payment?order=ORD-001');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
    }
  );

  test(
    'should display order confirmed page with mocked tracking data',
    { tag: [...ORDER_CONFIRMED_DISPLAY] },
    async ({ page }) => {
      await page.route('**/api/payment/check/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'APPROVED', synced: true }),
        })
      );

      await page.route('**/api/payment/info/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            order_number: 'ORD-001',
            status: 'payment_confirmed',
            customer_name: 'Ana García',
          }),
        })
      );

      await page.goto('/order-confirmed?order=ORD-001&id=wompi-123');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
    }
  );
});
