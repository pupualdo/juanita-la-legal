import { NextResponse } from 'next/server';

const PROMO_CODES = {
  AMIGOS2026:  { discount: 100, label: '100% gratis' },
  LANZAMIENTO: { discount: 50,  label: '50% descuento' },
  JUANITA10:   { discount: 10,  label: '10% descuento' },
};

export async function POST(request) {
  const { code } = await request.json();
  const entry = PROMO_CODES[String(code).toUpperCase().trim()];
  if (!entry) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  return NextResponse.json({ valid: true, discount: entry.discount, label: entry.label });
}
