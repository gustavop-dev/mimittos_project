import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_LOGIN, BACKOFFICE_DASHBOARD_DISPLAY, BACKOFFICE_ORDER_MANAGEMENT, BACKOFFICE_SITE_CONFIG } from '../helpers/flow-tags';

const mockStaff = {
  id: 1,
  email: 'admin@test.com',
  first_name: 'Admin',
  last_name: 'Test',
  role: 'admin',
  is_staff: true,
};

const mockOrder = {
  order_number: 'MIM-001',
  customer_name: 'María García',
  customer_email: 'maria@example.com',
  city: 'Bogotá',
  status: 'pending_payment',
  total_amount: 250000,
  deposit_amount: 125000,
  created_at: '2026-04-01T10:00:00Z',
};

test.describe('Backoffice', () => {
  test(
    'should sign staff in to backoffice',
    { tag: [...BACKOFFICE_LOGIN] },
    async ({ page }) => {
      await page.route('**/api/google-captcha/site-key/', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ site_key: null }) })
      );
      await page.route('**/api/sign_in/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: 'fake-admin-access', refresh: 'fake-admin-refresh', user: mockStaff }),
        })
      );
      await page.route('**/api/validate_token/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockStaff }) })
      );
      await page.route('**/api/analytics/kpis/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ new_orders: 5, in_production: 3, pending_dispatch: 1, confirmed_deposits: 2 }),
        })
      );
      await page.route('**/api/analytics/dashboard/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ revenue_by_day: [], orders_by_status: [], top_products: [] }),
        })
      );

      await page.goto('/sign-in');
      await waitForPageLoad(page);
      await page.locator('input[type="email"]').fill(mockStaff.email);
      await page.locator('input[type="password"]').fill('admin-password');
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/backoffice$/, { timeout: 10_000 });
      await expect(page.getByText('Pedidos nuevos hoy')).toBeVisible();
    }
  );

  test(
    'should display backoffice dashboard with mocked analytics',
    { tag: [...BACKOFFICE_DASHBOARD_DISPLAY, '@outcome:display'] },
    async ({ page }) => {
      // quality: allow-no-interaction (admin dashboard display-class flow; the auth guard is satisfied so the app stays on /backoffice)
      await page.route('**/api/validate_token/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockStaff }) })
      );
      await page.route('**/api/analytics/kpis/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            new_orders: 5,
            in_production: 3,
            pending_dispatch: 1,
            confirmed_deposits: 2,
          }),
        })
      );
      await page.route('**/api/analytics/dashboard/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ revenue_by_day: [], orders_by_status: [], top_products: [] }),
        })
      );

      await page.context().addCookies([
        { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/backoffice');
      await waitForPageLoad(page);

      const newOrdersKpi = page.getByText('Pedidos nuevos hoy').locator('..');
      await expect(newOrdersKpi.getByText('5', { exact: true })).toBeVisible();
    }
  );

  test(
    'should display backoffice orders list with mocked API',
    { tag: [...BACKOFFICE_ORDER_MANAGEMENT, '@outcome:display'] },
    async ({ page }) => {
      // quality: allow-no-interaction (admin orders display-class flow; the auth guard is satisfied so the app stays on the orders page)
      await page.route('**/api/validate_token/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockStaff }) })
      );
      await page.route('**/api/orders/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockOrder]),
        })
      );

      await page.context().addCookies([
        { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/backoffice/pedidos');
      await waitForPageLoad(page);

      await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible();
      await expect(page.getByTestId('order-row-MIM-001')).toBeVisible();
    }
  );

  // quality: disable test_too_long (banner config flow: auth + toggle + type message + save + verify success state)
  test(
    'should save promo banner configuration from backoffice settings',
    { tag: [...BACKOFFICE_SITE_CONFIG] },
    async ({ page }) => {
      await page.route('**/api/validate_token/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            user: { id: 1, email: 'admin@test.com', first_name: 'Admin', last_name: 'Test', role: 'admin', is_staff: true },
          }),
        })
      );
      await page.route('**/api/content/promo_banner/', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              key: 'promo_banner',
              content_json: { is_active: false, message: '', bg_color: '#D4848A', text_color: '#fff' },
              updated_at: '2026-05-01T00:00:00Z',
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            key: 'promo_banner',
            content_json: { is_active: true, message: '¡Envío gratis!', bg_color: '#D4848A', text_color: '#fff' },
            updated_at: '2026-05-01T00:00:01Z',
          }),
        });
      });
      await page.route('**/api/content/hero_image/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2,
            key: 'hero_image',
            content_json: { image_url: null },
            updated_at: '2026-05-01T00:00:00Z',
          }),
        })
      );

      await page.context().addCookies([
        { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/backoffice/configuracion');
      await waitForPageLoad(page);

      await page.getByPlaceholder(/Envío gratis/).fill('¡Envío gratis!');
      await page.getByRole('button', { name: /Guardar cinta/i }).click();

      await expect(page.getByRole('button', { name: /Guardado/i })).toBeVisible({ timeout: 10_000 });
    }
  );
});
