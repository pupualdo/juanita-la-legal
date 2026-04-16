/**
 * In-memory sliding-window rate limiter.
 *
 * Works per Vercel function instance. Good enough to stop accidental loops
 * and casual abuse. For stricter limits use Upstash Redis + @upstash/ratelimit.
 *
 * Usage:
 *   const { allowed, retryAfter } = rateLimit(ip, 'chat', { limit: 20, windowMs: 60_000 });
 *   if (!allowed) return Response 429
 */

// Map<key, number[]>  — key = `${namespace}:${identifier}`
const store = new Map();

// Prune entries older than 5 minutes every 5 minutes to avoid memory leaks
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [key, timestamps] of store.entries()) {
    const trimmed = timestamps.filter(t => t > cutoff);
    if (trimmed.length === 0) store.delete(key);
    else store.set(key, trimmed);
  }
}, 5 * 60 * 1000);

/**
 * @param {string} identifier  — IP address or session ID
 * @param {string} namespace   — route name, e.g. 'chat' | 'create-payment'
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(identifier, namespace, { limit, windowMs }) {
  const key = `${namespace}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(key) ?? []).filter(t => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return { allowed: true, remaining: limit - timestamps.length, retryAfter: 0 };
}

/**
 * Extract the real client IP from a Next.js request.
 * Vercel sets x-forwarded-for; falls back to a static string so dev never breaks.
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
