import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const ESTADOS_VALIDOS = ['pagado', 'borrador_generado', 'en_revision', 'aprobado', 'entregado', 'devuelto'];

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (!ADMIN_SECRET || searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { orderId, estado, borrador, notas_revisor, version_final } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const update = {};
    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return NextResponse.json({ error: `Estado inválido: ${estado}` }, { status: 400 });
      }
      update.estado = estado;
      if (estado === 'aprobado') update.approved_at = new Date().toISOString();
      if (estado === 'entregado') update.delivered_at = new Date().toISOString();
    }
    if (borrador !== undefined) update.borrador = borrador;
    if (notas_revisor !== undefined) update.notas_revisor = notas_revisor;
    if (version_final !== undefined) update.version_final = version_final;
    update.updated_at = new Date().toISOString();

    const { error } = await getSupabase().from('orders').update(update).eq('id', orderId);
    if (error) {
      await log.error('orders-update', 'Error actualizando orden', { err: error, orderId });
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }

    log.info('orders-update', 'Orden actualizada', { orderId, estado: update.estado });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await log.error('orders-update', 'Error inesperado', { err: error });
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
