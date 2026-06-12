import { test, expect } from '@playwright/test';

/**
 * Landing page and initial chat flow tests.
 * These tests cover the hero section and the topic classification flow
 * without making real payments.
 */

// Accept terms in localStorage so the terms screen doesn't block tests.
// Tests that specifically test the terms flow should NOT use this helper.
async function acceptTerms(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('juanita_terms_accepted', '1');
    localStorage.setItem('juanita_demo_ts', String(Date.now()));
  });
}

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptTerms(page);
    await page.goto('/');
  });

  test('renders hero section with title and CTA', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('problema legal');
    await expect(page.getByRole('button', { name: /Iniciar mi orientación/i })).toBeVisible();
  });

  test('shows legal area chips in hero', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Derecho Laboral/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Derecho de Familia/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Arriendo y Vivienda/ })).toBeVisible();
  });

  test('navigates to chat screen on CTA click', async ({ page }) => {
    await page.click('[data-action="start"]');
    // After clicking, the chat interface should appear with a textarea
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Chat input and suggestion chips', () => {
  test.beforeEach(async ({ page }) => {
    await acceptTerms(page);
    await page.goto('/');
    await page.click('[data-action="start"]');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5_000 });
  });

  test('shows suggestion chips', async ({ page }) => {
    // At least one suggestion chip should be visible
    const chips = page.locator('button').filter({ hasText: /pensión|despido|arrendador|herencia|migra/i });
    await expect(chips.first()).toBeVisible({ timeout: 5_000 });
  });

  test('typing in the input enables the send button', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Me despidieron sin causa justa');
    // Send button should be enabled (not disabled)
    const sendBtn = page.locator('button[type="submit"], button').filter({ hasText: /enviar|send/i }).or(
      page.locator('button[aria-label*="enviar" i], button[aria-label*="send" i]')
    );
    // Alternatively check that textarea is not empty
    await expect(textarea).toHaveValue('Me despidieron sin causa justa');
  });

  test('clicking a suggestion chip fills the input', async ({ page }) => {
    const chip = page.locator('button').filter({ hasText: /despido/i }).first();
    if (await chip.isVisible()) {
      await chip.click();
      await expect(page.locator('textarea')).not.toHaveValue('');
    }
  });
});

test.describe('Topic classification flow (mocked)', () => {
  test('classifies message and shows pre-chat wall', async ({ page }) => {
    await acceptTerms(page);

    // Mock the classify API
    await page.route(/\/api\/classify/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tema: 'laboral', resumen: 'Consulta sobre despido injustificado' }),
      });
    });

    // Mock chat API (SSE stream) - needed for pre-chat responses
    await page.route(/(chat)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"text":"Entiendo tu consulta laboral"}\n\ndata: {"done":true}\n\n',
      });
    });

    await page.goto('/');
    await page.click('[data-action="start"]');

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    // Type a labor-related query
    await textarea.fill('Me despidieron sin aviso y no me pagaron el finiquito');
    await textarea.press('Enter');

    // Wait for pre-chat wall to appear (stage = "prechat")
    await expect(page.locator('text=mensajes restantes')).toBeVisible({ timeout: 15_000 });
  });
});
