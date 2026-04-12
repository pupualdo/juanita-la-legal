import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(request) {
  if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  try {
    const { sessionId } = await request.json();
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: 'dev-bypass',
      expires_at: expiresAt,
    });

    return NextResponse.json({ ok: true, sessionId, expiresAt });
  } catch (error) {
    console.error('Error dev-session:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
