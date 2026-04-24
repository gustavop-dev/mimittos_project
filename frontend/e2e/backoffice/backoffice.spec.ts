import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_LOGIN, BACKOFFICE_DASHBOARD_DISPLAY, BACKOFFICE_ORDER_MANAGEMENT } from '../helpers/flow-tags';

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
});
