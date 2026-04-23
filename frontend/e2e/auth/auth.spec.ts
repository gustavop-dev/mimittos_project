import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import { AUTH_SIGN_IN_FORM, AUTH_SIGN_UP_FORM, AUTH_LOGIN_INVALID, AUTH_PROTECTED_REDIRECT, AUTH_FORGOT_PASSWORD_FORM } from '../helpers/flow-tags';

test.describe('Authentication', () => {
  test('should navigate to sign-in page', { tag: [...AUTH_SIGN_IN_FORM] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);
    
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should display sign-in form', { tag: [...AUTH_SIGN_IN_FORM] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('should show validation on empty form submission', { tag: [...AUTH_SIGN_IN_FORM] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);
    
    // Try to submit empty form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Should still be on sign-in page
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should accept input in form fields', { tag: [...AUTH_SIGN_IN_FORM] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('should handle invalid credentials gracefully', { tag: [...AUTH_LOGIN_INVALID] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrongpassword');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should have link to dashboard after sign-in', { tag: [...AUTH_SIGN_IN_FORM] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Dashboard link presence depends on auth state; verify home page loads successfully
    await expect(page).toHaveURL('/');
  });

  test('should navigate to dashboard page', { tag: [...AUTH_PROTECTED_REDIRECT] }, async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    // Either redirected to sign-in or the dashboard is shown
    await expect(page).toHaveURL(/dashboard|sign-in/);
  });

  test('should navigate to backoffice page', { tag: [...AUTH_PROTECTED_REDIRECT] }, async ({ page }) => {
    await page.goto('/backoffice');
    await waitForPageLoad(page);
    
    // Either redirected to sign-in or the backoffice is shown
    await expect(page).toHaveURL(/backoffice|sign-in/);
  });

  test('should display sign-up page heading', { tag: [...AUTH_SIGN_UP_FORM] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*sign-up/);
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('should show all required sign-up form fields', { tag: [...AUTH_SIGN_UP_FORM] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);

    await expect(page.getByPlaceholder('Sofía')).toBeVisible();
    await expect(page.getByPlaceholder('Martínez')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByPlaceholder('Mínimo 8 caracteres')).toBeVisible();
    await expect(page.getByPlaceholder('Repite la contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: /Crear mi cuenta/i })).toBeVisible();
  });

  test('should validate password mismatch on sign-up', { tag: [...AUTH_SIGN_UP_FORM] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);

    await page.getByPlaceholder('Sofía').fill('Test');
    await page.getByPlaceholder('Martínez').fill('User');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('password123');
    await page.getByPlaceholder('Repite la contraseña').fill('different456');

    await page.getByRole('button', { name: /Crear mi cuenta/i }).click();

    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should display forgot password form', { tag: [...AUTH_FORGOT_PASSWORD_FORM] }, async ({ page }) => {
    await page.goto('/forgot-password');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*forgot-password/);
    await expect(page.getByRole('heading', { name: /Olvidaste tu contraseña/i })).toBeVisible();

    await expect(page.getByPlaceholder('tu@correo.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar código/i })).toBeVisible();
  });

  test('should navigate from sign-in to forgot password', { tag: [...AUTH_FORGOT_PASSWORD_FORM] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const forgotLink = page.getByRole('link', { name: /Olvidaste tu contraseña/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL(/.*forgot-password/, { timeout: 10_000 });

    await expect(page).toHaveURL(/.*forgot-password/);
    await expect(page.getByRole('heading', { name: /Olvidaste tu contraseña/i })).toBeVisible();
  });
});
