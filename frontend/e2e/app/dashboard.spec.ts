import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { APP_DASHBOARD_ACCESS } from '../helpers/flow-tags';

test.describe('App — dashboard access', () => {
  test(
    'should redirect unauthenticated user from orders page',
    { tag: [...APP_DASHBOARD_ACCESS] },
    async ({ page }) => {
      // quality: allow-no-interaction (protected-route guard: an unauthenticated visit is redirected — there is no user action, and the redirect URL is the real assertion)
      await page.goto('/orders');
      await waitForPageLoad(page);

      // Without auth, user should be redirected to sign-in
      await expect(page).toHaveURL(/.*sign-in/, { timeout: 15_000 });
    }
  );
});
