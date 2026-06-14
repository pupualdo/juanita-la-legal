import { NextRequest, NextResponse } from 'next/server';

// 50/50 split: A o B
const VARIANTS = ['A', 'B'];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const cookieName = 'juanita_variant';

  let variant = request.cookies.get(cookieName)?.value;

  // Asignar variant en primera visita
  if (!variant || !VARIANTS.includes(variant)) {
    variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    response.cookies.set(cookieName, variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 días — mismo usuario ve la misma variant
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  }

  // Forward variant como header para que server components/API routes la lean
  response.headers.set('x-juanita-variant', variant);

  return response;
}

export const config = {
  matcher: [
    // Solo rutas de página (no assets, api, next internals)
    '/((?!api|_next/static|_next/image|favicon.ico|juanita-avatar.jpg).*)',
  ],
};
