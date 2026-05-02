import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import {
  CATALOG_FILTER_BY_SIZE,
  CATALOG_FILTER_BY_PRICE,
  CATALOG_FILTER_PERSONALIZATION,
} from '../helpers/flow-tags';

const CATEGORIES = [
  { id: 1, name: 'Osos', slug: 'osos', description: '', display_order: 1, is_active: true, is_featured: true, image_url: null },
];

const SIZES = [
  { id: 1, label: 'Pequeño', slug: 'pequeno', cm: '20cm', sort_order: 1 },
  { id: 2, label: 'Grande', slug: 'grande', cm: '40cm', sort_order: 2 },
];

function makePeluch(overrides: Partial<{
  id: number; title: string; slug: string; min_price: number; has_huella: boolean;
}>) {
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
  makePeluch({ id: 1, title: 'Oso Pequeño', slug: 'oso-pequeno', min_price: 80000, has_huella: false }),
  makePeluch({ id: 2, title: 'Oso Grande', slug: 'oso-grande', min_price: 200000, has_huella: true }),
  makePeluch({ id: 3, title: 'Oso Mediano', slug: 'oso-mediano', min_price: 130000, has_huella: false }),
];

async function mockCatalogWithFilters(page: import('@playwright/test').Page) {
  await page.route('**/api/categories/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) }),
  );
  await page.route('**/api/sizes/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SIZES) }),
  );
  await page.route('**/api/peluches/?**', (route) => {
    const url = new URL(route.request().url());
    const size = url.searchParams.get('size');
    const maxPrice = url.searchParams.get('max_price');
    const hasHuella = url.searchParams.get('has_huella');

    let body = ALL_PELUCHES;
    if (size === 'pequeno') body = body.filter((p) => p.title.includes('Pequeño'));
    if (size === 'grande') body = body.filter((p) => p.title.includes('Grande'));
    if (maxPrice) body = body.filter((p) => p.min_price <= Number(maxPrice));
    if (hasHuella === 'true') body = body.filter((p) => p.has_huella);

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test(
  'should narrow product list when a size pill is selected',
  { tag: [...CATALOG_FILTER_BY_SIZE] },
  async ({ page }) => {
    await mockCatalogWithFilters(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    await expect(page.getByRole('link', { name: /Oso Pequeño/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Grande/i })).toBeVisible();

    const sizeRequest = page.waitForResponse(
      (resp) => resp.url().includes('/api/peluches/') && resp.url().includes('size=pequeno'),
    );

    await page.locator('span').filter({ hasText: /^Pequeño · 20cm$/ }).click();

    await sizeRequest;

    await expect(page.getByRole('link', { name: /Oso Pequeño/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Grande/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Oso Mediano/i })).toHaveCount(0);
  },
);

test(
  'should narrow product list when max-price slider drops below the highest price',
  { tag: [...CATALOG_FILTER_BY_PRICE] },
  async ({ page }) => {
    await mockCatalogWithFilters(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    await expect(page.getByRole('link', { name: /Oso Grande/i })).toBeVisible();

    const priceRequest = page.waitForResponse(
      (resp) => resp.url().includes('/api/peluches/') && resp.url().includes('max_price='),
    );

    const slider = page.locator('input[type="range"]');
    await slider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, '100000');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await priceRequest;

    await expect(page.getByRole('link', { name: /Oso Pequeño/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Grande/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Oso Mediano/i })).toHaveCount(0);
  },
);

test(
  'should narrow product list to peluches with huella when filter is enabled',
  { tag: [...CATALOG_FILTER_PERSONALIZATION] },
  async ({ page }) => {
    await mockCatalogWithFilters(page);

    await page.goto('/catalog');
    await waitForPageLoad(page);

    await expect(page.getByRole('link', { name: /Oso Pequeño/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Grande/i })).toBeVisible();

    const huellaRequest = page.waitForResponse(
      (resp) => resp.url().includes('/api/peluches/') && resp.url().includes('has_huella=true'),
    );

    await page.locator('label').filter({ hasText: /Solo con huella/ }).click();

    await huellaRequest;

    await expect(page.getByRole('link', { name: /Oso Grande/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Oso Pequeño/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Oso Mediano/i })).toHaveCount(0);
  },
);
