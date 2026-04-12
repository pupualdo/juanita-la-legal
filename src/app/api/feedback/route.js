import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(request) {
  try {
    const { session_id, rating, comment } = await request.json();

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
