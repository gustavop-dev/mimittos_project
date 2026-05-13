import { test, expect } from '../test-with-coverage'
import type { Page, Route } from '@playwright/test'
import { waitForPageLoad } from '../fixtures'
import {
  BACKOFFICE_PELUCH_TOGGLE_FEATURED,
  BACKOFFICE_PELUCH_DELETE,
  BACKOFFICE_PELUCH_BULK_CATEGORY,
} from '../helpers/flow-tags'

const mockAdmin = {
  id: 1,
  email: 'admin@mimittos.co',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_staff: true,
  is_active: true,
}

const mockPeluches = [
  {
    id: 1,
    slug: 'osito-clasico',
    title: 'Osito Clásico',
    category_name: 'Clásicos',
    category_slug: 'clasicos',
    is_featured: false,
    discount_pct: 0,
    min_price: 120000,
    badge: 'none',
  },
  {
    id: 2,
    slug: 'conejita-suave',
    title: 'Conejita Suave',
    category_name: 'Especiales',
    category_slug: 'especiales',
    is_featured: false,
    discount_pct: 0,
    min_price: 150000,
    badge: 'bestseller',
  },
]

const mockCategories = [
  { id: 1, name: 'Clásicos', slug: 'clasicos', is_active: true, display_order: 1 },
  { id: 2, name: 'Especiales', slug: 'especiales', is_active: true, display_order: 2 },
]

async function setupStaffAuth(page: Page) {
  await page.context().addCookies([
    { name: 'access_token', value: 'fake-admin-access', domain: 'localhost', path: '/' },
    { name: 'refresh_token', value: 'fake-admin-refresh', domain: 'localhost', path: '/' },
  ])
  await page.route('**/api/validate_token/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockAdmin }) }),
  )
  await page.route('**/api/token/refresh/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: 'fake-admin-access' }) }),
  )
}

test(
  'should send PATCH when staff toggles peluch featured flag',
  { tag: [...BACKOFFICE_PELUCH_TOGGLE_FEATURED] },
  async ({ page }) => {
    await setupStaffAuth(page)

    // Generic GET handler (registered first = lower priority)
    await page.route('**/api/peluches/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches) })
      } else {
        route.continue()
      }
    })
    await page.route('**/api/categories/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) }),
    )

    // Specific PATCH handler (registered last = higher priority)
    const featuredRequest = page.waitForRequest(
      (req) => req.url().includes('/api/peluches/osito-clasico/') && req.method() === 'PATCH',
    )
    await page.route('**/api/peluches/osito-clasico/**', (route: Route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockPeluches[0], is_featured: true }),
        })
      } else if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches[0]) })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/peluches')
    await waitForPageLoad(page)

    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByText('Osito Clásico')).toBeVisible()

    const row = page.locator('tr').filter({ hasText: 'Osito Clásico' })
    // Star button uses title="Destacar" with ☆ as text content; accessible name comes from title
    await row.getByTitle(/Destacar/i).click()

    await featuredRequest
  },
)

test(
  'should send DELETE when staff removes a peluch after confirmation',
  { tag: [...BACKOFFICE_PELUCH_DELETE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route('**/api/peluches/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches) })
      } else {
        route.continue()
      }
    })
    await page.route('**/api/categories/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) }),
    )

    const deleteRequest = page.waitForRequest(
      (req) => req.url().includes('/api/peluches/osito-clasico/') && req.method() === 'DELETE',
    )
    await page.route('**/api/peluches/osito-clasico/**', (route: Route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 })
      } else if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches[0]) })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/peluches')
    await waitForPageLoad(page)

    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByText('Osito Clásico')).toBeVisible()

    const row = page.locator('tr').filter({ hasText: 'Osito Clásico' })
    await row.getByRole('button', { name: 'Eliminar' }).click()

    // Confirm dialog shows "Sí" / "No" buttons inline in the row
    await expect(page.getByRole('button', { name: 'Sí' }).first()).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: 'Sí' }).first().click()

    await deleteRequest
  },
)

test(
  'should send PATCH to bulk-category when staff assigns category to selected peluches',
  { tag: [...BACKOFFICE_PELUCH_BULK_CATEGORY] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route('**/api/peluches/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPeluches) })
      } else {
        route.continue()
      }
    })
    await page.route('**/api/categories/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) }),
    )

    const bulkRequest = page.waitForRequest(
      (req) => req.url().includes('/api/peluches/bulk-category/') && req.method() === 'PATCH',
    )
    await page.route('**/api/peluches/bulk-category/**', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ updated: 1 }) }),
    )

    await page.goto('/backoffice/peluches')
    await waitForPageLoad(page)

    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByText('Osito Clásico')).toBeVisible()

    // Check the row checkbox to trigger the bulk action bar
    const row = page.locator('tr').filter({ hasText: 'Osito Clásico' })
    await row.locator('input[type="checkbox"]').check()

    // Bulk action bar appears with a category select and Asignar button
    await expect(page.getByRole('button', { name: 'Asignar' })).toBeVisible({ timeout: 5_000 })
    await page.locator('select').filter({ hasText: /Asignar categoría/i }).selectOption({ label: 'Especiales' })
    await page.getByRole('button', { name: 'Asignar' }).click()

    await bulkRequest
  },
)
