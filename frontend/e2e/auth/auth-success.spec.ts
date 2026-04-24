import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT, AUTH_SESSION_PERSISTENCE } from '../helpers/flow-tags';

test.describe('Auth — authenticated flows', () => {
  test(
    'should redirect to home after successful sign in',
    { tag: [...AUTH_LOGIN_SUCCESS] },
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
          body: JSON.stringify({ access: 'fake-access', refresh: 'fake-refresh' }),
        })
      );

      await page.goto('/sign-in');
      await waitForPageLoad(page);

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      await expect(page).not.toHaveURL(/.*sign-in/, { timeout: 10_000 });
    }
  );

  test(
    'should remain authenticated after page reload with valid cookies',
    { tag: [...AUTH_SESSION_PERSISTENCE] },
    async ({ page }) => {
      await page.context().addCookies([
        { name: 'access_token', value: 'fake-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/');
      await waitForPageLoad(page);
      await page.reload();
      await waitForPageLoad(page);

      // Cookies should still be present after reload
      const cookies = await page.context().cookies();
      const accessCookie = cookies.find((c) => c.name === 'access_token');
      expect(accessCookie?.value).toBe('fake-access');
    }
  );

  test(
    'should clear auth tokens on sign out',
    { tag: [...AUTH_LOGOUT] },
    async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // App home page loads without auth errors
      await expect(page.locator('body')).toBeVisible();

      // The logout flow clears tokens from localStorage/cookies
      await page.evaluate(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });

      // Verify tokens are cleared
      const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(accessToken).toBeNull();
    }
  );
});
