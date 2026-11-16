import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { generarDocx, generarPdf } from '@/lib/document';
import { CATALOGO } from '@/config/catalogo';
import { log } from '@/lib/logger';

export const maxDuration = 60;

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (!ADMIN_SECRET || searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });

    const { data: order } = await getSupabase().from('orders').select('*').eq('id', orderId).single();
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    if (order.estado !== 'aprobado') {
      return NextResponse.json({ error: `La orden debe estar "aprobada", está "${order.estado}"` }, { status: 409 });
    }

    const contenido = order.version_final || order.borrador || '';
    const item = CATALOGO.find((c) => c.id === order.entregable_id);
    const nombreDoc = item?.nombre || order.entregable_id;

    // Generar .docx y PDF
    const [docxBuf, pdfBuf] = await Promise.all([generarDocx(contenido), generarPdf(contenido)]);

    // Enviar por Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: order.email,
      subject: `Tu documento "${nombreDoc}" está listo — Juanita La Legal`,
      html: `
        <p>Hola ${order.empresa},</p>
        <p>Tu documento <strong>${nombreDoc}</strong> está listo y revisado por abogado.</p>
        <p>Adjuntamos el archivo en formato .docx y PDF para que lo uses como necesites.</p>
        <p>Gracias por confiar en Juanita La Legal.</p>
      `,
      attachments: [
        { filename: `${order.entregable_id}.docx`, content: docxBuf.toString('base64') },
        { filename: `${order.entregable_id}.pdf`, content: pdfBuf.toString('base64') },
      ],
    });

    if (sendError) {
      await log.error('orders-deliver', 'Error enviando email', { err: sendError, orderId });
      return NextResponse.json({ error: 'Error enviando el correo' }, { status: 500 });
    }

    // Marcar como entregado
    await getSupabase()
      .from('orders')
      .update({
        version_final: contenido,
        estado: 'entregado',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    log.info('orders-deliver', 'Documento entregado', { orderId, email: order.email });
    return NextResponse.json({ ok: true, estado: 'entregado' });
  } catch (error) {
    await log.error('orders-deliver', 'Error inesperado', { err: error });
    return NextResponse.json({ error: 'Error al entregar' }, { status: 500 });
  }
}
