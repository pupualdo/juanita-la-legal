import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const PROMO_CODES_FREE = ['AMIGOS2026'];

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(request) {
  try {
    const { sessionId, promoCode } = await request.json();

    if (!sessionId || !promoCode) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 });
    }

    if (!PROMO_CODES_FREE.includes(String(promoCode).toUpperCase().trim())) {
      return NextResponse.json({ ok: false, reason: 'not_free_promo' }, { status: 403 });
    }

    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: `promo_${promoCode.toUpperCase()}`,
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
