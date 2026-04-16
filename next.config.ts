import type { NextConfig } from "next";

// Domains used by this app that need explicit CSP allowances
const MP_DOMAIN = 'https://*.mercadopago.com';
const MP_SDK    = 'https://sdk.mercadopago.com';
const SUPABASE  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co';

const csp = [
  `default-src 'self'`,
  // Scripts: self + MercadoPago SDK (loaded client-side for checkout)
  `script-src 'self' 'unsafe-inline' ${MP_SDK}`,
  // Styles: self + inline (Next.js injects inline styles; Google Fonts if ever added)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,
  // Images: self + data URIs (avatars / base64 previews) + MP assets
  `img-src 'self' data: blob: ${MP_DOMAIN} https://*.mercadolibre.com`,
  // XHR/fetch: self + MP APIs + Supabase
  `connect-src 'self' ${MP_DOMAIN} ${MP_SDK} ${SUPABASE} https://api.anthropic.com`,
  // Media (voice transcription blob URLs)
  `media-src 'self' blob:`,
  // Workers (audio processing)
  `worker-src 'self' blob:`,
  // No frames from unknown origins
  `frame-src 'self' ${MP_DOMAIN} https://*.mercadolibre.com`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' ${MP_DOMAIN}`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy',         value: csp },
  { key: 'Strict-Transport-Security',       value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',          value: 'nosniff' },
  { key: 'X-Frame-Options',                 value: 'DENY' },
  { key: 'Referrer-Policy',                 value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',              value: 'camera=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
