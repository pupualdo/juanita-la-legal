import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(request) {
  // Solo disponible en desarrollo local — bloqueado en Vercel/producción
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  // Rate limiting incluso en dev
  const ip = getClientIp(request);
  const { allowed } = rateLimit(ip, 'dev-session', { limit: 3, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ ok: false, reason: 'missing_session_id' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: 'dev-bypass',
      expires_at: expiresAt,
    });

    return NextResponse.json({ ok: true, sessionId, expiresAt });
  } catch (error) {
    console.error('Error dev-session:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
