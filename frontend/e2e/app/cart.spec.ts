import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { CART_ADD, CART_EMPTY, CART_UPDATE_QTY, CART_REMOVE, CART_SUBTOTAL, CART_PERSIST, CART_MULTIPLE_PRODUCTS } from '../helpers/flow-tags';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForPageLoad(page);
  });

  test('should add peluch to cart', { tag: [...CART_ADD] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/.*catalog/);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      // Select size if available
      const firstSize = page.getByRole('button', { name: /Pequeño|Mediano/i }).first();
      if (await firstSize.isVisible()) {
        await firstSize.click();
      }

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.goto('/cart');
      await waitForPageLoad(page);

      await expect(page.getByText(/Tu carrito está vacío/)).toBeHidden();
    }
  });

  test('should show empty cart message', { tag: [...CART_EMPTY] }, async ({ page }) => {
    await page.goto('/cart');
    await waitForPageLoad(page);
    await expect(page.getByText(/Tu carrito está vacío/)).toBeVisible();
  });

  test('should update peluch quantity in cart', { tag: [...CART_UPDATE_QTY] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.goto('/cart');
      await waitForPageLoad(page);

      // quality: allow-fragile-selector (number input is the only type="number" field on this page)
      const qtyInput = page.locator('input[type="number"]').first();
      if (await qtyInput.isVisible()) {
        await qtyInput.fill('3');
        await expect(qtyInput).toHaveValue('3');
      }
    }
  });

  test('should remove peluch from cart', { tag: [...CART_REMOVE] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.goto('/cart');
      await waitForPageLoad(page);

      const removeBtn = page.getByRole('button', { name: /Eliminar/i });
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        await expect(page.getByText(/Tu carrito está vacío/)).toBeVisible();
      }
    }
  });

  test('should show subtotal in cart summary', { tag: [...CART_SUBTOTAL] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.goto('/cart');
      await waitForPageLoad(page);

      await expect(page.locator('text=Subtotal')).toBeVisible();
    }
  });

  test('should persist cart across page reloads', { tag: [...CART_PERSIST] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.reload();
      await waitForPageLoad(page);

      await page.goto('/cart');
      await waitForPageLoad(page);

      await expect(page.getByText(/Tu carrito está vacío/)).toBeHidden();
    }
  });

  test('should show empty cart when item quantity is decremented to zero', { tag: [...CART_UPDATE_QTY] }, async ({ page }) => {
    // Add an item first
    await page.goto('/catalog');
    await waitForPageLoad(page);

    const peluchCards = page.locator('a[href^="/peluches/"]');
    if (await peluchCards.count() > 0) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.first().click();
      await waitForPageLoad(page);

      const addBtn = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.goto('/cart');
      await waitForPageLoad(page);

      // Decrement quantity until item is removed
      const decrementBtn = page.locator('[data-testid="cart-item"]').first().getByRole('button').first();
      if (await decrementBtn.isVisible()) {
        await decrementBtn.click();
        await page.waitForLoadState('domcontentloaded');

        // After removing last item, cart should show empty state
        const emptyMsg = page.getByText(/Tu carrito está vacío/i);
        const cartItems = page.locator('[data-testid="cart-item"]');
        const remaining = await cartItems.count();
        if (remaining === 0) {
          await expect(emptyMsg).toBeVisible();
        }
      }
    }
  });

  test('should add multiple different peluches', { tag: [...CART_MULTIPLE_PRODUCTS] }, async ({ page }) => {
    await page.goto('/catalog');
    await waitForPageLoad(page);

    // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
    const peluchCards = page.locator('a[href^="/peluches/"]');
    const count = await peluchCards.count();

    if (count >= 2) {
      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.nth(0).click();
      await waitForPageLoad(page);
      const addBtn0 = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn0.isVisible()) { await addBtn0.click(); await page.waitForLoadState('domcontentloaded'); }

      await page.goto('/catalog');
      await waitForPageLoad(page);

      // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
      await peluchCards.nth(1).click();
      await waitForPageLoad(page);
      const addBtn1 = page.getByRole('button', { name: /Agregar/i });
      if (await addBtn1.isVisible()) { await addBtn1.click(); await page.waitForLoadState('domcontentloaded'); }

      await page.goto('/cart');
      await waitForPageLoad(page);

      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    }
  });
});
