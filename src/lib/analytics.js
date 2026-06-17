/**
 * Helper para disparar eventos de analytics.
 * Centraliza Meta Pixel (fbq) y Google Analytics 4 (gtag) en un solo lugar.
 *
 * Uso: trackEvent('StartConsultation', { tema: 'laboral' })
 *
 * Eventos definidos:
 *   ViewContent       — Carga de landing
 *   StartConsultation — Clic en CTA hero
 *   PreChatMessage3   — 3er intercambio completado
 *   PaywallViewed     — Muro de pago visible
 *   AddPaymentInfo    — Usuario eligió método de pago
 *   Purchase          — Pago confirmado
 *   PaymentFailed     — Pago rechazado
 */

const GA4_EVENT_MAP = {
  ViewContent:       'page_view',
  StartConsultation: 'begin_consultation',
  PreChatMessage3:   'prechat_complete',
  PaywallViewed:     'view_paywall',
  AddPaymentInfo:    'add_payment_info',
  Purchase:          'purchase',
  PaymentFailed:     'payment_failed',
};

// Cola para eventos disparados antes de que gtag esté disponible (afterInteractive aún puede tener race condition)
let _gtagQueue = [];
let _gtagReady = false;

function getFbq() {
  return typeof window !== 'undefined' ? window.fbq : null;
}

function getGtag() {
  if (typeof window === 'undefined') return null;
  if (window.gtag) {
    _gtagReady = true;
    return window.gtag;
  }
  return null;
}

function flushGtagQueue() {
  if (_gtagQueue.length === 0) return;
  const gtag = getGtag();
  if (!gtag) return;
  const queue = _gtagQueue;
  _gtagQueue = [];
  for (const { eventName, params } of queue) {
    gtag('event', eventName, params);
  }
}

// Revisar periódicamente si gtag ya cargó y vaciar la cola
if (typeof window !== 'undefined') {
  const interval = setInterval(() => {
    if (getGtag()) {
      _gtagReady = true;
      flushGtagQueue();
      clearInterval(interval);
    }
  }, 500);
  // Safety: dejar de intentar después de 15s
  setTimeout(() => clearInterval(interval), 15000);
}

function getVariantFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)juanita_variant=([^;]*)/);
  return match && ['A', 'B'].includes(match[1]) ? match[1] : null;
}

export function trackEvent(eventName, params = {}) {
  // Inyectar variant A/B automáticamente en todo evento para segmentación
  const variant = getVariantFromCookie();
  const enrichedParams = variant ? { ...params, ab_variant: variant } : params;

  // Meta Pixel (eventos estándar usan track, custom usan trackCustom)
  const fbq = getFbq();
  if (fbq) {
    const STANDARD = ['ViewContent', 'AddPaymentInfo', 'Purchase'];
    if (STANDARD.includes(eventName)) {
      fbq('track', eventName, enrichedParams);
    } else {
      fbq('trackCustom', eventName, enrichedParams);
    }
  }

  // GA4 — con cola de replay para lazyOnload
  const gtag = getGtag();
  const ga4Name = GA4_EVENT_MAP[eventName];
  if (ga4Name) {
    if (gtag) {
      gtag('event', ga4Name, enrichedParams);
    } else {
      // gtag aún no cargó (lazyOnload) — encolar para replay
      _gtagQueue.push({ eventName: ga4Name, params: enrichedParams });
    }
  }

  // Vercel Analytics
  try {
    import('@vercel/analytics').then(({ track }) => {
      track(eventName, params);
    });
  } catch {
    // ignore — analytics no crítico
  }
}
