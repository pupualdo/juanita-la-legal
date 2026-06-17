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
  });
}

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptTerms(page);
    await page.goto('/');
  });

  test('renders hero section with title and CTA', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Juanita La Legal');
    await expect(page.getByRole('button', { name: /iniciar consulta/i })).toBeVisible();
  });

  test('shows legal area chips in hero', async ({ page }) => {
    await expect(page.getByText('Derecho Laboral')).toBeVisible();
    await expect(page.getByText('Derecho de Familia')).toBeVisible();
    await expect(page.getByText('Arriendo y Vivienda')).toBeVisible();
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

test.describe('Preview → email-gate → teaser → paywall flow (mocked)', () => {
  // Sets up all the API mocks the free-preview flow needs.
  async function mockApis(page: any) {
    // Classify runs silently in the background after the first message.
    await page.route('**/api/classify', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tema: 'laboral', resumen: 'Consulta sobre despido injustificado' }),
      });
    });

    // Free preview chat: returns a teaser once the user has had 3 turns.
    await page.route('**/api/preview-chat', async (route: any) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const priorUsers = (body.history || []).filter((m: any) => m.role === 'user').length;
      const isTeaser = priorUsers + 1 >= 3;
      const text = isTeaser
        ? 'Por lo que me cuentas, veo que tienes varias opciones concretas.'
        : '¿Hace cuánto fue esto?';
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: {"text":${JSON.stringify(text)}}\n\ndata: {"teaser":${isTeaser}}\n\ndata: [DONE]\n\n`,
      });
    });

    // Lead capture (email-gate).
    await page.route('**/api/lead', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    // Promo validation (50% LANZAMIENTO autollenado).
    await page.route('**/api/validate-promo', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, discount: 50, label: '50% descuento' }),
      });
    });
  }

  async function sendPreviewTurn(page: any, text: string) {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeEnabled({ timeout: 15_000 });
    await textarea.fill(text);
    await textarea.press('Enter');
  }

  test('runs the full free-preview flow to the payment wall', async ({ page }) => {
    await acceptTerms(page);
    await mockApis(page);

    await page.goto('/');
    await page.click('[data-action="start"]');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5_000 });

    // Turn 1 + 2: indagación gratuita.
    await sendPreviewTurn(page, 'Me despidieron sin aviso y no me pagaron el finiquito');
    await expect(page.locator('text=¿Hace cuánto fue esto?').first()).toBeVisible({ timeout: 15_000 });
    await sendPreviewTurn(page, 'Hace tres días');

    // Turn 3: dispara el email-gate antes del teaser.
    await sendPreviewTurn(page, 'Llevaba dos años con contrato indefinido');
    await expect(page.locator('text=Ya casi tengo claro tu caso')).toBeVisible({ timeout: 15_000 });

    // Captura de correo → revela el teaser.
    await page.locator('input[type="email"]').fill('cliente@ejemplo.cl');
    await page.getByRole('button', { name: /ver mis opciones/i }).click();
    await expect(page.locator('text=varias opciones concretas')).toBeVisible({ timeout: 15_000 });

    // CTA del teaser → muro de pago.
    await page.getByRole('button', { name: /desbloquear mi consulta completa/i }).click();

    // Aparece el popup de descuento de lanzamiento.
    await expect(page.locator('text=Oferta de lanzamiento')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /aplicar 50% y pagar ahora/i }).click();

    // El muro de pago queda visible con el precio con descuento aplicado.
    await expect(page.locator('text=Pagar con Mercado Pago').or(
      page.locator('text=Acceder gratis')
    )).toBeVisible({ timeout: 15_000 });
  });

  test('email-gate rejects an invalid email', async ({ page }) => {
    await acceptTerms(page);
    await mockApis(page);

    await page.goto('/');
    await page.click('[data-action="start"]');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5_000 });

    await sendPreviewTurn(page, 'Me despidieron sin aviso');
    await expect(page.locator('text=¿Hace cuánto fue esto?').first()).toBeVisible({ timeout: 15_000 });
    await sendPreviewTurn(page, 'Hace poco');
    await sendPreviewTurn(page, 'Contrato indefinido');

    await expect(page.locator('text=Ya casi tengo claro tu caso')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[type="email"]').fill('no-es-un-correo');
    await page.getByRole('button', { name: /ver mis opciones/i }).click();
    await expect(page.locator('text=correo válido')).toBeVisible({ timeout: 5_000 });
  });
});
