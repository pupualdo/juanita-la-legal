import { Fraunces, Instrument_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import Footer from './footer';
import './globals.css';

const META_PIXEL_ID = '4472827493005892';
const CLARITY_ID = 'x5gifzhlh9';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '600'],
  display: 'swap',
  variable: '--font-fraunces',
  preload: true,
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument-sans',
  preload: true,
});

const APP_URL = 'https://juanitalalegal.cl';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Juanita La Legal — Orientación legal en buen chileno',
  description:
    'Orientación legal online en Chile desde $4.995 CLP — precio lanzamiento. Respuesta clara y directa en derecho laboral, familia, arriendo, herencia, deudas y más.',
  keywords: [
    'orientación legal Chile',
    'abogado online Chile',
    'consulta legal barata Chile',
    'asesoría jurídica online',
    'derecho laboral Chile',
    'derecho de familia Chile',
    'consulta arriendo Chile',
    'herencia Chile',
    'deudas cobranzas Chile',
    'juanita la legal',
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: 'Juanita La Legal — Orientación legal en buen chileno',
    description:
      'Orientación legal online en Chile desde $4.995 CLP — precio lanzamiento. Respuesta clara en derecho laboral, familia, arriendo, herencia y más.',
    url: APP_URL,
    siteName: 'Juanita La Legal',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Juanita La Legal — Orientación legal en buen chileno',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juanita La Legal — Orientación legal en buen chileno',
    description:
      'Orientación legal online en Chile desde $4.995 CLP — precio lanzamiento. Respuesta clara y directa.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: '7Z3FqbFegxzn3F3sSkseZquYCG1TcOgAeWSLahVJJZM',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'Juanita La Legal',
  description:
    'Orientación legal online en Chile. Consultas de derecho laboral, familia, arriendo, herencia, deudas y más desde $4.995 CLP — precio lanzamiento.',
  url: APP_URL,
  areaServed: {
    '@type': 'Country',
    name: 'Chile',
  },
  availableLanguage: 'Spanish',
  priceRange: '$',
  serviceType: [
    'Orientación Legal Online',
    'Consulta Legal',
    'Asesoría Jurídica',
    'Derecho Laboral',
    'Derecho de Familia',
    'Arriendo y Vivienda',
    'Herencia y Sucesión',
  ],
  offers: {
    '@type': 'Offer',
    price: '4995',
    priceCurrency: 'CLP',
    description: 'Sesión de orientación legal online. Orientación clara de tu caso, tus derechos y los pasos a seguir.',
    availability: 'https://schema.org/InStock',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios de orientación legal',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta de Derecho Laboral' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta de Derecho de Familia' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta sobre Arriendo y Vivienda' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta de Herencia y Sucesión' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta sobre Deudas y Cobranzas' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consulta sobre Contratos y Consumidor' } },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <head>
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=40&fm=webp"
          fetchPriority="high"
        />
      </head>
      <body style={{ fontFamily: 'var(--font-instrument-sans), system-ui, sans-serif' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        {/* Google Analytics — afterInteractive: carga antes de que el usuario interactúe */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          />
        )}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  debug_mode: false,
                });
              `,
            }}
          />
        )}
        {/* Meta Pixel */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
              fbq('track', 'ViewContent');
            `,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `,
          }}
        />
        <Footer />
      </body>
    </html>
  );
}
