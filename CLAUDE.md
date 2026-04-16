@AGENTS.md

# Juanita La Legal — Contexto de Proyecto

## ¿Qué es esto?

App web de orientación legal chilena desplegada en **juanita-la-legal.vercel.app**.

El usuario escribe su problema legal → se clasifica el tema → se muestra un muro de pago ($9.990 CLP via Mercado Pago) → tras pagar tiene 3 horas de sesión de chat con Juanita (Claude via Anthropic API).

**Repositorio:** `C:\Users\Francisco Vera\juanita-la-legal`  
**Rama activa:** `master` (deploy directo a Vercel production)  
**Deploy:** `vercel --prod` desde la raíz del proyecto

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.2 (App Router, route handlers) |
| AI | Anthropic Claude via `@anthropic-ai/sdk` |
| Pagos | Mercado Pago SDK v2 (`Preference`, `Payment`) |
| Base de datos | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Tests E2E | Playwright (`@playwright/test`) |

---

## Variables de entorno (Vercel)

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Clave API de Anthropic |
| `MP_ACCESS_TOKEN` | Token de producción de Mercado Pago |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave de servicio Supabase (solo server-side) |
| `NEXT_PUBLIC_APP_URL` | `https://juanita-la-legal.vercel.app` |
| `ADMIN_SECRET` | Token para acceder al panel `/admin/feedback?secret=TOKEN` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número WhatsApp para el botón CTA (ej: `56912345678`) — **pendiente configurar** |
| `NEXT_PUBLIC_DEV_SKIP_PAYMENT` | Solo en preview/dev. En producción debe ser `false` o no existir |

Para agregar una variable: `vercel env add NOMBRE production`

---

## Estructura de archivos relevantes

```
src/
├── app/
│   ├── page.jsx                        # App completa (hero + chat + payment wall)
│   ├── layout.jsx
│   ├── admin/feedback/page.jsx         # Dashboard de administración
│   ├── payment-error/page.jsx
│   ├── payment-pending/page.jsx        # Polling de pago pendiente (transferencia)
│   ├── success/page.jsx
│   └── api/
│       ├── chat/route.js               # Streaming SSE con Claude
│       ├── classify/route.js           # Clasificación de tema legal
│       ├── create-payment/route.js     # Crea preferencia en Mercado Pago
│       ├── webhook-mp/route.js         # Webhook de MP (pago aprobado → activa sesión)
│       ├── verify-payment/route.js     # Verifica pago (redirect success + polling pending)
│       ├── validate-promo/route.js     # Valida códigos de descuento
│       ├── feedback/route.js           # Rating de sesión (1-5 estrellas)
│       ├── message-feedback/route.js   # Thumbs up/down por mensaje
│       ├── admin/feedback/route.js     # API del dashboard admin
│       ├── dev-session/route.js        # Bypass de pago (solo si DEV_SKIP_PAYMENT=true)
│       ├── transcribe/route.js         # Transcripción de audio
│       ├── research/route.js           # Investigación legal de respaldo
│       ├── grant-access/route.js
│       └── debug/route.js
├── lib/
│   ├── rateLimit.js                    # Rate limiting en memoria (sliding window)
│   └── logger.js                       # Logging estructurado JSON + persistencia Supabase
tests/
└── e2e/
    ├── landing.spec.ts                 # Hero, chips, clasificación
    ├── payment.spec.ts                 # Payment wall, promo codes, páginas resultado
    └── admin.spec.ts                   # Dashboard admin
playwright.config.ts
```

---

## Base de datos Supabase

### Tablas existentes

**`sessions`**
```sql
session_id   text PRIMARY KEY
payment_id   text
paid_at      timestamptz
expires_at   timestamptz
tema         text
rating       int (1-5)
feedback     text
```

**`message_feedback`**
```sql
id              bigserial PRIMARY KEY
session_id      text
message_id      text
vote            text ('up' | 'down')
comment         text
message_preview text
created_at      timestamptz DEFAULT now()
```

**`error_logs`** ← Crear si no existe:
```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id         bigserial PRIMARY KEY,
  level      text,
  route      text,
  message    text,
  context    jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## Flujo de pago completo

```
Usuario escribe problema
    ↓
/api/classify → { tema, resumen }
    ↓
PaymentWall (UI) — muestra precio, campo promo code
    ↓ (usuario aplica código)
/api/validate-promo → { valid, discount, finalPrice }
    ↓ (usuario hace click pagar)
/api/create-payment → crea Preference en MP → { checkoutUrl }
    ↓ (redirige a MP)
MP procesa pago
    ├── approved → redirect a /success?session=ID
    │       ↓
    │   /api/verify-payment?status=approved → upsert sesión en Supabase
    │
    └── pending → redirect a /payment-pending?session=ID
            ↓ (polling cada 5s)
        /api/verify-payment?status=check_session → ¿expires_at > now?
            ↓ (cuando llega webhook)
        /api/webhook-mp → verifica con MP API → upsert sesión → activa acceso
```

---

## Códigos de descuento

Definidos en `src/app/api/create-payment/route.js` Y `src/app/api/validate-promo/route.js` (mantener sincronizados):

| Código | Descuento |
|--------|-----------|
| `AMIGOS2026` | 100% (gratis) |
| `LANZAMIENTO` | 50% |
| `JUANITA10` | 10% |

Con 100% de descuento se salta Mercado Pago y se activa directamente via `/api/verify-payment`.

---

## Panel de administración

URL: `/admin/feedback?secret=VALOR_DE_ADMIN_SECRET`

Tabs:
- **Sesiones** — historial de sesiones pagadas con rating y comentario
- **🟢 Activas ahora** — sesiones en curso con cuenta regresiva en vivo
- **Evaluaciones por mensaje** — thumbs up/down con filtro

API protegida: `/api/admin/feedback?secret=TOKEN` → 401 sin token válido.

---

## Rate limiting

`src/lib/rateLimit.js` — sliding window en memoria (suficiente para Vercel con una sola instancia).

Límites actuales:
- `/api/create-payment` → 5 req/min por IP
- `/api/chat` → revisar código para límite actual
- `/api/classify` → revisar código para límite actual

Si el tráfico crece: migrar a Upstash Redis con `@upstash/ratelimit`.

---

## WhatsApp CTA

`page.jsx` — componente `WhatsAppCTA` detecta frases clave en respuestas de Juanita y muestra botón "Continuar por WhatsApp".

**Pendiente:** Configurar `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel env vars (formato: `56912345678`).

Frases que disparan el botón (editar en `WHATSAPP_TRIGGERS` dentro de `page.jsx`):
- "necesitas un abogado", "clínica jurídica", y ~11 más.

---

## Tests E2E

```bash
# Contra producción (recomendado para smoke test)
BASE_URL=https://juanita-la-legal.vercel.app npx playwright test

# En local (arranca dev server automáticamente)
npx playwright test

# Con UI interactiva
npm run test:e2e:ui

# Ver reporte HTML
npm run test:e2e:report
```

**21 tests, todos verdes.** Tiempo: ~7s contra producción.

Nota importante para los mocks: la API `/api/classify` retorna `{ tema, resumen }` (no `topic`).

---

## Logging

`src/lib/logger.js`:
- `log.info(route, message, context)` → JSON a stdout
- `log.warn(route, message, context)` → JSON a stdout
- `log.error(route, message, context)` → JSON a stdout + persiste en tabla `error_logs` de Supabase

---

## CSP y headers de seguridad

Configurados en `next.config.ts` → función `headers()`.

Si se agrega un nuevo dominio externo (CDN, API, font), actualizar el CSP ahí.

---

## Convenciones de desarrollo

- **Deploy:** siempre `npm run build` primero, luego `vercel --prod`
- **Rama:** todo en `master` (no hay PR flow actualmente)
- **Secrets:** nunca hardcodear, siempre `process.env.VARIABLE`
- **Classify mock en tests:** retornar `{ tema: 'laboral', resumen: '...' }` — no `topic`
- **Session duration:** 3 horas (`SESSION_DURATION_MS = 3 * 60 * 60 * 1000`)

---

## Historial de mejoras implementadas

1. ✅ Quitar `DEV_SKIP_PAYMENT` de Vercel Production
2. ✅ Webhook real de Mercado Pago (pagos async, transferencia bancaria)
3. ✅ Rate limiting en rutas API críticas (`src/lib/rateLimit.js`)
4. ✅ Dashboard interno de feedback (`/admin/feedback`)
5. ✅ CSP + headers de seguridad (`next.config.ts`)
6. ✅ Reconexión automática si cae mid-stream (hasta 2 reintentos)
7. ✅ Logs de errores en producción (`src/lib/logger.js` + tabla `error_logs`)
8. ✅ Códigos de descuento parciales (validación server-side, nunca confiar en cliente)
9. ✅ Integración WhatsApp CTA (detección de frases clave en respuestas)
10. ✅ Panel admin con sesiones activas + cuenta regresiva en vivo
11. ✅ Tests E2E con Playwright (21 tests cubriendo flujo completo)

---

## Pendientes conocidos

- [ ] Configurar `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel
- [ ] Crear tabla `error_logs` en Supabase si no existe (ver SQL arriba)
- [ ] Evaluar migrar rate limiting a Upstash Redis si escala
- [ ] Agregar más temas a `WHATSAPP_TRIGGERS` según feedback real
- [ ] Configurar CI/CD para correr tests E2E en cada PR (GitHub Actions)
