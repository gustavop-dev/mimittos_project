import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import {
  PAYMENT_CARD_SUBMIT,
  PAYMENT_NEQUI_SUBMIT,
  PAYMENT_PSE_SUBMIT,
  PAYMENT_PSE_LEGAL_ENTITY,
  PAYMENT_BANCOLOMBIA_SUBMIT,
} from '../helpers/flow-tags';

const ORDER_NUMBER = 'PELUCH-9001-AAAA';

const paymentInfo = {
  order_number: ORDER_NUMBER,
  reference: 'REF-9001',
  amount_in_cents: 6400000,
  currency: 'COP',
  total_amount: 128000,
  deposit_amount: 64000,
  balance_amount: 64000,
  customer_name: 'Ana Garcia',
  customer_email: 'ana@test.com',
  customer_phone: '3001234567',
  status: 'pending',
};

const wompiAcceptance = {
  data: {
    presigned_acceptance: {
      acceptance_token: 'acc-tok-123',
      permalink: 'https://wompi.co/terms',
    },
    presigned_personal_data_auth: { acceptance_token: 'auth-tok-456' },
  },
};

const pseBanks = [
  { financial_institution_code: '1007', financial_institution_name: 'Bancolombia' },
  { financial_institution_code: '1051', financial_institution_name: 'Davivienda' },
];

async function mockBaselinePaymentRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/payment/info/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paymentInfo) }),
  );
  await page.route('**/sandbox.wompi.co/v1/merchants/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wompiAcceptance) }),
  );
  await page.route('**/api/payment/pse-banks/', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pseBanks) }),
  );
}

test.describe('Payment method submissions', () => {
  test(
    'should submit card payment and navigate to order-confirmed when approved',
    { tag: [...PAYMENT_CARD_SUBMIT] },
    async ({ page }) => {
      await mockBaselinePaymentRoutes(page);

      await page.route('**/sandbox.wompi.co/v1/tokens/cards', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'card-token-xyz' } }),
        }),
      );

      const processRequest = page.waitForRequest(
        (req) => req.url().includes('/api/payment/process/') && req.method() === 'POST',
      );

      await page.route('**/api/payment/process/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'APPROVED', redirect_url: '', wompi_id: 'wompi-card-1' }),
        }),
      );

      await page.goto(`/payment?order=${ORDER_NUMBER}&deposit=64000`);
      await waitForPageLoad(page);

      await page.getByRole('button', { name: /Tarjeta/ }).first().click();
      await page.getByPlaceholder('0000 0000 0000 0000').fill('4242424242424242');
      await page.getByPlaceholder('Como aparece en la tarjeta').fill('Ana Garcia');
      await page.getByPlaceholder('MM/AA').fill('1230');
      await page.getByPlaceholder('···').fill('123');

      await page.getByRole('button', { name: /Pagar/ }).click();

      const processed = await processRequest;
      const body = processed.postDataJSON() as Record<string, unknown>;
      expect(body.method).toBe('CARD');
      expect(body.card_token).toBe('card-token-xyz');

      await page.waitForURL(/\/order-confirmed\?order=/);
      expect(page.url()).toContain(`order=${ORDER_NUMBER}`);
      expect(page.url()).toContain('confirmed=1');
    },
  );

  test(
    'should submit Nequi payment with phone and reach order-confirmed',
    { tag: [...PAYMENT_NEQUI_SUBMIT] },
    async ({ page }) => {
      await mockBaselinePaymentRoutes(page);

      const processRequest = page.waitForRequest(
        (req) => req.url().includes('/api/payment/process/') && req.method() === 'POST',
      );

      await page.route('**/api/payment/process/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'APPROVED', redirect_url: '', wompi_id: 'wompi-nequi-1' }),
        }),
      );

      await page.goto(`/payment?order=${ORDER_NUMBER}&deposit=64000`);
      await waitForPageLoad(page);

      await page.getByRole('button', { name: /Nequi/ }).first().click();
      await page.getByPlaceholder('3001234567').fill('3009876543');

      await page.getByRole('button', { name: /Pagar/ }).click();

      const processed = await processRequest;
      const body = processed.postDataJSON() as Record<string, unknown>;
      expect(body.method).toBe('NEQUI');
      expect(body.phone_number).toBe('3009876543');

      await page.waitForURL(/\/order-confirmed\?order=/);
    },
  );

  test(
    'should submit PSE payment with bank and ID and follow redirect_url',
    { tag: [...PAYMENT_PSE_SUBMIT] },
    async ({ page }) => {
      await mockBaselinePaymentRoutes(page);

      const processRequest = page.waitForRequest(
        (req) => req.url().includes('/api/payment/process/') && req.method() === 'POST',
      );

      await page.route('**/api/payment/process/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PENDING',
            redirect_url: 'https://pse-bank.example.com/auth?ref=REF-9001',
            wompi_id: 'wompi-pse-1',
          }),
        }),
      );

      await page.route('https://pse-bank.example.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Bank portal</body></html>' }),
      );

      await page.goto(`/payment?order=${ORDER_NUMBER}&deposit=64000`);
      await waitForPageLoad(page);

      await page.getByRole('button', { name: /^PSE/ }).first().click();
      await page.getByRole('combobox').first().selectOption('1007');
      await page.locator('input[placeholder="1234567890"]').fill('1023456789');

      await page.getByRole('button', { name: /Pagar/ }).click();

      const processed = await processRequest;
      const body = processed.postDataJSON() as Record<string, unknown>;
      expect(body.method).toBe('PSE');
      expect(body.bank_code).toBe('1007');
      expect(body.user_legal_id).toBe('1023456789');

      await page.waitForURL(/pse-bank\.example\.com/);
    },
  );

  test(
    'should restrict PSE document type to NIT for a legal entity',
    { tag: [...PAYMENT_PSE_LEGAL_ENTITY] },
    async ({ page }) => {
      await mockBaselinePaymentRoutes(page);

      const processRequest = page.waitForRequest(
        (req) => req.url().includes('/api/payment/process/') && req.method() === 'POST',
      );

      await page.route('**/api/payment/process/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PENDING',
            redirect_url: 'https://pse-bank.example.com/auth?ref=REF-9002',
            wompi_id: 'wompi-pse-2',
          }),
        }),
      );

      await page.route('https://pse-bank.example.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Bank portal</body></html>' }),
      );

      await page.goto(`/payment?order=${ORDER_NUMBER}&deposit=64000`);
      await waitForPageLoad(page);

      await page.getByRole('button', { name: /^PSE/ }).first().click();
      await page.getByRole('button', { name: 'Jurídica' }).click();

      // The document-type selector must offer only NIT for a legal entity.
      const idTypeSelect = page.getByRole('combobox').nth(1);
      await expect(idTypeSelect.getByRole('option')).toHaveText(['NIT']);

      await page.getByRole('combobox').first().selectOption('1007');
      await page.locator('input[placeholder="1234567890"]').fill('9001234567');
      await page.getByRole('button', { name: /Pagar/ }).click();

      const processed = await processRequest;
      const body = processed.postDataJSON() as Record<string, unknown>;
      expect(body.method).toBe('PSE');
      expect(body.user_type).toBe(1);
      expect(body.user_legal_id_type).toBe('NIT');

      await page.waitForURL(/pse-bank\.example\.com/);
    },
  );

  test(
    'should submit Bancolombia transfer with ID and follow redirect_url',
    { tag: [...PAYMENT_BANCOLOMBIA_SUBMIT] },
    async ({ page }) => {
      await mockBaselinePaymentRoutes(page);

      const processRequest = page.waitForRequest(
        (req) => req.url().includes('/api/payment/process/') && req.method() === 'POST',
      );

      await page.route('**/api/payment/process/', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PENDING',
            redirect_url: 'https://bancolombia.example.com/auth?ref=REF-9001',
            wompi_id: 'wompi-banco-1',
          }),
        }),
      );

      await page.route('https://bancolombia.example.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Bancolombia portal</body></html>' }),
      );

      await page.goto(`/payment?order=${ORDER_NUMBER}&deposit=64000`);
      await waitForPageLoad(page);

      await page.getByRole('button', { name: /Bancolombia/ }).first().click();
      // Wompi only allows user_type="PERSON" for BANCOLOMBIA_TRANSFER in single payments
      // and the bank collects the document on auth, so the form asks for no more data.

      await page.getByRole('button', { name: /Pagar/ }).click();

      const processed = await processRequest;
      const body = processed.postDataJSON() as Record<string, unknown>;
      expect(body.method).toBe('BANCOLOMBIA_TRANSFER');
      expect(body.user_legal_id).toBeUndefined();
      expect(body.user_type).toBeUndefined();

      await page.waitForURL(/bancolombia\.example\.com/);
    },
  );
});
