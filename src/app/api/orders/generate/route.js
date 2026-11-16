import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getTemplate, getChecklist } from '@/lib/templates';
import { log } from '@/lib/logger';

export const maxDuration = 120;

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const REDACTOR_SYSTEM = `Eres un redactor de documentos legales para micro y pequeñas empresas chilenas.
Completa la plantilla con los datos reales del caso que se te entregan.

REGLAS ESTRICTAS:
- Reemplaza SOLO los placeholders {{campo}} con el dato correspondiente del formulario.
- Las secciones que dicen "PENDIENTE REVISIÓN ABOGADO" déjalas EXACTAMENTE igual, sin tocar ni rellenar.
- NO inventes contenido legal: no cites leyes, artículos, plazos ni montos que no estén en la plantilla ni en los datos del caso.
- Español chileno, tuteo, sin voseo, sin corchetes, sin mexicanismos ni españolismos.
- Devuelve el documento completo en Markdown, sin explicaciones ni comentarios adicionales.`;

const REVISOR_SYSTEM = `Eres un revisor de documentos legales. Revisa el borrador contra el checklist que se te entrega.
Detecta: placeholders {{...}} sin reemplazar, datos faltantes o inconsistentes, secciones vacías.
Devuelve SOLO un texto con las observaciones, una por línea. Si todo está correcto, responde exactamente "Sin observaciones".`;

async function redactar(anthropic, template, formData) {
  const user = `DATOS DEL CASO (JSON):\n${JSON.stringify(formData, null, 2)}\n\nPLANTILLA A COMPLETAR:\n${template}`;
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: REDACTOR_SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function revisar(anthropic, borrador, entregableId) {
  const checklist = getChecklist(entregableId);
  const user = `CHECKLIST:\n${checklist.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nBORRADOR:\n${borrador}`;
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: REVISOR_SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

export async function POST(request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const { data: order } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    // Solo genera sobre órdenes pagadas (evita generar borradores sin pago)
    if (order.estado !== 'pagado') {
      return NextResponse.json({ error: `La orden está en estado "${order.estado}", no "pagado"` }, { status: 409 });
    }

    const template = getTemplate(order.entregable_id);
    if (!template) {
      await log.error('orders-generate', 'Plantilla no encontrada', { entregable: order.entregable_id });
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.JUANITA_ANTHROPIC_KEY });

    // Paso 1: redactor completa la plantilla
    log.info('orders-generate', 'Redactando borrador', { orderId });
    const borrador = await redactar(anthropic, template, order.form_data);

    // Paso 2: revisor valida y deja observaciones para el abogado
    log.info('orders-generate', 'Revisando borrador', { orderId });
    const observaciones = await revisar(anthropic, borrador, order.entregable_id);

    // Guardar borrador + observaciones, pasar a cola de revisión
    const { error } = await getSupabase()
      .from('orders')
      .update({
        borrador,
        notas_revisor: observaciones,
        estado: 'en_revision',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      await log.error('orders-generate', 'Error guardando borrador', { err: error, orderId });
      return NextResponse.json({ error: 'Error guardando borrador' }, { status: 500 });
    }

    log.info('orders-generate', 'Borrador generado y en revisión', { orderId });
    return NextResponse.json({ ok: true, estado: 'en_revision' });
  } catch (error) {
    await log.error('orders-generate', 'Error inesperado', { err: error });
    return NextResponse.json({ error: 'Error al generar el borrador' }, { status: 500 });
  }
}
