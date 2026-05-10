import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Fallback codes (always valid, even if Supabase is down)
const FALLBACK_CODES = {
  AMIGOS2026:  { discount: 100, label: '100% gratis' },
  LANZAMIENTO: { discount: 50,  label: '50% descuento' },
  JUANITA10:   { discount: 10,  label: '10% descuento' },
};

export async function POST(request) {
  const { code } = await request.json();
  const clean = String(code).toUpperCase().trim();

  // 1. Try Supabase promo_codes table
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data } = await supabase
        .from('promo_codes')
        .select('discount, label, active')
        .eq('code', clean)
        .single();

      if (data) {
        if (!data.active) return NextResponse.json({ valid: false });
        return NextResponse.json({ valid: true, discount: data.discount, label: data.label });
      }
    } catch {
      // Supabase unavailable — fall through to hardcoded list
    }
  }

  // 2. Fallback to hardcoded list
  const entry = FALLBACK_CODES[clean];
  if (!entry) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, discount: entry.discount, label: entry.label });
}
