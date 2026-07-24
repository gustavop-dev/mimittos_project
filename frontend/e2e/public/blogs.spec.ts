import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { BLOG_LIST_VIEW, BLOG_DETAIL_VIEW, BLOG_DETAIL_BACK } from '../helpers/flow-tags';

// The E2E backend is seeded with blog posts (see ci.yml "Seed E2E test data"),
// so these tests assert real data instead of guarding on an empty list.
test.describe('Blog Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs');
    await waitForPageLoad(page);
  });

  test('should display blogs list page', { tag: [...BLOG_LIST_VIEW] }, async ({ page }) => {
    // quality: allow-no-interaction (list-view is a display-class flow; it asserts the seeded blog cards render)
    await expect(page).toHaveURL(/.*blogs/);

    // quality: allow-fragile-selector (blog list links uniquely scoped by href pattern)
    await expect(page.locator('a[href^="/blogs/"]').first()).toBeVisible();
  });

  test('should navigate to a blog detail and show its content', { tag: [...BLOG_DETAIL_VIEW] }, async ({ page }) => {
    // quality: allow-fragile-selector (blog list links uniquely scoped by href pattern)
    await page.locator('a[href^="/blogs/"]').first().click();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*blogs\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should navigate back to blogs list from detail', { tag: [...BLOG_DETAIL_BACK] }, async ({ page }) => {
    // quality: allow-fragile-selector (blog list links uniquely scoped by href pattern)
    await page.locator('a[href^="/blogs/"]').first().click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*blogs\/\d+/);

    await page.goBack();
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*blogs$/);
  });
});
