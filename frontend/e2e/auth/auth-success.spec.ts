import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { AUTH_LOGIN_SUCCESS, AUTH_SESSION_PERSISTENCE } from '../helpers/flow-tags';

const mockCustomer = {
  id: 7,
  email: 'test@example.com',
  first_name: 'Ana',
  last_name: 'López',
  role: 'customer',
  is_staff: false,
};

test.describe('Auth — authenticated flows', () => {
  test(
    'should redirect customers to orders after successful sign in',
    { tag: [...AUTH_LOGIN_SUCCESS, '@outcome:success'] },
    async ({ page }) => {
      // Disable captcha by returning no site key
      await page.route('**/api/google-captcha/site-key/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ site_key: null }),
        })
      );
      await page.route('**/api/sign_in/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access: 'fake-access', refresh: 'fake-refresh', user: mockCustomer }),
        })
      );
      await page.route('**/api/validate_token/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, user: mockCustomer }),
        })
      );
      await page.route('**/api/orders/my/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );

      await page.goto('/sign-in');
      await waitForPageLoad(page);

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/\/orders$/, { timeout: 10_000 });
      await expect(page.getByRole('heading', { name: 'Hola, Ana ♡' })).toBeVisible();
    }
  );

  test(
    'should remain authenticated after page reload with valid cookies',
    { tag: [...AUTH_SESSION_PERSISTENCE, '@outcome:display'] },
    async ({ page, baseURL }) => {
      // quality: allow-no-interaction (session restoration is triggered by navigation and reload; authenticated UI is the observable outcome)
      const appUrl = baseURL ?? 'http://localhost:3001';
      await page.context().addCookies([
        { name: 'access_token', value: 'fake-access', url: appUrl, sameSite: 'Lax' },
        { name: 'refresh_token', value: 'fake-refresh', url: appUrl, sameSite: 'Lax' },
      ]);
      await page.route('**/api/validate_token/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, user: mockCustomer }),
        })
      );
      await page.route('**/api/orders/my/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );

      await page.goto('/orders');
      await waitForPageLoad(page);
      await page.reload();
      await waitForPageLoad(page);

      await expect(page.getByRole('heading', { name: 'Hola, Ana ♡' })).toBeVisible();

      const cookies = await page.context().cookies();
      const accessCookie = cookies.find((c) => c.name === 'access_token');
      expect(accessCookie?.value).toBe('fake-access');
    }
  );
});
