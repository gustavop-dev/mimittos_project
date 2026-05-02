import { test, expect } from '../test-with-coverage'
import type { Page, Route } from '@playwright/test'
import { waitForPageLoad } from '../fixtures'
import {
  BACKOFFICE_CATEGORY_CREATE,
  BACKOFFICE_CATEGORY_EDIT,
  BACKOFFICE_CATEGORY_DELETE,
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

const mockCategories = [
  {
    id: 1,
    name: 'Clásicos',
    slug: 'clasicos',
    description: 'Peluches clásicos',
    display_order: 1,
    is_active: true,
    is_featured: false,
  },
]

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
  'should send POST when staff creates a new category',
  { tag: [...BACKOFFICE_CATEGORY_CREATE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/categories\/$/, (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      } else {
        route.continue()
      }
    })

    const createRequest = page.waitForRequest(
      (req) => req.url().includes('/api/categories/') && req.method() === 'POST',
    )
    await page.route(/\/api\/categories\/$/, (route: Route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 2, name: 'Nueva Categoría', slug: 'nueva-categoria' }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/categorias')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    await page.getByRole('button', { name: /Nueva categoría/i }).click()

    const nameInput = page.getByRole('textbox').first()
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('Nueva Categoría')

    await page.getByRole('button', { name: /Guardar|Crear|Confirmar/i }).last().click()

    await createRequest
  },
)

test(
  'should send PATCH when staff edits an existing category',
  { tag: [...BACKOFFICE_CATEGORY_EDIT] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/categories\/?(\?.*)?$/, (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      } else {
        route.continue()
      }
    })

    const editRequest = page.waitForRequest(
      (req) => req.url().includes('/api/categories/1/') && req.method() === 'PATCH',
    )
    await page.route('**/api/categories/1/**', (route: Route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockCategories[0], name: 'Clásicos Editado' }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/categorias')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()

    const row = page.locator('tr').filter({ hasText: 'Clásicos' })
    await row.getByRole('button', { name: /Editar/i }).click()

    const nameInput = page.getByRole('textbox').first()
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('Clásicos Editado')

    await page.getByRole('button', { name: /Guardar|Actualizar|Confirmar/i }).last().click()

    await editRequest
  },
)

test(
  'should send DELETE when staff removes a category after confirmation',
  { tag: [...BACKOFFICE_CATEGORY_DELETE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route(/\/api\/categories\/?(\?.*)?$/, (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCategories) })
      } else {
        route.continue()
      }
    })

    const deleteRequest = page.waitForRequest(
      (req) => req.url().includes('/api/categories/1/') && req.method() === 'DELETE',
    )
    await page.route('**/api/categories/1/**', (route: Route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/categorias')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()

    const row = page.locator('tr').filter({ hasText: 'Clásicos' })
    await row.getByRole('button', { name: /Eliminar/i }).click()

    const confirmBtn = page.getByRole('button', { name: /Confirmar|Sí|eliminar/i }).last()
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    await deleteRequest
  },
)
