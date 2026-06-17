import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Validación de email simple pero estricta (sin librerías).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 'lead', { limit: 8, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas solicitudes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { email, tema, resumen, sessionId } = await request.json();
    const clean = String(email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      return NextResponse.json({ ok: false, error: 'Correo no válido' }, { status: 400 });
    }

    const { error } = await supabase.from('leads').insert({
      email: clean,
      tema: tema ? String(tema).slice(0, 80) : null,
      resumen: resumen ? String(resumen).slice(0, 500) : null,
      session_id: sessionId ? String(sessionId).slice(0, 80) : null,
    });

    if (error) {
      await log.error('lead', 'Supabase insert error', { err: error });
      // No bloqueamos el flujo del usuario por un fallo de persistencia.
      return NextResponse.json({ ok: true, persisted: false });
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    await log.error('lead', 'Unhandled error', { err: error });
    return NextResponse.json({ ok: false, error: 'Error al guardar' }, { status: 500 });
  }
}
