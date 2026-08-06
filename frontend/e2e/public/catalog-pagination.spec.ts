import { test, expect } from '../test-with-coverage';
import type { Page } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { CATALOG_PAGINATION } from '../helpers/flow-tags';

/**
 * Flow: catalog-pagination — with more products than fit one page (16 on
 * desktop, `app/catalog/page.tsx:27-29`), the pagination nav appears and moving
 * to the next page swaps the grid for that page's products.
 *
 * The catalog is reached by clicking through from the home page rather than by
 * `goto('/catalog')`: for a display-class flow the reachability is part of what
 * is being verified, and a deep link would skip it.
 *
 * The viewport is pinned wide on purpose — the page size is chosen from
 * `(min-width: 1024px)`, so a narrower default would silently switch to 12 per
 * page and the page-boundary assertions below would be testing a different
 * split than the one they name.
 */

const CATEGORIES = [
  { id: 1, name: 'Osos', slug: 'osos', description: '', display_order: 1, is_active: true, is_featured: true, image_url: null },
];

const SIZES = [{ id: 1, label: 'Pequeño', slug: 'pequeno', cm: '20cm', sort_order: 1 }];

// 20 products over a 16-per-page desktop grid: page 1 holds 01-16, page 2 the rest.
const TOTAL = 20;
const PAGE_SIZE_DESKTOP = 16;

const PELUCHES = Array.from({ length: TOTAL }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: i + 1,
    title: `Peluche ${n}`,
    slug: `peluche-${n}`,
    category_name: 'Osos',
    category_slug: 'osos',
    lead_description: '',
    badge: 'none' as const,
    is_featured: false,
    discount_pct: 0,
    display_order: i + 1,
    min_price: 100000,
    discounted_min_price: null,
    available_colors: [],
    gallery_urls: [],
    average_rating: 4.5,
    review_count: 10,
    has_huella: false,
    has_corazon: false,
    has_audio: false,
  };
});

const FIRST_ON_PAGE_1 = 'Peluche 01';
const FIRST_ON_PAGE_2 = `Peluche ${String(PAGE_SIZE_DESKTOP + 1).padStart(2, '0')}`; // Peluche 17

async function mockCatalog(page: Page) {
  await page.route('**/api/categories/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) })
  );
  await page.route('**/api/sizes/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SIZES) })
  );
  await page.route('**/api/peluches/?**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PELUCHES) })
  );
}

test.describe('Catalog pagination', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('moving to the next page swaps the grid for that page products', { tag: [...CATALOG_PAGINATION, '@outcome:display'] }, async ({ page }) => {
    await mockCatalog(page);

    await page.goto('/');
    await page.getByRole('link', { name: 'Explorar catálogo' }).click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/catalog/);

    const nav = page.getByRole('navigation', { name: 'Paginación del catálogo' });
    const grid = page.getByRole('main');

    // Page 1 holds the first 16 and must NOT already show page 2's products —
    // without that second assertion an unpaginated grid rendering all 20 would
    // still satisfy the first one.
    await expect(grid).toContainText(FIRST_ON_PAGE_1);
    await expect(grid).not.toContainText(FIRST_ON_PAGE_2);
    await expect(nav.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    await nav.getByRole('button', { name: 'Página siguiente' }).click();

    await expect(grid).toContainText(FIRST_ON_PAGE_2);
    await expect(grid).not.toContainText(FIRST_ON_PAGE_1);
    await expect(nav.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
  });

  test('the previous control is disabled on the first page and enabled after paging forward', { tag: [...CATALOG_PAGINATION, '@outcome:display'] }, async ({ page }) => {
    await mockCatalog(page);

    await page.goto('/');
    await page.getByRole('link', { name: 'Explorar catálogo' }).click();
    await waitForPageLoad(page);

    const nav = page.getByRole('navigation', { name: 'Paginación del catálogo' });
    const prev = nav.getByRole('button', { name: 'Página anterior' });

    // Catches: an always-enabled Anterior on page 1, which walks currentPage to 0
    // and renders an empty grid.
    await expect(prev).toBeDisabled();

    await nav.getByRole('button', { name: 'Página siguiente' }).click();

    await expect(prev).toBeEnabled();
  });
});
