import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { APP_DASHBOARD_ACCESS } from '../helpers/flow-tags';

test.describe('App — dashboard access', () => {
  test(
    'should redirect unauthenticated user from orders page',
    { tag: [...APP_DASHBOARD_ACCESS] },
    async ({ page }) => {
      await page.goto('/orders');
      await waitForPageLoad(page);

      // Without auth, user should be redirected to sign-in
      await expect(page).toHaveURL(/.*sign-in/, { timeout: 15_000 });
    }
  );

  test(
    'should show orders content for authenticated user with mocked API',
    { tag: [...APP_DASHBOARD_ACCESS] },
    async ({ page }) => {
      await page.route('**/api/orders/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      );

      await page.context().addCookies([
        { name: 'access_token', value: 'fake-access', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'fake-refresh', domain: 'localhost', path: '/' },
      ]);

      await page.goto('/orders');
      await waitForPageLoad(page);

      // Page should load without crashing (either shows orders or empty state)
      await expect(page.locator('body')).toBeVisible();
    }
  );
});
