import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function auth(request) {
  const { searchParams } = new URL(request.url);
  return ADMIN_SECRET && searchParams.get('secret') === ADMIN_SECRET;
}

// GET — list all (requires secret)
export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data, error } = await getSupabase()
    .from('promo_codes')
    .select('*')
    .order('discount', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promos: data });
}

// POST — create new code
export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { code, discount, max_uses, session_minutes } = await request.json();
  if (!code || typeof discount !== 'number' || discount < 1 || discount > 100) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const cleanCode = String(code).toUpperCase().trim();
  const { data, error } = await getSupabase()
    .from('promo_codes')
    .insert({ code: cleanCode, discount, max_uses: max_uses ?? 9999, used_count: 0, session_minutes: session_minutes ?? 10 })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ promo: data }, { status: 201 });
}

// DELETE — remove a code
export async function DELETE(request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'Falta code' }, { status: 400 });
  const { error } = await getSupabase().from('promo_codes').delete().eq('code', String(code).toUpperCase().trim());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
