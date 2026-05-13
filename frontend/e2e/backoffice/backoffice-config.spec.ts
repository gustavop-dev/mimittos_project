import { test, expect } from '../test-with-coverage'
import type { Page, Route } from '@playwright/test'
import { waitForPageLoad } from '../fixtures'
import { BACKOFFICE_PROMO_BANNER_SAVE, BACKOFFICE_HERO_IMAGE_UPLOAD } from '../helpers/flow-tags'

const mockAdmin = {
  id: 1,
  email: 'admin@mimittos.co',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  is_staff: true,
  is_active: true,
}

const mockPromoBanner = {
  is_active: true,
  message: '¡Envío gratis en compras mayores a $200.000!',
  background_color: '#E8563A',
  text_color: '#FFFFFF',
}

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
  'should send PUT when staff saves promo banner configuration',
  { tag: [...BACKOFFICE_PROMO_BANNER_SAVE] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route('**/api/content/promo_banner/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ key: 'promo_banner', content_json: mockPromoBanner }),
        })
      } else {
        route.continue()
      }
    })

    const saveRequest = page.waitForRequest(
      (req) => req.url().includes('/api/content/promo_banner/') && req.method() === 'PUT',
    )
    await page.route('**/api/content/promo_banner/**', (route: Route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ key: 'promo_banner', content_json: { ...mockPromoBanner, message: '¡Nuevo mensaje!' } }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/backoffice/configuracion')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    const messageInput = page.getByRole('textbox').first()
    if (await messageInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await messageInput.fill('¡Nuevo mensaje!')
    }

    await page.getByRole('button', { name: /Guardar cinta|Guardar banner/i }).click()

    await saveRequest
  },
)

// quality: disable test_too_long (hero image upload flow: auth + file selection + upload + preview verification)
test(
  'should send multipart POST when staff uploads a hero image',
  { tag: [...BACKOFFICE_HERO_IMAGE_UPLOAD] },
  async ({ page }) => {
    await setupStaffAuth(page)

    await page.route('**/api/content/promo_banner/**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ key: 'promo_banner', content_json: mockPromoBanner }),
      }),
    )
    await page.route('**/api/content/hero-image/**', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ key: 'hero_image', content_json: { url: 'https://example.com/hero.jpg' } }),
        })
      } else {
        route.continue()
      }
    })

    await page.route('**/api/content/hero-image/upload/**', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://example.com/new-hero.jpg' }),
      }),
    )

    await page.goto('/backoffice/configuracion')
    await waitForPageLoad(page)

    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)

    // File input is hidden (display:none) but Playwright setInputFiles works on hidden inputs
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'hero.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    // After file is selected the upload button becomes enabled
    const uploadBtn = page.getByRole('button', { name: /Subir imagen/i })
    await expect(uploadBtn).toBeEnabled({ timeout: 5_000 })

    const uploadRequest = page.waitForRequest(
      (req) => req.url().includes('/api/content/hero-image/upload/') && req.method() === 'POST',
      { timeout: 10_000 },
    )
    await uploadBtn.click()
    await uploadRequest
  },
)
