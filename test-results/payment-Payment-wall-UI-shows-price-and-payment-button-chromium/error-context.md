# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payment.spec.ts >> Payment wall UI >> shows price and payment button
- Location: tests/e2e/payment.spec.ts:106:7

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Payment wall and promo code E2E tests.
  5   |  * Uses route mocking to bypass real MercadoPago and test the UI logic.
  6   |  */
  7   | 
  8   | // Accept terms in localStorage so the terms screen doesn't block tests.
  9   | async function acceptTerms(page: any) {
  10  |   await page.addInitScript(() => {
  11  |     localStorage.setItem('juanita_terms_accepted', '1');
  12  |   });
  13  | }
  14  | 
  15  | // Helper: navigate straight to payment wall via mocked classify + initial chat
  16  | async function goToPaymentWall(page: any) {
  17  |   await acceptTerms(page);
  18  |   await page.route('**/api/classify', async (route: any) => {
  19  |     await route.fulfill({
  20  |       status: 200,
  21  |       contentType: 'application/json',
  22  |       body: JSON.stringify({ tema: 'laboral', resumen: 'Consulta sobre despido injustificado' }),
  23  |     });
  24  |   });
  25  | 
  26  |   await page.route('**/api/chat', async (route: any) => {
  27  |     // Simulate streaming a message that triggers payment
  28  |     await route.fulfill({
  29  |       status: 200,
  30  |       contentType: 'text/event-stream',
  31  |       body: 'data: {"text":"Para continuar necesito"}\n\ndata: {"done":true}\n\n',
  32  |     });
  33  |   });
  34  | 
> 35  |   await page.goto('/');
      |              ^ Error: page.goto: Target page, context or browser has been closed
  36  |   await page.click('[data-action="start"]');
  37  | 
  38  |   const textarea = page.locator('textarea');
  39  |   await expect(textarea).toBeVisible({ timeout: 5_000 });
  40  | 
  41  |   await textarea.fill('Me despidieron y no me pagaron');
  42  |   await textarea.press('Enter');
  43  | 
  44  |   await expect(
  45  |     page.locator('text=Pagar con Mercado Pago').or(page.locator('text=Acceder gratis'))
  46  |   ).toBeVisible({ timeout: 15_000 });
  47  | }
  48  | 
  49  | test.describe('Promo code validation', () => {
  50  |   test('valid promo code shows discount', async ({ page }) => {
  51  |     await page.route('**/api/validate-promo', async (route) => {
  52  |       const req = await route.request().postDataJSON();
  53  |       if (req?.code === 'LANZAMIENTO') {
  54  |         await route.fulfill({
  55  |           status: 200,
  56  |           contentType: 'application/json',
  57  |           body: JSON.stringify({ valid: true, discount: 50, finalPrice: 4995 }),
  58  |         });
  59  |       } else {
  60  |         await route.fulfill({
  61  |           status: 200,
  62  |           contentType: 'application/json',
  63  |           body: JSON.stringify({ valid: false }),
  64  |         });
  65  |       }
  66  |     });
  67  | 
  68  |     await goToPaymentWall(page);
  69  | 
  70  |     const promoInput = page.locator('input[placeholder*="código" i], input[placeholder*="descuento" i]').first();
  71  |     if (await promoInput.isVisible()) {
  72  |       await promoInput.fill('LANZAMIENTO');
  73  |       // Trigger validation (blur or button click)
  74  |       await promoInput.press('Enter');
  75  |       // Should show some discount feedback
  76  |       await expect(
  77  |         page.locator('text=50%').or(page.locator('text=4.995')).or(page.locator('text=descuento'))
  78  |       ).toBeVisible({ timeout: 5_000 });
  79  |     }
  80  |   });
  81  | 
  82  |   test('validate-promo API rejects unknown codes', async ({ page }) => {
  83  |     const res = await page.request.post('/api/validate-promo', {
  84  |       data: { code: 'INVALIDXXXX' },
  85  |     });
  86  |     expect(res.status()).toBe(200);
  87  |     const body = await res.json();
  88  |     expect(body.valid).toBe(false);
  89  |   });
  90  | 
  91  |   test('validate-promo API accepts known codes', async ({ page }) => {
  92  |     const res = await page.request.post('/api/validate-promo', {
  93  |       data: { code: 'JUANITA10' },
  94  |     });
  95  |     // Should either return 200 with valid:true or rate-limit (429)
  96  |     expect([200, 429]).toContain(res.status());
  97  |     if (res.status() === 200) {
  98  |       const body = await res.json();
  99  |       expect(body.valid).toBe(true);
  100 |       expect(body.discount).toBeGreaterThan(0);
  101 |     }
  102 |   });
  103 | });
  104 | 
  105 | test.describe('Payment wall UI', () => {
  106 |   test('shows price and payment button', async ({ page }) => {
  107 |     await goToPaymentWall(page);
  108 | 
  109 |     // Price should be visible
  110 |     await expect(
  111 |       page.locator('text=9.990').or(page.locator('text=$9.990')).or(page.locator('text=9990')).first()
  112 |     ).toBeVisible({ timeout: 5_000 });
  113 | 
  114 |     // Payment button should be present
  115 |     await expect(
  116 |       page.locator('button', { hasText: /pagar/i }).or(
  117 |         page.locator('button', { hasText: /mercado pago/i })
  118 |       )
  119 |     ).toBeVisible();
  120 |   });
  121 | 
  122 |   test('create-payment returns a checkout URL', async ({ page }) => {
  123 |     // Direct API test — validates the endpoint works correctly
  124 |     const res = await page.request.post('/api/create-payment', {
  125 |       data: {
  126 |         tema: 'laboral',
  127 |         resumen: 'Prueba E2E de pago',
  128 |         sessionId: `e2e-test-${Date.now()}`,
  129 |         promoCode: '',
  130 |       },
  131 |     });
  132 |     // Should return 200 with checkoutUrl, or 429 if rate-limited during CI
  133 |     expect([200, 429, 500]).toContain(res.status());
  134 |     if (res.status() === 200) {
  135 |       const body = await res.json();
```