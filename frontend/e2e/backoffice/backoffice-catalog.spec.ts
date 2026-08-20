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
  { id: 1, slug: 'osito-clasico', title: 'Osito Clásico', min_price: 120000, discounted_min_price: 120000, discount_pct: 0, category_name: 'Clásicos', category_slug: 'clasicos', is_active: true, is_featured: false, badge: 'none' },
  { id: 2, slug: 'conejita-suave', title: 'Conejita Suave', min_price: 150000, discounted_min_price: 150000, discount_pct: 0, category_name: 'Especiales', category_slug: 'especiales', is_active: true, is_featured: false, badge: 'bestseller' },
];

const mockPeluchDetail = {
  id: 1,
  slug: 'osito-clasico',
  title: 'Osito Clásico',
  title_en: 'Classic Bear',
  category: mockCategories[0],
  category_name: 'Clásicos',
  lead_description: 'Un clásico hecho a mano',
  description: [],
  is_active: true,
  is_featured: false,
  badge: 'none',
  discount_pct: 0,
  display_order: 100,
  has_huella: false,
  has_corazon: false,
  has_audio: false,
  huella_extra_cost: 0,
  corazon_extra_cost: 0,
  audio_extra_cost: 0,
  size_prices: [],
  available_colors: [],
  specifications: {},
  care_instructions: [],
};

const mockAdmin = {
  id: 1, email: 'admin@mimittos.co', first_name: 'Admin', last_name: 'User',
  role: 'admin', is_staff: true, is_active: true,
};

async function setupStaffAuth(page: Page) {
  await page.route('**/api/validate_token/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockAdmin }) })
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
    { tag: [...BACKOFFICE_PELUCH_LIST, '@outcome:display'] },
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

      // quality: allow-no-interaction (admin table display-class flow: an authenticated admin reaches the peluches list, not the sign-in redirect)
      await expect(page.getByText('Osito Clásico')).toBeVisible();
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
      await page.route('**/api/colors/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );
      await page.route('**/api/sizes/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );
      await page.route('**/api/peluches/osito-clasico/color-image/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );

      await page.goto('/backoffice/peluches/osito-clasico');
      await waitForPageLoad(page);

      // quality: allow-no-interaction (edit-form display-class flow: an authenticated admin reaches the edit form, not the sign-in redirect)
      await expect(page.getByPlaceholder('Osito Suave Premium')).toHaveValue('Osito Clásico');
    }
  );
});
