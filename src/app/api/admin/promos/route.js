import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function supabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function auth(request) {
  const { searchParams } = new URL(request.url);
  return ADMIN_SECRET && searchParams.get('secret') === ADMIN_SECRET;
}

// GET — list all promo codes
export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabase()
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promos: data });
}

// POST — create a new promo code
export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { code, discount, label } = await request.json();

  if (!code || typeof discount !== 'number' || discount < 1 || discount > 100) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const cleanCode = String(code).toUpperCase().trim();

  const { data, error } = await supabase()
    .from('promo_codes')
    .insert({ code: cleanCode, discount, label: label || `${discount}% descuento` })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promo: data }, { status: 201 });
}

// PATCH — toggle active / update
export async function PATCH(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id, active } = await request.json();
  if (id == null) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const { data, error } = await supabase()
    .from('promo_codes')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promo: data });
}

// DELETE — remove a promo code
export async function DELETE(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await request.json();
  if (id == null) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const { error } = await supabase().from('promo_codes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
