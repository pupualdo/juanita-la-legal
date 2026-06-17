import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Fallback hardcoded (por si Supabase no está disponible)
const FALLBACK_CODES = {
  AMIGOS2026:  { discount: 100 },
  LANZAMIENTO: { discount: 50 },
  VUELVE70:    { discount: 70 },
  JUANITA10:   { discount: 10 },
};

export async function POST(request) {
  const { code } = await request.json();
  const clean = String(code).toUpperCase().trim();

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

      const { data } = await supabase
        .from('promo_codes')
        .select('discount, max_uses, used_count, session_minutes, expires_at')
        .eq('code', clean)
        .single();

      if (data) {
        // Código vencido
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          return NextResponse.json({ valid: false, reason: 'expirado' });
        }

        // Código agotado (max_uses 0 = sin límite, 9999 = ilimitado en UI)
        if (data.max_uses > 0 && data.max_uses < 9999 && data.used_count >= data.max_uses) {
          return NextResponse.json({ valid: false, reason: 'agotado' });
        }

        // Incrementar contador de usos (best-effort)
        supabase
          .from('promo_codes')
          .update({ used_count: (data.used_count ?? 0) + 1 })
          .eq('code', clean)
          .then(() => {});

        const label = data.discount === 100 ? '100% gratis' : `${data.discount}% descuento`;
        return NextResponse.json({ valid: true, discount: data.discount, label });
      }
    } catch {
      // Supabase no disponible — usar fallback
    }
  }

  // Fallback hardcoded
  const entry = FALLBACK_CODES[clean];
  if (!entry) return NextResponse.json({ valid: false });
  const label = entry.discount === 100 ? '100% gratis' : `${entry.discount}% descuento`;
  return NextResponse.json({ valid: true, discount: entry.discount, label });
}
