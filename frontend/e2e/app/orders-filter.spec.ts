import { test, expect } from '../test-with-coverage';
import type { Page, Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { ORDERS_FILTER_BY_STATUS, ORDERS_SEARCH_BY_NUMBER } from '../helpers/flow-tags';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer',
  is_staff: false,
};

const orders = [
  {
    order_number: 'PELUCH-1111-AAAA',
    status: 'pending_payment',
    total_amount: 100000,
    deposit_amount: 50000,
    balance_amount: 50000,
    city: 'Bogotá',
    department: 'Cundinamarca',
    customer_name: 'Ana Garcia',
    created_at: '2026-04-20T10:00:00Z',
    items: [],
  },
  {
    order_number: 'PELUCH-2222-BBBB',
    status: 'in_production',
    total_amount: 150000,
    deposit_amount: 75000,
    balance_amount: 75000,
    city: 'Medellín',
    department: 'Antioquia',
    customer_name: 'Carlos López',
    created_at: '2026-04-21T10:00:00Z',
    items: [],
  },
  {
    order_number: 'PELUCH-3333-CCCC',
    status: 'delivered',
    total_amount: 200000,
    deposit_amount: 100000,
    balance_amount: 100000,
    city: 'Cali',
    department: 'Valle',
    customer_name: 'Luisa Pérez',
    created_at: '2026-04-22T10:00:00Z',
    items: [],
  },
];

async function setupAuthMocks(page: Page) {
  await page.addInitScript(() => {
    document.cookie = 'access_token=mock-access-token; path=/';
    document.cookie = 'refresh_token=mock-refresh-token; path=/';
  });
  await page.route('**/api/validate_token/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockUser }) }),
  );
  await page.route('**/api/token/refresh/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'mock-access-token' }) }),
  );
  await page.route('**/api/orders/my/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orders) }),
  );
}

test(
  'should narrow visible orders when a status filter button is clicked',
  { tag: [...ORDERS_FILTER_BY_STATUS] },
  async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/orders');
    await waitForPageLoad(page);

    await expect(page.getByText('PELUCH-1111-AAAA')).toBeVisible();
    await expect(page.getByText('PELUCH-2222-BBBB')).toBeVisible();
    await expect(page.getByText('PELUCH-3333-CCCC')).toBeVisible();

    await page.getByRole('button', { name: /En producción/ }).click();

    await expect(page.getByText('PELUCH-2222-BBBB')).toBeVisible();
    await expect(page.getByText('PELUCH-1111-AAAA')).toHaveCount(0);
    await expect(page.getByText('PELUCH-3333-CCCC')).toHaveCount(0);
  },
);

test(
  'should narrow visible orders when typing an order number in the search box',
  { tag: [...ORDERS_SEARCH_BY_NUMBER] },
  async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/orders');
    await waitForPageLoad(page);

    await expect(page.getByText('PELUCH-1111-AAAA')).toBeVisible();
    await expect(page.getByText('PELUCH-2222-BBBB')).toBeVisible();

    await page.getByPlaceholder('Buscar por # pedido...').fill('3333');

    await expect(page.getByText('PELUCH-3333-CCCC')).toBeVisible();
    await expect(page.getByText('PELUCH-1111-AAAA')).toHaveCount(0);
    await expect(page.getByText('PELUCH-2222-BBBB')).toHaveCount(0);
  },
);
