import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const sessionId = searchParams.get('session');
    const status    = searchParams.get('status');

    // Polling path: payment-pending page checks if the webhook already granted access
    if (status === 'check_session') {
      if (!sessionId) {
        return NextResponse.json({ ok: false, reason: 'no_session' });
      }
      const { data } = await supabase
        .from('sessions')
        .select('expires_at')
        .eq('session_id', sessionId)
        .single();

      const active = data?.expires_at && new Date(data.expires_at) > new Date();
      return NextResponse.json({ ok: !!active });
    }

    // Direct redirect path: user comes back from MP with status=approved in URL
    if (status !== 'approved') {
      return NextResponse.json({ ok: false, reason: 'not_approved' });
    }

    const payment = new Payment(mp);
    const mpData  = await payment.get({ id: paymentId });

    if (mpData.status !== 'approved') {
      return NextResponse.json({ ok: false, reason: 'mp_not_approved' });
    }

    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: paymentId,
      paid_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    return NextResponse.json({ ok: true, sessionId, expiresAt });
  } catch (error) {
    console.error('Error verify-payment:', error);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
