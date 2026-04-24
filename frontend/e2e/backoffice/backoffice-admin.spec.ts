import { test, expect } from '../test-with-coverage';
import type { Page, Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_CATEGORY_MANAGEMENT, BACKOFFICE_USER_MANAGEMENT } from '../helpers/flow-tags';

const mockCategories = [
  { id: 1, name: 'Clásicos', slug: 'clasicos', description: 'Peluches clásicos', display_order: 1, is_active: true },
  { id: 2, name: 'Especiales', slug: 'especiales', description: 'Ediciones especiales', display_order: 2, is_active: true },
];

const mockAdmin = {
  id: 1, email: 'admin@mimittos.co', first_name: 'Admin', last_name: 'User',
  role: 'admin', is_staff: true, is_active: true,
};

const mockUsers = [
  { id: 1, email: 'ana@mimittos.co', first_name: 'Ana', last_name: 'García', role: 'customer', is_staff: false, is_active: true, date_joined: '2026-01-01T00:00:00Z' },
  { id: 2, email: 'carlos@mimittos.co', first_name: 'Carlos', last_name: 'López', role: 'admin', is_staff: true, is_active: true, date_joined: '2026-02-01T00:00:00Z' },
];

async function setupStaffAuth(page: Page) {
  await page.route('**/api/validate_token/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockAdmin }) })
  );
  await page.route('**/api/token/refresh/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'fake-admin-access' }) })
  );
  await page.context().addCookies([
    { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
    { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
  ]);
}

test.describe('Backoffice — Admin Management', () => {
  test('should display category management page in backoffice',
    { tag: [...BACKOFFICE_CATEGORY_MANAGEMENT] },
    async ({ page }) => {
      await setupStaffAuth(page);

      await page.route('**/api/categories/**', (route: Route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      );

      await page.goto('/backoffice/categorias');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
      await expect(page).not.toHaveURL(/sign-in/);
    }
  );

  test('should display user management page in backoffice',
    { tag: [...BACKOFFICE_USER_MANAGEMENT] },
    async ({ page }) => {
      await setupStaffAuth(page);

      await page.route('**/api/users/**', (route: Route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUsers) })
      );

      await page.goto('/backoffice/usuarios');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
      await expect(page).not.toHaveURL(/sign-in/);
    }
  );
});
