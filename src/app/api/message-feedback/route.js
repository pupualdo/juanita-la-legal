import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/*
  Supabase table (run once in SQL editor):

  create table if not exists message_feedback (
    id            bigserial primary key,
    session_id    text,
    message_id    text,
    vote          text check (vote in ('up','down')),
    comment       text,
    message_preview text,
    created_at    timestamptz default now()
  );
*/

export async function POST(request) {
  try {
    const { session_id, message_id, vote, comment, message_preview } = await request.json();

    if (!vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Vote inválido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('message_feedback')
      .insert({
        session_id: session_id || null,
        message_id: message_id || null,
        vote,
        comment: comment || null,
        message_preview: message_preview || null,
      });

    if (error) {
      // Tabla aún no creada u otro error — no bloqueamos al usuario
      console.error('Message feedback save error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Message feedback error:', err);
    return NextResponse.json({ error: 'Error al guardar feedback' }, { status: 500 });
  }
}
