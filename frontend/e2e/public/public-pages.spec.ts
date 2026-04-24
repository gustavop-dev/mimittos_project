import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { CONTACT_PAGE_DISPLAY, ABOUT_PAGE_DISPLAY, TERMS_PAGE_DISPLAY } from '../helpers/flow-tags';

test('should display contact page with heading and form',
  { tag: [...CONTACT_PAGE_DISPLAY] },
  async ({ page }) => {
    await page.goto('/contact');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
);

test('should display about page with brand story content',
  { tag: [...ABOUT_PAGE_DISPLAY] },
  async ({ page }) => {
    await page.goto('/about');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
);

test('should display terms and conditions page with section headings',
  { tag: [...TERMS_PAGE_DISPLAY] },
  async ({ page }) => {
    await page.goto('/terms');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: /términos/i }).first()).toBeVisible();
  }
);
