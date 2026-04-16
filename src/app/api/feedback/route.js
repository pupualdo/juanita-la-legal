import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const getResend = () => new Resend(process.env.RESEND_API_KEY);

const CONTACT_EMAIL = 'franciscoverar@gmail.com';

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.type === 'contact') {
      const { name, phone, email, description, tema, sessionId } = body;

      // Guardar en Supabase
      await supabase
        .from('sessions')
        .update({ feedback: `CONTACTO | ${name} | ${phone} | ${email} | ${description}` })
        .eq('session_id', sessionId);

      // Enviar email
      await getResend().emails.send({
        from: 'Juanita La Legal <onboarding@resend.dev>',
        to: CONTACT_EMAIL,
        subject: `📋 Nuevo contacto — ${tema ?? 'sin tema'} — ${name}`,
        html: `
          <h2>Nuevo contacto desde Juanita La Legal</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
            <tr><td style="padding:8px;font-weight:bold;color:#555">Nombre</td><td style="padding:8px">${name}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Teléfono</td><td style="padding:8px">${phone}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Tema legal</td><td style="padding:8px">${tema ?? '—'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555;vertical-align:top">Descripción</td><td style="padding:8px;white-space:pre-wrap">${description}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Session ID</td><td style="padding:8px;font-size:12px;color:#888">${sessionId}</td></tr>
          </table>
        `,
      });

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
