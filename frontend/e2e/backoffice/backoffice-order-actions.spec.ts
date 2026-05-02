import { test, expect } from '../test-with-coverage';
import type { Page, Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { BACKOFFICE_ORDER_STATUS_UPDATE, BACKOFFICE_ORDER_TRACKING_UPDATE } from '../helpers/flow-tags';

const adminUser = {
  id: 99,
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'Test',
  role: 'admin',
  is_staff: true,
};

const ORDER_NUMBER = 'PELUCH-7777-DDDD';

const ordersList = [
  {
    order_number: ORDER_NUMBER,
    status: 'payment_confirmed',
    total_amount: 200000,
    deposit_amount: 100000,
    balance_amount: 100000,
    city: 'Bogotá',
    department: 'Cundinamarca',
    customer_name: 'Cliente Demo',
    customer_email: 'cliente@example.com',
    created_at: '2026-04-25T10:00:00Z',
    items: [],
  },
];

async function setupAdminMocks(page: Page) {
  await page.context().addCookies([
    { name: 'access_token', value: 'mock-admin-access', domain: 'localhost', path: '/' },
    { name: 'refresh_token', value: 'mock-admin-refresh', domain: 'localhost', path: '/' },
  ]);
  await page.route('**/api/validate_token/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: adminUser }) }),
  );
  await page.route('**/api/token/refresh/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'mock-admin-access' }) }),
  );
  await page.route(/\/api\/orders\/list\/?(\?.*)?$/, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ordersList) }),
  );
}

test(
  'should send PATCH /status when staff changes order status select',
  { tag: [...BACKOFFICE_ORDER_STATUS_UPDATE] },
  async ({ page }) => {
    await setupAdminMocks(page);

    const statusRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/orders/${ORDER_NUMBER}/status/`) && req.method() === 'PATCH',
    );

    await page.route(`**/api/orders/${ORDER_NUMBER}/status/`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );

    await page.goto('/backoffice/pedidos');
    await waitForPageLoad(page);

    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();

    const row = page.locator('tr').filter({ hasText: ORDER_NUMBER });
    await row.locator('select').selectOption('in_production');

    const sent = await statusRequest;
    const body = sent.postDataJSON() as Record<string, unknown>;
    expect(body.status).toBe('in_production');
  },
);

test(
  'should send PATCH /tracking when staff submits a tracking number',
  { tag: [...BACKOFFICE_ORDER_TRACKING_UPDATE] },
  async ({ page }) => {
    await setupAdminMocks(page);

    const trackingRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/orders/${ORDER_NUMBER}/tracking/`) && req.method() === 'PATCH',
    );

    await page.route(`**/api/orders/${ORDER_NUMBER}/tracking/`, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );

    await page.goto('/backoffice/pedidos');
    await waitForPageLoad(page);

    await expect(page.getByText(ORDER_NUMBER)).toBeVisible();

    const row = page.locator('tr').filter({ hasText: ORDER_NUMBER });
    await row.getByPlaceholder('Guía...').fill('SERVI-9988');
    await row.getByRole('button', { name: '✓' }).click();

    const sent = await trackingRequest;
    const body = sent.postDataJSON() as Record<string, unknown>;
    expect(body.tracking_number).toBe('SERVI-9988');
  },
);
