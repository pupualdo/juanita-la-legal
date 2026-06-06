import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { randomUUID } from 'crypto';

// Fallback hardcoded — códigos 100% gratis que existen aunque Supabase caiga
const FALLBACK_FREE_CODES = ['AMIGOS2026', 'MEJORAMIGO2026'];

export async function POST(request) {
  try {
    // Rate limiting: 5 req/min por IP
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 'grant-access', { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ ok: false, reason: 'too_many_requests', retryAfter }, { status: 429 });
    }

    const { sessionId: clientSessionId, promoCode } = await request.json();

    if (!promoCode) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 });
    }

    // Generar sessionId en el servidor — no aceptar IDs del cliente
    // Si el cliente manda uno, lo ignoramos por seguridad
    const sessionId = randomUUID();

    const clean = String(promoCode).toUpperCase().trim();

    // Verificar que el código sea 100% (gratis) — primero en Supabase, luego fallback
    let isFree = false;
    let sessionMinutes = null; // null = usar default (3h)

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const { data } = await supabase
          .from('promo_codes')
          .select('discount, max_uses, used_count, session_minutes')
          .eq('code', clean)
          .single();

        if (data) {
          // Código agotado
          if (data.max_uses > 0 && data.max_uses < 9999 && data.used_count >= data.max_uses) {
            return NextResponse.json({ ok: false, reason: 'agotado' }, { status: 403 });
          }
          isFree = data.discount === 100;
          sessionMinutes = data.session_minutes ?? null;
        }
      } catch {
        // Supabase no disponible — usar fallback
      }
    }

    if (!isFree && !FALLBACK_FREE_CODES.includes(clean)) {
      return NextResponse.json({ ok: false, reason: 'not_free_promo' }, { status: 403 });
    }

    // Default: 3 horas (igual que webhook-mp y verify-payment para que las sesiones
    // pagadas y las gratis tengan el mismo comportamiento de reconexión)
    const durationMs = sessionMinutes ? sessionMinutes * 60 * 1000 : 3 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: `promo_${clean}`,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('Error grant-access supabase:', error);
      return NextResponse.json({ ok: false, reason: 'db_error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sessionId, expiresAt });
  } catch (error) {
    console.error('Error grant-access:', error);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
