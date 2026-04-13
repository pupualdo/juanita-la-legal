import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.type === 'contact') {
      const { name, phone, email, description, tema, sessionId } = body;
      console.log('Contact request:', { name, phone, email, description, tema, sessionId });
      await supabase
        .from('sessions')
        .update({ feedback: `CONTACTO | ${name} | ${phone} | ${email} | ${description}` })
        .eq('session_id', sessionId);
      return NextResponse.json({ ok: true });
    }

    const { session_id, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating inválido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sessions')
      .update({
        rating: rating,
        feedback: comment || null,
      })
      .eq('session_id', session_id);

    if (error) {
      // Si falla (ej: columnas no existen aún), igual devolvemos éxito
      // para no bloquear al usuario — el feedback es secundario
      console.error('Feedback save error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error al guardar feedback' }, { status: 500 });
  }
}
