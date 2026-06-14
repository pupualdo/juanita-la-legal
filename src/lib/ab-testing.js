/**
 * A/B testing utility — lee la variant actual (A o B).
 * Funciona en cliente (document.cookie) y servidor (cookie header).
 */

const COOKIE_NAME = 'juanita_variant';

/**
 * Lee la variant desde cookies (cliente o servidor).
 * @param {string} [cookieHeader] — header de cookie del request (servidor)
 * @returns {'A'|'B'|null}
 */
export function getVariant(cookieHeader) {
  const raw = cookieHeader || (typeof document !== 'undefined' ? document.cookie : '');
  if (!raw) return null;

  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match && ['A', 'B'].includes(match[1]) ? match[1] : null;
}

/**
 * Devuelve la variant o un default ('A') para evitar null checks.
 * @param {'A'|'B'} [fallback='A']
 * @returns {'A'|'B'}
 */
export function getVariantOr(fallback = 'A', cookieHeader) {
  return getVariant(cookieHeader) || fallback;
}
