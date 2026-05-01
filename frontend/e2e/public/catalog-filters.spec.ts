import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { CATALOG_FILTER_CATEGORY, CATALOG_SORT_PRODUCTS } from '../helpers/flow-tags';

const CATEGORIES = [
  { id: 1, name: 'Osos', slug: 'osos', description: '', display_order: 1, is_active: true, is_featured: true, image_url: null },
  { id: 2, name: 'Conejos', slug: 'conejos', description: '', display_order: 2, is_active: true, is_featured: false, image_url: null },
];

const SIZES = [
  { id: 1, label: 'Pequeño', slug: 'pequeno', cm: '20cm', sort_order: 1 },
];

function makePeluch(overrides: Partial<{ id: number; title: string; slug: string; category_name: string; category_slug: string; min_price: number }>) {
  return {
    id: 1,
    title: 'Oso Demo',
    slug: 'oso-demo',
    category_name: 'Osos',
    category_slug: 'osos',
    lead_description: '',
    badge: 'none' as const,
    is_featured: false,
    discount_pct: 0,
    display_order: 1,
    min_price: 100000,
    discounted_min_price: null,
    available_colors: [],
    gallery_urls: [],
    color_images_meta: [],
    average_rating: 4.5,
    review_count: 10,
    has_huella: false,
    has_corazon: false,
    has_audio: false,
    ...overrides,
  };
}

const ALL_PELUCHES = [
  makePeluch({ id: 1, title: 'Oso Café', slug: 'oso-cafe', category_slug: 'osos', category_name: 'Osos', min_price: 80000 }),
  makePeluch({ id: 2, title: 'Oso Polar', slug: 'oso-polar', category_slug: 'osos', category_name: 'Osos', min_price: 150000 }),
  makePeluch({ id: 3, title: 'Conejo Blanco', slug: 'conejo-blanco', category_slug: 'conejos', category_name: 'Conejos', min_price: 120000 }),
];

const ONLY_OSOS = ALL_PELUCHES.filter((p) => p.category_slug === 'osos');
const SORTED_PRICE_ASC = [...ALL_PELUCHES].sort((a, b) => (a.min_price ?? 0) - (b.min_price ?? 0));

async function mockCatalog(page: import('@playwright/test').Page) {
  await page.route('**/api/categories/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) })
  );
  await page.route('**/api/sizes/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SIZES) })
  );
  await page.route('**/api/peluches/?**', (route) => {
    const url = new URL(route.request().url());
    const category = url.searchParams.get('category');
    const sort = url.searchParams.get('sort');
    let body = ALL_PELUCHES;
    if (category === 'osos') body = ONLY_OSOS;
    else if (sort === 'price_asc') body = SORTED_PRICE_ASC;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test('should narrow product list when a category filter is selected',
  { tag: [...CATALOG_FILTER_CATEGORY] },
  async ({ page }) => {
    await mockCatalog(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    await expect(page.getByRole('link', { name: /Conejo Blanco/i })).toBeVisible();

    await page.locator('label').filter({ hasText: /^Osos$/ }).click();

    await expect(page.getByRole('link', { name: /Conejo Blanco/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Oso Café/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Polar/i })).toBeVisible();
  }
);

test('should re-order product list when sort dropdown changes to price ascending',
  { tag: [...CATALOG_SORT_PRODUCTS] },
  async ({ page }) => {
    await mockCatalog(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    await expect(page.getByRole('link', { name: /Oso Café/i })).toBeVisible();

    await page.getByRole('combobox').selectOption('price_asc');

    const titles = page.locator('a[href^="/peluches/"] h4');
    await expect(titles.first()).toHaveText(/Oso Café/);
  }
);
