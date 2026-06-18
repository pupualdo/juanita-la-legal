import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { log } from '@/lib/logger';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId requerido' }, { status: 400 });
    }

    // Validar formato UUID
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(String(sessionId))) {
      return NextResponse.json({ ok: false, error: 'sessionId inválido' }, { status: 400 });
    }

    // Activar sesión en Supabase (si está disponible)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const { error } = await supabase.from('sessions').upsert({
          session_id: sessionId,
          status: 'active',
          expires_at: expiresAt,
          updated_at: now,
        }, { onConflict: 'session_id' });

        if (error) {
          log.error('activate-session', 'Error upserting session', { sessionId, error });
          // No fallar — la sesión puede existir ya
        }

        log.info('activate-session', 'Session activated', { sessionId });
      } catch (supaErr) {
        log.error('activate-session', 'Supabase unavailable, continuing', { sessionId, err: supaErr?.message });
        // Continuar aunque Supabase no esté — el chat tiene fallbacks
      }
    }

    return NextResponse.json({ ok: true, sessionId });
  } catch (error) {
    log.error('activate-session', 'Unexpected error', { err: error?.message });
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
