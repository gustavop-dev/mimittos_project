import { test, expect } from '../test-with-coverage';
import type { Page, Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_PELUCH_LIST_DRAFT_BADGE } from '../helpers/flow-tags';

/**
 * Flow: backoffice-peluch-list-draft-badge — on /backoffice/peluches any peluch
 * with `is_active: false` is shown with a "Borrador" chip next to its title
 * (`app/backoffice/peluches/page.tsx:208-212`).
 *
 * That chip is the only thing separating a half-finished draft from a live
 * product in the staff list, so the test asserts BOTH directions: the draft
 * carries it and the published one does not. A one-sided assertion would pass
 * on a list that badged everything.
 *
 * Note on the mock: the list reads `p.title`. The older
 * backoffice-catalog.spec.ts fixture sends `title_es` instead, which renders an
 * empty title — it happens not to assert on titles, so nobody noticed.
 */

const mockAdmin = {
  id: 99,
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_staff: true,
};

const PUBLISHED = {
  id: 1,
  slug: 'osito-publicado',
  title: 'Osito Publicado',
  base_price: 120000,
  category_name: 'Clásicos',
  is_active: true,
  badge: 'none',
};

const DRAFT = {
  id: 2,
  slug: 'osito-borrador',
  title: 'Osito Borrador',
  base_price: 130000,
  category_name: 'Clásicos',
  is_active: false,
  badge: 'none',
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

test.describe('Backoffice — draft peluch badge', () => {
  test('an inactive peluch is badged Borrador and a published one is not', { tag: [...BACKOFFICE_PELUCH_LIST_DRAFT_BADGE, '@outcome:display'] }, async ({ page }) => {
    // quality: allow-no-interaction (flow de clase display: lo que se verifica ES el render del badge en la lista, no una acción)
    // quality: allow-deep-link (el backoffice exige sesión de staff; no hay camino de UI pública hacia /backoffice/peluches)
    await setupStaffAuth(page);
    await page.route('**/api/categories/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/api/peluches/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([PUBLISHED, DRAFT]) });
      }
      return route.continue();
    });

    await page.goto('/backoffice/peluches');
    await waitForPageLoad(page);

    const draftRow = page.getByRole('row', { name: new RegExp(DRAFT.title) });
    const publishedRow = page.getByRole('row', { name: new RegExp(PUBLISHED.title) });

    await expect(draftRow).toContainText('Borrador');
    await expect(publishedRow).not.toContainText('Borrador');
  });
});
