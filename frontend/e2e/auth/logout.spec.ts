import { test, expect } from '../test-with-coverage';
import type { Route } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import { AUTH_LOGOUT } from '../helpers/flow-tags';

/**
 * Flow: auth-logout — an authenticated customer clicks "Cerrar sesión" in the
 * /orders sidebar. `authStore.signOut()` (lib/stores/authStore.ts:90-93) clears
 * the token cookies, resets the store and sends the browser to `/`.
 *
 * The session is seeded with `context.addCookies` rather than the
 * `addInitScript` trick used elsewhere in this suite ON PURPOSE: an init script
 * re-runs on EVERY navigation, so it would re-write the very cookies this test
 * asserts were deleted, right after the post-logout redirect.
 */

const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer',
  is_staff: false,
};

test.describe('Logout', () => {
  test('signing out clears the auth cookies and returns home', { tag: [...AUTH_LOGOUT, '@outcome:success'] }, async ({ page, baseURL }) => {
    await page.context().addCookies([
      { name: 'access_token', value: 'mock-access-token', url: baseURL! },
      { name: 'refresh_token', value: 'mock-refresh-token', url: baseURL! },
    ]);
    await page.route('**/api/validate_token/', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: mockUser }) })
    );
    await page.route('**/api/orders/my/', (route: Route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/orders');
    await waitForPageLoad(page);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    // The session is over: back on the public home, with both tokens gone.
    // Asserting the cookies (not just the URL) is the point — a signOut that
    // redirected without clearing them would leave the session recoverable.
    await expect(page).toHaveURL(/\/$/);
    const names = (await page.context().cookies()).map((c) => c.name);
    expect(names).not.toContain('access_token');
    expect(names).not.toContain('refresh_token');
  });
});
