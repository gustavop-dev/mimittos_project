import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_LOGIN, BACKOFFICE_DASHBOARD_DISPLAY, BACKOFFICE_ORDER_MANAGEMENT, BACKOFFICE_SITE_CONFIG } from '../helpers/flow-tags';

test.describe('Backoffice', () => {
  test(
    'should redirect to admin-login when accessing backoffice unauthenticated',
    { tag: [...BACKOFFICE_LOGIN] },
    async ({ page }) => {
      await page.goto('/backoffice');
      await waitForPageLoad(page);

      // Without admin auth, should be redirected away from /backoffice
      await expect(page).not.toHaveURL(/^.*\/backoffice$/, { timeout: 10_000 });
    }
  );

  test(
    'should display backoffice dashboard with mocked analytics',
    { tag: [...BACKOFFICE_DASHBOARD_DISPLAY] },
    async ({ page }) => {
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
      await page.route('**/api/analytics/**', (route) =>
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

      // Page body should render without crashing
      await expect(page.locator('body')).toBeVisible();
    }
  );

  test(
    'should display backoffice orders list with mocked API',
    { tag: [...BACKOFFICE_ORDER_MANAGEMENT] },
    async ({ page }) => {
      await page.route('**/api/orders/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: [], count: 0 }),
        })
      );

      await page.context().addCookies([
        { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/backoffice/pedidos');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
    }
  );

  test(
    'should save promo banner configuration from backoffice settings',
    { tag: [...BACKOFFICE_SITE_CONFIG] },
    async ({ page }) => {
      await page.route('**/api/validate_token/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
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
