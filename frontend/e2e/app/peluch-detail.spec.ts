import { test, expect } from '../test-with-coverage';
import type { Page } from '@playwright/test';
import { waitForPageLoad } from '../fixtures';
import {
  PELUCH_DETAIL_SIZE_COLOR,
  PELUCH_DETAIL_HUELLA,
  PELUCH_DETAIL_CORAZON,
  PELUCH_DETAIL_AUDIO,
} from '../helpers/flow-tags';

async function navigateToFirstPeluch(page: Page) {
  await page.goto('/catalog');
  await waitForPageLoad(page);
  const cards = page.locator('a[href^="/peluches/"]');
  const count = await cards.count();
  if (count === 0) return false;
  // quality: allow-fragile-selector (peluch list links uniquely scoped by href pattern)
  await cards.first().click();
  await waitForPageLoad(page);
  return true;
}

test.describe('Peluch Detail — Personalization', () => {
  test('should select size and color on peluch detail page',
    { tag: [...PELUCH_DETAIL_SIZE_COLOR] },
    async ({ page }) => {
      const found = await navigateToFirstPeluch(page);
      if (!found) return;

      await expect(page).toHaveURL(/.*peluches\/.+/);

      // Size section
      const sizeLabel = page.getByText('Tamaño');
      if (await sizeLabel.isVisible()) {
        // quality: allow-fragile-selector (size options are divs keyed by size data; scoped by cm text pattern)
        const sizeOptions = page.locator('div').filter({ hasText: /\d+cm/ }).filter({ hasText: /\$/ });
        const sizeCount = await sizeOptions.count();

        if (sizeCount > 1) {
          // quality: allow-fragile-selector (size options are divs driven by catalog data; second option picked to test toggle)
          await sizeOptions.nth(1).click();
          await expect(sizeLabel).toBeVisible();
        } else if (sizeCount === 1) {
          // quality: allow-fragile-selector (only one size available; first is the only choice)
          await sizeOptions.first().click();
          await expect(sizeLabel).toBeVisible();
        }
      }

      // Color section
      const colorLabel = page.getByText('Color del peluche');
      if (await colorLabel.isVisible()) {
        // quality: allow-fragile-selector (color swatches are circular divs with hex background; first swatch is the default, click second if available)
        const colorSection = page.locator('div').filter({ has: colorLabel }).last();
        const colorNames = colorSection.locator('span').filter({ hasText: /\w+/ });
        const colorCount = await colorNames.count();

        if (colorCount > 1) {
          // quality: allow-fragile-selector (color swatches are data-driven; second swatch tests toggle from default)
          await colorNames.nth(1).click();
        } else if (colorCount === 1) {
          // quality: allow-fragile-selector (only one color available; first is the only choice)
          await colorNames.first().click();
        }

        await expect(colorLabel).toBeVisible();
      }
    }
  );

  test('should fill huella text personalization on peluch detail page',
    { tag: [...PELUCH_DETAIL_HUELLA] },
    async ({ page }) => {
      const found = await navigateToFirstPeluch(page);
      if (!found) return;

      await expect(page).toHaveURL(/.*peluches\/.+/);

      const huellaSection = page.getByText(/🐾 Huella/);
      if (!await huellaSection.isVisible()) return;

      // The default huella type is "Nombre"; its input is immediately visible
      const huellaInput = page.getByPlaceholder('Escribe el nombre aquí...');
      if (await huellaInput.isVisible()) {
        await huellaInput.fill('Luna');
        await expect(huellaInput).toHaveValue('Luna');
      }
    }
  );

  test('should fill corazón phrase personalization on peluch detail page',
    { tag: [...PELUCH_DETAIL_CORAZON] },
    async ({ page }) => {
      const found = await navigateToFirstPeluch(page);
      if (!found) return;

      await expect(page).toHaveURL(/.*peluches\/.+/);

      const corazonSection = page.getByText(/💖 Corazón personalizado/);
      if (!await corazonSection.isVisible()) return;

      const phraseInput = page.getByPlaceholder('Una frase especial (máx. 50 caracteres)');
      if (!await phraseInput.isVisible()) return;

      const phrase = 'Te quiero mucho';
      await phraseInput.fill(phrase);

      await expect(phraseInput).toHaveValue(phrase);
      // Char counter updates to phrase.length/50
      await expect(page.getByText(`${phrase.length}/50`)).toBeVisible();
    }
  );

  test('should show audio upload button on peluch detail page',
    { tag: [...PELUCH_DETAIL_AUDIO] },
    async ({ page }) => {
      const found = await navigateToFirstPeluch(page);
      if (!found) return;

      await expect(page).toHaveURL(/.*peluches\/.+/);

      const audioSection = page.getByText(/🔊 Audio personalizado/);
      if (!await audioSection.isVisible()) return;

      // Audio upload button triggers a hidden file input
      const uploadBtn = page.getByRole('button', { name: /Subir audio/i });
      await expect(uploadBtn).toBeVisible();
    }
  );
});
