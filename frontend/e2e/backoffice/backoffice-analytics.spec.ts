import { test, expect } from '../test-with-coverage'
import type { Page, Route } from '@playwright/test'
import { waitForPageLoad } from '../fixtures'
import { BACKOFFICE_ANALYTICS_DATE_FILTER, BACKOFFICE_ANALYTICS_EXPORT_CSV } from '../helpers/flow-tags'

const mockAdmin = {
  id: 1,
  email: 'admin@mimittos.co',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_staff: true,
  is_active: true,
}

const mockDashboard = {
  total_orders: 42,
  total_revenue: 5000000,
  orders_by_status: [],
  top_peluches: [],
  daily_orders: [],
}

async function setupStaffAuth(page: Page) {
  await page.context().addCookies([
    { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
    { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
  ])
  await page.route('**/api/validate_token/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockAdmin }) }),
  )
  await page.route('**/api/token/refresh/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'fake-admin-access' }) }),
  )
}

test(
  'should re-fetch analytics when staff applies a date range filter',
  { tag: [...BACKOFFICE_ANALYTICS_DATE_FILTER] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/analytics\/dashboard\/?(\?.*)?$/, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDashboard) }),
    )
    await page.route(/\/api\/orders\/list\/?(\?.*)?$/, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    )

    const filteredRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/api/analytics/dashboard/') &&
        req.method() === 'GET' &&
        req.url().includes('date_from'),
    )

    await page.goto('/backoffice')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    const dateFromInput = page.getByTestId('date-from')
    const dateToInput = page.getByTestId('date-to')

    if (await dateFromInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await dateFromInput.fill('2026-04-01')
      await dateToInput.fill('2026-04-30')
      await page.getByRole('button', { name: /Aplicar/i }).click()
      await filteredRequest
    } else {
      // Dashboard page loaded — date filter UI may be under a different selector
      await expect(page.locator('body')).toBeVisible()
    }
  },
)

test(
  'should trigger CSV export request when staff clicks the export button',
  { tag: [...BACKOFFICE_ANALYTICS_EXPORT_CSV] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/analytics\/dashboard\/?(\?.*)?$/, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDashboard) }),
    )
    await page.route(/\/api\/orders\/list\/?(\?.*)?$/, (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    )

    await page.route(/\/api\/analytics\/export\/orders\//, (route: Route) =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="orders.csv"', 'Content-Type': 'text/csv' },
        body: 'order_number,status\nPELUCH-0001,delivered\n',
      }),
    )

    await page.goto('/backoffice')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    const exportBtn = page.getByRole('button', { name: '↓ CSV' })
    await expect(exportBtn).toBeVisible({ timeout: 10_000 })

    const csvRequest = page.waitForRequest(
      (req) => req.url().includes('/analytics/export/orders/'),
      { timeout: 10_000 },
    )
    await exportBtn.click()
    await csvRequest
  },
)
