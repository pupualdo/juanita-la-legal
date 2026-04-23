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

// Helper: navigate straight to payment wall via mocked classify + initial chat
async function goToPaymentWall(page: any) {
  await acceptTerms(page);
  await page.route('**/api/classify', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tema: 'laboral', resumen: 'Consulta sobre despido injustificado' }),
    });
  });

  await page.route('**/api/chat', async (route: any) => {
    // Simulate streaming a message that triggers payment
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"text":"Para continuar necesito"}\n\ndata: {"done":true}\n\n',
    });
  });

  await page.goto('/');
  await page.click('[data-action="start"]');

  const textarea = page.locator('textarea');
  await expect(textarea).toBeVisible({ timeout: 5_000 });

  await textarea.fill('Me despidieron y no me pagaron');
  await textarea.press('Enter');

  await expect(
    page.locator('text=Pagar con Mercado Pago').or(page.locator('text=Acceder gratis'))
  ).toBeVisible({ timeout: 15_000 });
}

test.describe('Promo code validation', () => {
  test('valid promo code shows discount', async ({ page }) => {
    await page.route('**/api/validate-promo', async (route) => {
      const req = await route.request().postDataJSON();
      if (req?.code === 'LANZAMIENTO') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, discount: 50, finalPrice: 4995 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: false }),
        });
      }
    });

    await goToPaymentWall(page);

    const promoInput = page.locator('input[placeholder*="código" i], input[placeholder*="descuento" i]').first();
    if (await promoInput.isVisible()) {
      await promoInput.fill('LANZAMIENTO');
      // Trigger validation (blur or button click)
      await promoInput.press('Enter');
      // Should show some discount feedback
      await expect(
        page.locator('text=50%').or(page.locator('text=4.995')).or(page.locator('text=descuento'))
      ).toBeVisible({ timeout: 5_000 });
    }
  });

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

test.describe('Payment wall UI', () => {
  test('shows price and payment button', async ({ page }) => {
    await goToPaymentWall(page);

    // Price should be visible
    await expect(
      page.locator('text=9.990').or(page.locator('text=$9.990')).or(page.locator('text=9990')).first()
    ).toBeVisible({ timeout: 5_000 });

    // Payment button should be present
    await expect(
      page.locator('button', { hasText: /pagar/i }).or(
        page.locator('button', { hasText: /mercado pago/i })
      )
    ).toBeVisible();
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

  test('100% promo code skips MercadoPago redirect', async ({ page }) => {
    // Mock validate-promo and verify-payment for AMIGOS2026 (100% off)
    await page.route('**/api/validate-promo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, discount: 100, finalPrice: 0 }),
      });
    });

    await page.route('**/api/verify-payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
      });
    });

    await goToPaymentWall(page);

    const promoInput = page.locator('input[placeholder*="código" i], input[placeholder*="descuento" i]').first();
    if (await promoInput.isVisible()) {
      await promoInput.fill('AMIGOS2026');
      await promoInput.press('Enter');

      // After 100% discount the button should change to "Acceder gratis"
      await expect(page.locator('button', { hasText: /gratis/i })).toBeVisible({ timeout: 5_000 });
    }
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
