import { test, expect } from '../test-with-coverage'
import type { Page, Route } from '@playwright/test'
import { waitForPageLoad } from '../fixtures'
import { BACKOFFICE_USER_TOGGLE_ROLE, BACKOFFICE_USER_TOGGLE_ACTIVE } from '../helpers/flow-tags'

const mockAdmin = {
  id: 1,
  email: 'admin@mimittos.co',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_staff: true,
  is_active: true,
}

const mockUsers = [
  {
    id: 5,
    email: 'cliente@example.com',
    first_name: 'Cliente',
    last_name: 'Demo',
    role: 'customer',
    is_staff: false,
    is_active: true,
    date_joined: '2026-01-15T10:00:00Z',
  },
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
  'should send PATCH when staff toggles user role to admin',
  { tag: [...BACKOFFICE_USER_TOGGLE_ROLE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/users\/?(\?.*)?$/, (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUsers) })
      } else {
        route.continue()
      }
    })

    const roleRequest = page.waitForRequest(
      (req) => req.url().includes('/api/users/5/') && req.method() === 'PATCH',
    )
    await page.route('**/api/users/5/**', (route: Route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockUsers[0], role: 'admin', is_staff: true }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/usuarios')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    const row = page.locator('tr').filter({ hasText: 'cliente@example.com' })
    await row.getByRole('button', { name: /Hacer admin/i }).click()

    const sent = await roleRequest
    const body = sent.postDataJSON() as Record<string, unknown>
    expect(body.role).toBe('admin')
  },
)

test(
  'should send PATCH when staff deactivates a user account',
  { tag: [...BACKOFFICE_USER_TOGGLE_ACTIVE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/users\/?(\?.*)?$/, (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUsers) })
      } else {
        route.continue()
      }
    })

    const activeRequest = page.waitForRequest(
      (req) => req.url().includes('/api/users/5/') && req.method() === 'PATCH',
    )
    await page.route('**/api/users/5/**', (route: Route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockUsers[0], is_active: false }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/usuarios')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()

    const row = page.locator('tr').filter({ hasText: 'cliente@example.com' })
    await row.getByRole('button', { name: /Desactivar/i }).click()

    const sent = await activeRequest
    const body = sent.postDataJSON() as Record<string, unknown>
    expect(body.is_active).toBe(false)
  },
)
