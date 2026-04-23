import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { ORDERS_LIST_VIEW, TRACKING_BY_ORDER_NUMBER, TRACKING_AUTO_FROM_WOMPI } from '../helpers/flow-tags';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer',
  is_staff: false,
};

const mockOrder = {
  order_number: 'PELUCH-TEST-0001',
  status: 'payment_confirmed',
  total_amount: 150000,
  deposit_amount: 75000,
  balance_amount: 75000,
  city: 'Bogotá',
  department: 'Cundinamarca',
  customer_name: 'Test User',
  created_at: '2026-04-20T10:00:00Z',
  items: [],
};

const mockTracking = {
  order_number: 'PELUCH-TEST-0001',
  status: 'in_production',
  payment_status: 'APPROVED',
  total: 150000,
  customer_name: 'Test User',
  customer_phone: '3001234567',
  address: 'Calle 50 # 40-20',
  city: 'Bogotá',
  department: 'Cundinamarca',
  postal_code: '110111',
  created_at: '2026-04-20T10:00:00Z',
  updated_at: '2026-04-21T10:00:00Z',
  tracking_number: null,
  shipping_carrier: null,
  checkout_url: null,
  items: [],
};

async function setupAuthMocks(page: any) {
  // Set auth cookies via initScript BEFORE React initializes so authStore starts isAuthenticated=true
  await page.addInitScript(() => {
    document.cookie = 'access_token=mock-access-token; path=/';
    document.cookie = 'refresh_token=mock-refresh-token; path=/';
  });
  // Stub all auth-related API calls to avoid hitting the real backend with fake tokens
  await page.route('**/api/validate_token/', (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockUser }) })
  );
  await page.route('**/api/token/refresh/', (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'mock-access-token' }) })
  );
}

test.describe('Orders & Tracking', () => {
  test('should display authenticated user orders list',
    { tag: [...ORDERS_LIST_VIEW] },
    async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/orders/my/', (route: any) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockOrder]),
        })
      );

      await page.goto('/orders');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*orders/);
      await expect(page.getByText('PELUCH-TEST-0001')).toBeVisible();
    }
  );

  test('should show order tracking timeline by order number',
    { tag: [...TRACKING_BY_ORDER_NUMBER] },
    async ({ page }) => {
      await page.route('**/api/orders/track/**', (route: any) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTracking),
        })
      );

      await page.goto('/tracking');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*tracking/);

      const searchInput = page.getByPlaceholder(/PELUCH-/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill('PELUCH-TEST-0001');

      await page.getByRole('button', { name: /Buscar/i }).click();

      await expect(page.getByText('Pedido recibido')).toBeVisible();
    }
  );

  test('should auto-load tracking when order number is in URL',
    { tag: [...TRACKING_AUTO_FROM_WOMPI] },
    async ({ page }) => {
      await page.route('**/api/orders/track/**', (route: any) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTracking),
        })
      );

      await page.goto('/tracking?order=PELUCH-TEST-0001');
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/.*tracking/);

      const searchInput = page.getByPlaceholder(/PELUCH-/i);
      await expect(searchInput).toHaveValue('PELUCH-TEST-0001');

      await expect(page.getByText('Pedido recibido')).toBeVisible();
    }
  );
});
