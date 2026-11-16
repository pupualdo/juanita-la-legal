import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!ADMIN_SECRET || searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const estado = searchParams.get('estado');
    let query = getSupabase()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error('orders-list error:', err);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
