import type { NextConfig } from "next";

// Domains used by this app that need explicit CSP allowances
const MP_DOMAIN  = 'https://*.mercadopago.com';
const MP_SDK     = 'https://sdk.mercadopago.com';
const SUPABASE   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co';
const GA_GTM     = 'https://www.googletagmanager.com';
const GA_COLLECT = 'https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com';
const FB_SCRIPT  = 'https://connect.facebook.net';
const FB_COLLECT = 'https://www.facebook.com';
const CLARITY    = 'https://www.clarity.ms https://clarity.ms https://*.clarity.ms';
const CLARITY_C  = 'https://c.bing.com https://c.clarity.ms';

const csp = [
  `default-src 'self'`,
  // Scripts: self + MercadoPago SDK + Google Tag Manager (GA4) + Meta Pixel + Clarity
  `script-src 'self' 'unsafe-inline' ${MP_SDK} ${GA_GTM} ${FB_SCRIPT} ${CLARITY}`,
  // Styles: self + inline (Next.js injects inline styles; Google Fonts if ever added)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,
  // Images: self + data URIs + MP assets + Unsplash (hero bg) + GA beacon + Meta Pixel noscript
  `img-src 'self' data: blob: ${MP_DOMAIN} https://*.mercadolibre.com https://images.unsplash.com https://www.google-analytics.com ${FB_COLLECT} ${CLARITY_C}`,
  // XHR/fetch: self + MP APIs + Supabase + GA4 + Meta Pixel events + Clarity
  `connect-src 'self' ${MP_DOMAIN} ${MP_SDK} ${SUPABASE} https://api.anthropic.com ${GA_GTM} ${GA_COLLECT} ${FB_COLLECT} ${FB_SCRIPT} ${CLARITY}`,
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
  async redirects() {
    return [
      {
        // Dominio canónico: todo el tráfico del dominio de Vercel se redirige
        // permanentemente a juanitalalegal.cl (mismo path), para que sesión,
        // pago y contexto vivan en un solo origen.
        source: '/:path*',
        has: [{ type: 'host', value: 'juanita-la-legal.vercel.app' }],
        destination: 'https://juanitalalegal.cl/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
