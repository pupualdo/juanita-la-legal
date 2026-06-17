import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { log } from '@/lib/logger';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const BASE_PRICE = 9990; // CLP

// Fallback hardcoded (si Supabase no está disponible)
const FALLBACK_CODES = {
  MEJORAMIGO2026: { discount: 100 },
  LANZAMIENTO:    { discount: 50  },
  VUELVE70:       { discount: 70  },
  JUANITA10:      { discount: 10  },
};

async function getPromoDiscount(code) {
  if (!code) return null;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data } = await supabase
        .from('promo_codes')
        .select('discount, max_uses, used_count, expires_at')
        .eq('code', code)
        .single();
      if (data) {
        if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
        if (data.max_uses > 0 && data.max_uses < 9999 && data.used_count >= data.max_uses) return null;
        return data.discount;
      }
    } catch { /* fallback */ }
  }
  return FALLBACK_CODES[code]?.discount ?? null;
}

export async function POST(request) {
  try {
    // Rate limit: 5 payment attempts per minute per IP
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 'create-payment', { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de pago. Espera un momento e intenta de nuevo.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { tema, resumen, sessionId, promoCode } = await request.json();

    // Server-side promo validation — never trust the client-reported price
    const normalizedCode = promoCode ? String(promoCode).toUpperCase().trim() : null;
    const discount = normalizedCode ? await getPromoDiscount(normalizedCode) : null;
    const unitPrice = discount != null
      ? Math.max(1, Math.round(BASE_PRICE * (1 - discount / 100))) // min 1 CLP so MP accepts it
      : BASE_PRICE;

    log.info('create-payment', 'Creating preference', { sessionId, promoCode: normalizedCode, unitPrice });

    // Trim env var to guard against accidental trailing newlines stored in Vercel
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://juanita-la-legal.vercel.app')
      .replace(/\\n/g, '')
      .trim();

    const preference = new Preference(mp);
    const result = await preference.create({ body: {
      items: [{
        title: `Consulta Legal Juanita La Legal — ${tema}`,
        description: resumen,
        unit_price: unitPrice,
        quantity: 1,
        currency_id: 'CLP',
      }],
      back_urls: {
        success: `${appUrl}/success?session=${sessionId}`,
        failure: `${appUrl}/payment-error`,
        pending: `${appUrl}/payment-pending?session=${sessionId}`,
      },
      auto_return: 'approved',
      external_reference: sessionId,
    }});

    return NextResponse.json({ checkoutUrl: result.init_point });
  } catch (error) {
    await log.error('create-payment', 'Error creating MP preference', { err: error });
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
