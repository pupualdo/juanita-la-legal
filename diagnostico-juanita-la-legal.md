# Juanita La Legal — Ficha Completa para Diagnóstico

> Chatbot de orientación legal chilena. Next.js 16 + Claude + Supabase + WebPay/MercadoPago.
> **URL:** https://juanitalalegal.cl | **Repo:** `pupualdo/juanita-la-legal` (rama `master`)

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Framework** | Next.js (App Router) | ^16.2.7 |
| **UI** | React + Tailwind CSS v4 | 19.2.4 |
| **LLM** | Claude (Anthropic SDK) | ^0.82.0 |
| **Base de datos** | Supabase | ^2.101.1 |
| **Pagos** | Mercado Pago + Transbank WebPay Plus | ^2.12.0 / ^6.1.1 |
| **Email** | Resend | ^6.12.0 |
| **Markdown** | react-markdown + remark-gfm | ^10.1.0 |
| **Analytics** | Vercel Analytics + Google Analytics + Meta Pixel + MS Clarity | — |
| **Hosting** | Vercel (deploy automático desde `master`) | — |
| **Testing** | Playwright | ^1.59.1 |
| **SDK extra** | OpenAI SDK (usado para transcripción) | ^6.34.0 |

---

## 2. Estructura del Proyecto

```
src/  (6,652 líneas totales en .jsx + .js)
├── app/
│   ├── layout.jsx               ← Layout raíz (analytics, SEO, fonts)
│   ├── page.jsx                  ← App principal: router de pantallas (76 loc)
│   ├── success/page.jsx          ← Post-pago exitoso
│   ├── payment-error/page.jsx    ← Error de pago
│   ├── payment-pending/page.jsx  ← Pago pendiente
│   └── admin/
│       ├── feedback/page.jsx     ← Panel feedback usuarios
│       └── promos/page.jsx       ← Panel códigos promocionales
│       └── api/admin/...         ← 3 endpoints de administración
│       └── api/...
├── api/  (18 endpoints, 1,785 líneas)
│   ├── chat/route.js             ← Claude streaming (542 loc)
│   ├── classify/route.js         ← Clasificación de tema legal
│   ├── create-payment/route.js   ← Mercado Pago Preference
│   ├── webpay/create/route.js    ← Transbank WebPay — crear transacción
│   ├── webpay/commit/route.js    ← Transbank WebPay — confirmar pago
│   ├── grant-access/route.js     ← Validar código gratis + activar sesión
│   ├── validate-promo/route.js   ← Validar código promocional
│   ├── verify-receipt/route.js   ← Verificación de comprobante con Claude Vision
│   ├── verify-payment/route.js   ← Verificar estado de pago MP
│   ├── feedback/route.js         ← Feedback de sesión
│   ├── message-feedback/route.js ← 👍👎 feedback por mensaje
│   ├── webhook-mp/route.js       ← Webhook Mercado Pago
│   ├── dev-session/route.js      ← Debug: crear sesión de prueba
│   ├── research/route.js         ← Búsqueda legal actualizada
│   ├── transcribe/route.js       ← Transcripción de audio
│   ├── debug/route.js            ← Debug de variables de entorno
│   └── cron/keep-alive/route.js  ← Cron para mantener Vercel activo
├── components/
│   ├── chat/  (7 componentes, 1,724 líneas)
│   │   ├── ChatSection.jsx       ← Lógica principal de chat (946 loc)
│   │   ├── PreChatWall.jsx       ← Pre-chat 3 intercambios gratis (167 loc)
│   │   ├── MessageBubble.jsx     ← Burbuja de mensaje
│   │   ├── MessageActions.jsx    ← Botones Copiar/Compartir
│   │   ├── MessageFeedback.jsx   ← 👍👎 feedback en mensajes
│   │   ├── JuanitaMessage.jsx    ← Renderizado markdown de respuestas
│   │   ├── ContactForm.jsx       ← Formulario post-chat
│   │   ├── BuySessionButton.jsx  ← Botón comprar sesión adicional
│   │   ├── WhatsAppCTA.jsx       ← CTA WhatsApp para derivación
│   │   └── RatingModal.jsx       ← Modal de estrellas post-sesión
│   ├── payment/  (4 componentes, 874 líneas)
│   │   ├── PaymentWall.jsx       ← Muro de pago (post pre-chat, 296 loc)
│   │   ├── DemoPaymentWall.jsx   ← Muro de pago post demo gratis (420 loc)
│   │   ├── PaymentMethodScreen.jsx ← Selector WebPay/MercadoPago/Transferencia
│   │   └── LaunchDiscountModal.jsx  ← Popup 50% descuento
│   ├── landing/  (3 componentes, 668 líneas)
│   │   ├── HeroSection.jsx       ← Landing page principal (399 loc)
│   │   ├── TopicDetailModal.jsx  ← Modal de detalle por tema legal
│   │   └── TermsScreen.jsx       ← Términos y condiciones
│   └── ui/  (5 componentes, 172 líneas)
│       ├── ConsultTimer.jsx      ← Timer de sesión (10 min)
│       ├── TopicBadge.jsx        ← Badge de área legal
│       ├── TypingDots.jsx        ← Animación "escribiendo..."
│       ├── FinalAnswerCard.jsx   ← Tarjeta de resumen final
│       └── Section.jsx           ← Sección colapsable de glosario legal
└── lib/  (3 archivos, 547 líneas)
    ├── constants.js              ← Constantes: TOPIC_*, TYC_SECTIONS, LEGAL_TERMS
    ├── logger.js                 ← Logger estructurado con persistencia a Supabase
    └── rateLimit.js              ← Rate limiter in-memory sliding window
```

---

## 3. Flujo de Usuario

```
Hero (título orientado al problema, testimonio visible, banner oferta lanzamiento)
  → ⚡ Cómo funciona (arriba, después del hero)
  → ¿Qué es Juanita? (explicación + 4 tarjetas: basado en derecho chileno, sesión rápida, honestos, sin letra chica)
  → Social Proof + Testimonios (3,000+ personas orientadas, 10 áreas legales, $4.995 descuento)
  → TopicDetailModal (overlay al tocar un chip de tema)
  → Términos (checkbox + TYC completo)
  → Escribir consulta (textarea)
  → Clasificar tema (POST /api/classify con Claude)
  → Pre-chat (3 intercambios gratis, barra de progreso, prompt persuasivo)
    → Código gratis (MEJORAMIGO2026 / AMIGOS2026) → redirect directo a chat
    → Código descuento (LANZAMIENTO 50%) → precio baja a $4.995
    → Pago → PaymentMethodScreen (WebPay | Mercado Pago | Transferencia bancaria)
      → Chat de 10 min (Claude con SYSTEM_PROMPT legal ~380 líneas)
        → Timer visible, historial en Supabase, refresco expiración +15min
        → Copiar / Compartir (WhatsApp/Email) cada respuesta
        → 👍👎 feedback por mensaje
        → FinalAnswerCard + RatingModal estrellas
        → WhatsAppCTA si el caso deriva a abogado
```

---

## 4. Endpoints API Detallados

### Chat / Conversación
| Endpoint | Método | Función |
|---|---|---|
| `/api/chat` | POST | Streaming Claude con historial de sesión. SYSTEM_PROMPT ~380 líneas con: identidad, 10 áreas legales, 3-pasos (escuchar→orientar→derivar), protocolos urgencia. Refresca `expires_at` +15min en cada respuesta. |
| `/api/classify` | POST | Clasifica el tema legal del usuario usando Claude. Devuelve slug del tópico. |

### Pagos
| Endpoint | Método | Función |
|---|---|---|
| `/api/create-payment` | POST | Crea Preference en Mercado Pago. Soporta descuentos vía PROMO_CODES. |
| `/api/webpay/create` | POST | Crea transacción en Transbank WebPay Plus. Usa constantes `Environment.Integration/Production` del SDK. |
| `/api/webpay/commit` | GET/POST | Confirma transacción WebPay. Acepta ambos métodos (Transbank redirige con cualquiera). Protegido con env-check + try-catch anidado para Supabase. |
| `/api/verify-payment` | GET | Verifica estado de pago en Mercado Pago. |
| `/api/webhook-mp` | POST | Webhook de notificación de Mercado Pago. |

### Validación y Acceso
| Endpoint | Método | Función |
|---|---|---|
| `/api/validate-promo` | POST | Valida código promocional. Rate limiting doble capa (IP + código específico). FALLBACK_CODES en source. |
| `/api/grant-access` | POST | Activa sesión gratis. Valida UUID de sessionId, try-catch para Supabase. |
| `/api/verify-receipt` | POST | Verifica comprobante de transferencia con Claude Vision (JPG/PNG/WebP). |

### Feedback y Administración
| Endpoint | Método | Función |
|---|---|---|
| `/api/feedback` | POST | Guarda feedback de sesión completa en Supabase. |
| `/api/message-feedback` | POST | 👍👎 feedback por mensaje individual. |
| `/api/admin/feedback` | GET | Lista feedbacks para panel admin. |
| `/api/admin/promos` | GET/POST | CRUD de códigos promocionales desde admin. |
| `/api/admin/promo-stats-internal` | GET | Estadísticas de uso de promos. |

### Debug y Utilidades
| Endpoint | Método | Función |
|---|---|---|
| `/api/dev-session` | POST | Crea sesión de prueba (solo dev, responde 404 en producción). |
| `/api/debug` | GET | Debug de variables de entorno. |
| `/api/research` | POST | Consulta legal actualizada vía búsqueda web. |
| `/api/transcribe` | POST | Transcripción de audio a texto. |
| `/api/cron/keep-alive` | GET | Mantiene Vercel activo (evita cold starts). |

---

## 5. Modelo de Datos (Supabase)

### Tabla `sessions` — Columnas actuales (schema corregido 2026-06-05)

| Columna | Tipo | Descripción |
|---|---|---|
| `session_id` | UUID PK | Identificador único |
| `topic` | TEXT | Tema legal clasificado |
| `history` | JSONB | Historial de conversación |
| `expires_at` | TIMESTAMPTZ | Expiración de sesión (+15min por mensaje) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `status` | TEXT | Estado: `pre_chat`, `pending_payment`, `active`, `completed`, `expired` |
| `receipt_url` | TEXT | URL del comprobante de transferencia |
| `receipt_verified` | BOOLEAN | ¿Comprobante verificado? |
| `receipt_verified_at` | TIMESTAMPTZ | Fecha de verificación |
| `receipt_amount` | INTEGER | Monto del comprobante |
| `payment_method` | TEXT | Método: `webpay`, `mercadopago`, `transferencia`, `free` |
| `payment_id` | TEXT | ID de transacción externa |
| `payment_status` | TEXT | Estado del pago |
| `payment_amount` | INTEGER | Monto pagado |
| `payment_metadata` | JSONB | Metadatos adicionales del pago |

### Otras tablas
- **`leads`**: email, tema, resumen, session_id, converted, followup_sent
- **`message_feedback`**: feedback por mensaje individual
- **`error_logs`**: logs de errores del servidor

---

## 6. Prompts y Reglas de Juanita

### SYSTEM_PROMPT (~380 líneas en `/api/chat/route.js`)

**Reglas críticas que se han perdido en refactors anteriores (restauradas):**

1. **🇨🇱 LOCALÍA ESTRICTA** — Prohíbe mexicanismos, colombianismos, argentinismos, españolismos. Fórmulas chilenas: "¿te tinca?", "al tiro".
2. **✂️ CONCISIÓN Y ESCANEABILIDAD** — Párrafos de 2-3 líneas, ir al grano, negritas en lo clave.
3. **📎 ADJUNTOS QUE NO PUEDES LEER** — Pedir foto o PDF en vez de Word.
4. **🚫 SIN PREÁMBULO EMPÁTICO LARGO** — No empezar con "Qué frustración y con razón". Saludar breve, confirmar tema, hacer primera pregunta directo.

**Estructura del prompt:**
- Identidad inviolable (nunca revelar que es IA)
- 10 áreas legales con conocimiento específico
- Flujo de 3 pasos: escuchar/preguntar → orientar → derivar
- Protocolos de urgencia (VIF, desalojo, plazos fatales)

### Pre-chat (3 intercambios)

El prompt pide que Juanita:
1. Dé **un dato práctico específico** (artículo de ley, paso concreto)
2. NO dé la orientación completa
3. Haga 1 pregunta específica para profundizar
4. Al final, sugiera naturalmente la consulta completa ($4.995)

---

## 7. Precios y Códigos Promocionales

| Concepto | Valor |
|---|---|
| **Precio normal** | $9.990 CLP |
| **Precio lanzamiento** | $4.990 CLP (50% desc., código `LANZAMIENTO`) |
| **Códigos gratis** | `MEJORAMIGO2026`, `AMIGOS2026` |
| **Descuento dinámico** | `DISCOUNT_PRICE` en constants + aplicado vía `PromoWall` |

**⚠️ Los códigos deben existir en 3 archivos:**
1. `api/validate-promo/route.js` — `FALLBACK_CODES`
2. `api/create-payment/route.js` — `PROMO_CODES`
3. `api/grant-access/route.js` — `FALLBACK_FREE_CODES` (solo gratis)

---

## 8. Seguridad y Rate Limiting

| Capa | Implementación |
|---|---|
| **Rate limiter** | In-memory sliding window (`src/lib/rateLimit.js`). Function-local, para multi-instancia migrar a Upstash Redis. |
| **Doble capa** | IP + código específico en `validate-promo` (anti brute-force). |
| **UUID validation** | `grant-access` valida formato UUID v4 del sessionId. Si no es válido, genera uno nuevo en servidor. |
| **Dev endpoints** | Retornan 404 en producción (no 403, para no revelar existencia). |
| **Supabase env-check** | `createClient` envuelto en lazy getter con try-catch anidado. El pago sigue aunque Supabase falle. |
| **Logger** | `src/lib/logger.js` con persistencia a `error_logs` en Supabase. |

---

## 9. Analytics Implementados

| Servicio | ID / Config |
|---|---|
| **Vercel Analytics** | `<Analytics />` nativo |
| **Google Analytics** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` (variable de entorno) |
| **Meta Pixel** | ID: `4472827493005892` |
| **Microsoft Clarity** | ID: `x5gifzhlh9` |

---

## 10. WebPay (Transbank)

### Configuración
```js
import { WebpayPlus, Options, Environment, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk';

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
const ENVIRONMENT = process.env.WEBPAY_COMMERCE_CODE ? Environment.Production : Environment.Integration;
```

### ⚠️ Fixes aplicados

1. **Environment:** NUNCA pasar strings `'INTEGRATION'` / `'LIVE'`. Usar `Environment.Integration` / `Environment.Production` del SDK.
2. **token_ws:** El frontend debe concatenar: `data.url + '?token_ws=' + data.token`.
3. **Commit GET+POST:** Transbank redirige con cualquiera. Exportar ambos handlers.

### Tarjetas de prueba (sandbox)

| Tarjeta | Número | CVV |
|---|---|---|
| VISA | `4051 8856 0044 6623` | `123` |
| Mastercard | `5186 0595 9599 0568` | `123` |

---

## 11. Pitfalls Conocidos (leer antes de modificar)

### 🚨 Vercel deploya solo `master`
El repo tiene `master` como default en GitHub. Pushear a `main` NO despliega. Fix: `git checkout master && git merge main && git push origin master`.

### 🚨 Module-scope `createClient` → crash de build
`const supabase = createClient(...)` a nivel módulo crashea `next build` con `supabaseUrl is required`. **Siempre usar lazy getter**:
```js
let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};
```

### 🚨 Imports faltantes no detectados por el build
Turbopack production NO detecta ReferenceErrors de runtime (hooks de React sin importar, constantes sin importar de `@/lib/constants`). **Siempre auditar con agentes paralelos después de un refactor.**

### 🚨 DOM onclick override — NO REMOVER
`page.jsx` y `ChatSection.jsx` usan `useEffect` con `b.onclick = ...` como workaround de hidratación React. Quitarlos rompe TODOS los botones en mobile y desktop.

### 🚨 PaymentWall: `handlePay` debe saltar directo cuando es gratis
Si `isFree === true`, `handlePay` debe redirigir al chat sin pasar por `PaymentMethodScreen`. Bug real ocurrió en `PaymentWall.jsx` (commit `c7b3420`).

### 🚨 Landing: contar divs al reordenar secciones
Al mover secciones en `HeroSection.jsx`, es fácil perder un `</div>`. El error se manifiesta como `Expression expected` apuntando a `</>` en vez del cierre faltante.
```bash
grep -o '<div' HeroSection.jsx | wc -l
grep -o '</div' HeroSection.jsx | wc -l
```

---

## 12. Video Promocional (YouTube)

- **Skill:** `remotion-video-pipeline`
- **Ubicación:** `/root/projects/youtube-automation-agent/remotion-juanita/`
- **Voz:** `es-CL-CatalinaNeural` (Edge TTS)
- **Color:** `#7C3AED`, gradientes oscuros
- **Animaciones:** spring + iconos SVG
- **NO usar** el approach antiguo (`render-whiteboard-v2.js`, text-on-beige).

---

## 13. Variables de Entorno Requeridas

```env
# Next.js
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase
SUPABASE_URL=https://eviujjepppaelygctylv.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (transcripción)
OPENAI_API_KEY=sk-...

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...

# WebPay Transbank (opcional — sin vars usa Integration/sandbox)
WEBPAY_COMMERCE_CODE=5970XXXXXXX
WEBPAY_API_KEY=XXXXXXXXXXXXXXXXXXXX

# Resend (email)
RESEND_API_KEY=re_...

# Google (verificación)
NEXT_PUBLIC_GOOGLE_VERIFICATION=7Z3FqbFegxzn3F3sSkseZquYCG1TcOgAeWSLahVJJZM
```

---

## 14. Métricas Clave (para diagnóstico)

| Concepto | Valor |
|---|---|
| **Total código fuente** | 6,652 líneas |
| **Componentes** | 20 (chat: 7, payment: 4, landing: 3, ui: 5) |
| **Endpoints API** | 18 |
| **Áreas legales** | 10 (familia, laboral, arriendo, herencia, migración, terrenos, deudas, empresas, contratos, general) |
| **Términos legales en glosario** | 37 |
| **Tiempo de sesión paga** | 10 minutos |
| **Códigos promocionales activos** | 4 (3 gratis + 1 descuento) |
| **Métodos de pago** | 3 (WebPay, Mercado Pago, Transferencia) |

---

> 📅 Generado: 11 de junio de 2026
> 📍 Repositorio local: `/root/juanita-la-legal/`
> 📍 VPS mirror: `root@2.25.174.228:/var/www/juanita-la-legal/`
