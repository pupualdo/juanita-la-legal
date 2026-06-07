# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payment.spec.ts >> Promo code validation >> valid promo code shows discount
- Location: tests/e2e/payment.spec.ts:50:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Pagar con Mercado Pago').or(locator('text=Acceder gratis'))
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=Pagar con Mercado Pago').or(locator('text=Acceder gratis'))

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: ⚖️
        - generic [ref=e7]:
          - generic [ref=e8]: Juanita La Legal
          - generic [ref=e9]: Orientación legal en buen chileno · $9.990
      - generic [ref=e10]:
        - generic [ref=e11]: 💼 Derecho Laboral
        - button "← Inicio" [ref=e12] [cursor=pointer]
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: 👋
        - generic [ref=e17]: ¡Buen caso! Esto es derecho laboral
        - generic [ref=e18]: "Puedo orientarte paso a paso: qué dice la ley, qué te conviene hacer y qué no, y cómo ordenar tu caso para que no pierdas tiempo ni plata."
      - generic [ref=e19]:
        - generic [ref=e20]: "En 10 minutos de consulta obtienes:"
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: ✓
            - generic [ref=e24]: Orientación clara y en buen chileno sobre tu caso concreto
          - generic [ref=e25]:
            - generic [ref=e26]: ✓
            - generic [ref=e27]: Qué dice la ley chilena y cómo se aplica a tu situación
          - generic [ref=e28]:
            - generic [ref=e29]: ✓
            - generic [ref=e30]: Riesgos si no actúas, opciones que tienes y próximos pasos
          - generic [ref=e31]:
            - generic [ref=e32]: ✓
            - generic [ref=e33]: Si necesitas abogado, te decimos claramente y te orientamos a dónde ir
      - generic [ref=e34]:
        - generic [ref=e35]: 💼
        - generic [ref=e36]:
          - generic [ref=e37]: Tema detectado
          - generic [ref=e38]: Derecho Laboral
          - generic [ref=e39]: Consulta sobre despido injustificado
      - generic [ref=e41]:
        - textbox "¿Tienes un código de descuento?" [ref=e42]
        - button "Aplicar" [disabled] [ref=e43]
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: Precio normal
          - generic [ref=e47]: $9.990
        - generic [ref=e48]:
          - strong [ref=e50]: Lanzamiento 50% off
          - generic [ref=e51]: $4.995
      - button "💳 Pagar $4.995 con Mercado Pago" [ref=e52] [cursor=pointer]
      - generic [ref=e53]: 🔒 Pago seguro · Mercado Pago Chile · Consulta de 10 minutos
      - button "← Probar con otra consulta" [ref=e54] [cursor=pointer]
  - generic [ref=e59] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e60]:
      - img [ref=e61]
    - generic [ref=e64]:
      - button "Open issues overlay" [ref=e65]:
        - generic [ref=e66]:
          - generic [ref=e67]: "0"
          - generic [ref=e68]: "1"
        - generic [ref=e69]: Issue
      - button "Collapse issues badge" [ref=e70]:
        - img [ref=e71]
  - alert [ref=e73]
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
  35  |   await page.goto('/');
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
> 46  |   ).toBeVisible({ timeout: 15_000 });
      |     ^ Error: expect(locator).toBeVisible() failed
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
  136 |       expect(body.checkoutUrl).toMatch(/^https:\/\//);
  137 |       expect(body.checkoutUrl).toContain('mercadopago');
  138 |     }
  139 |   });
  140 | 
  141 |   test('100% promo code skips MercadoPago redirect', async ({ page }) => {
  142 |     // Mock validate-promo and verify-payment for AMIGOS2026 (100% off)
  143 |     await page.route('**/api/validate-promo', async (route) => {
  144 |       await route.fulfill({
  145 |         status: 200,
  146 |         contentType: 'application/json',
```