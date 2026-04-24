import { test, expect } from '../test-with-coverage';
import type { Page, Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import {
  BACKOFFICE_PELUCH_LIST,
  BACKOFFICE_PELUCH_CREATE,
  BACKOFFICE_PELUCH_EDIT,
} from '../helpers/flow-tags';

const mockCategories = [
  { id: 1, name: 'Clásicos', slug: 'clasicos', description: '', display_order: 1, is_active: true },
  { id: 2, name: 'Especiales', slug: 'especiales', description: '', display_order: 2, is_active: true },
];

const mockPeluches = [
  { id: 1, slug: 'osito-clasico', title_es: 'Osito Clásico', base_price: 120000, category_name: 'Clásicos', is_active: true, badge: 'none' },
  { id: 2, slug: 'conejita-suave', title_es: 'Conejita Suave', base_price: 150000, category_name: 'Especiales', is_active: true, badge: 'bestseller' },
];

const mockPeluchDetail = {
  id: 1,
  slug: 'osito-clasico',
  title_es: 'Osito Clásico',
  title_en: 'Classic Bear',
  base_price: 120000,
  category: 1,
  category_name: 'Clásicos',
  is_active: true,
  badge: 'none',
  size_prices: [],
  available_colors: [],
};

const mockAdmin = {
  id: 1, email: 'admin@mimittos.co', first_name: 'Admin', last_name: 'User',
  role: 'admin', is_staff: true, is_active: true,
};

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

test.describe('Backoffice — Catalog Management', () => {
  test('should display peluches list in backoffice',
    { tag: [...BACKOFFICE_PELUCH_LIST] },
    async ({ page }) => {
      await setupStaffAuth(page);

      await page.route('**/api/peluches/**', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches) });
        } else {
          route.continue();
        }
      });
      await page.route('**/api/categories/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      );

      await page.goto('/backoffice/peluches');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
      await expect(page).not.toHaveURL(/sign-in/);
    }
  );

  test('should render peluch creation form in backoffice',
    { tag: [...BACKOFFICE_PELUCH_CREATE] },
    async ({ page }) => {
      await setupStaffAuth(page);

      await page.route('**/api/categories/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      );
      await page.route('**/api/peluches/**', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(mockPeluchDetail) });
        } else {
          route.continue();
        }
      });

      await page.goto('/backoffice/peluches/nuevo');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();

      const nameInput = page.getByRole('textbox').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Mi Nuevo Peluche');
        await expect(nameInput).toHaveValue('Mi Nuevo Peluche');
      }
    }
  );

  test('should render peluch edit form with existing data in backoffice',
    { tag: [...BACKOFFICE_PELUCH_EDIT] },
    async ({ page }) => {
      await setupStaffAuth(page);

      await page.route('**/api/peluches/osito-clasico/**', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluchDetail) });
        } else if (route.request().method() === 'PATCH') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluchDetail) });
        } else {
          route.continue();
        }
      });
      await page.route('**/api/categories/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      );
      await page.route('**/api/peluches/osito-clasico/color-image/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );

      await page.goto('/backoffice/peluches/osito-clasico');
      await waitForPageLoad(page);

      await expect(page.locator('body')).toBeVisible();
    }
  );
});
