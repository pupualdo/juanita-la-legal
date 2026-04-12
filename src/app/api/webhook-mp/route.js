import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  console.log('Webhook MP recibido:', body);
  return NextResponse.json({ ok: true });
}
