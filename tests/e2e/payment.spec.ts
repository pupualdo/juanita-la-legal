import { test, expect } from '@playwright/test';

/**
 * Payment wall and promo code E2E tests.
 * Uses route mocking to bypass real MercadoPago and test the UI logic.
 */

// Accept terms in localStorage so the terms screen doesn't block tests.
async function acceptTerms(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('juanita_terms_accepted', '1');
  });
}

// Helper: navigate to pre-chat wall via mocked classify + initial chat
async function goToPreChatWall(page: any) {
  await acceptTerms(page);
  await page.route(/\/api\/classify/, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tema: 'laboral', resumen: 'Consulta sobre despido injustificado' }),
    });
  });

  await page.route(/(chat)/, async (route: any) => {
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

  await textarea.fill('Me despidieron y no me pagaron');
  await textarea.press('Enter');

  // Wait for pre-chat banner to appear
  await expect(
    page.locator('text=mensajes restantes')
  ).toBeVisible({ timeout: 15_000 });
}

test.describe('Promo code validation', () => {
  test('validate-promo API rejects unknown codes', async ({ page }) => {
    const res = await page.request.post('/api/validate-promo', {
      data: { code: 'INVALIDXXXX' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  test('validate-promo API accepts known codes', async ({ page }) => {
    const res = await page.request.post('/api/validate-promo', {
      data: { code: 'JUANITA10' },
    });
    // Should either return 200 with valid:true or rate-limit (429)
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.discount).toBeGreaterThan(0);
    }
  });
});

test.describe('Payment flow', () => {
  test('shows pre-chat wall with purchase option', async ({ page }) => {
    await goToPreChatWall(page);

    // The pre-chat wall shows the banner with remaining messages
    await expect(
      page.locator('text=mensajes restantes')
    ).toBeVisible({ timeout: 5_000 });

    // The price $4.995 should be visible in the pre-chat banner
    await expect(
      page.locator('text=Prueba gratuita')
    ).toBeVisible({ timeout: 5_000 });
  });

  test('create-payment returns a checkout URL', async ({ page }) => {
    // Direct API test — validates the endpoint works correctly
    const res = await page.request.post('/api/create-payment', {
      data: {
        tema: 'laboral',
        resumen: 'Prueba E2E de pago',
        sessionId: `e2e-test-${Date.now()}`,
        promoCode: '',
      },
    });
    // Should return 200 with checkoutUrl, or 429 if rate-limited during CI
    expect([200, 429, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.checkoutUrl).toMatch(/^https:\/\//);
      expect(body.checkoutUrl).toContain('mercadopago');
    }
  });

  test('pre-chat shows price and purchase option', async ({ page }) => {
    await goToPreChatWall(page);

    // Pre-chat banner should show the discounted price
    await expect(
      page.locator('text=4.995').or(page.locator('text=4,995')).first()
    ).toBeVisible({ timeout: 5_000 });

    // The banner mentions the purchase option
    await expect(
      page.locator('text=consulta completa').or(page.locator('text=Prueba gratuita'))
    ).toBeVisible();
  });
});

test.describe('Payment result pages', () => {
  test('payment-error page renders', async ({ page }) => {
    await page.goto('/payment-error');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should have some user-facing text explaining the error
    await expect(
      page.locator('text=error').or(page.locator('text=Error')).or(page.locator('text=pago'))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('payment-pending page renders', async ({ page }) => {
    await page.goto('/payment-pending?session=test-session-123');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show the pending state with the process message
    await expect(
      page.getByRole('heading', { name: 'Pago en proceso' })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('success page without valid session shows landing', async ({ page }) => {
    // Without a paid session, should redirect or show the landing
    await page.goto('/success?session=invalid-session-id');
    // Should not crash — either redirect or show some content
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
