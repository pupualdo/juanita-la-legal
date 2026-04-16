import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export const maxDuration = 60;

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 horas

export async function POST(request) {
  try {
    const body = await request.json();
    log.info('webhook-mp', 'Webhook recibido', { type: body.type, topic: body.topic, action: body.action });

    // MP envía type="payment" para notificaciones de pago
    // También puede venir como "action":"payment.updated" o "topic":"payment"
    const isPaymentEvent =
      body.type === 'payment' ||
      body.topic === 'payment' ||
      body.action?.startsWith('payment.');

    if (!isPaymentEvent) {
      log.info('webhook-mp', 'Tipo ignorado', { type: body.type, topic: body.topic });
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id || body.id;
    if (!paymentId) {
      await log.error('webhook-mp', 'Sin payment ID en body', { body });
      return NextResponse.json({ ok: true });
    }

    // Verificar el pago directamente con la API de MP
    const paymentClient = new Payment(mp);
    const mpData = await paymentClient.get({ id: paymentId });

    log.info('webhook-mp', 'Payment consultado', {
      paymentId,
      status: mpData.status,
      externalReference: mpData.external_reference,
    });

    if (mpData.status !== 'approved') {
      // Pago pendiente o rechazado — MP enviará otro webhook cuando cambie
      return NextResponse.json({ ok: true });
    }

    const sessionId = mpData.external_reference;
    if (!sessionId) {
      await log.error('webhook-mp', 'Pago aprobado sin external_reference', { paymentId });
      return NextResponse.json({ ok: true });
    }

    // Verificar que no se haya procesado ya este pago
    const { data: existing } = await supabase
      .from('sessions')
      .select('payment_id')
      .eq('session_id', sessionId)
      .single();

    if (existing?.payment_id === String(paymentId)) {
      log.info('webhook-mp', 'Pago ya procesado (duplicado)', { paymentId, sessionId });
      return NextResponse.json({ ok: true });
    }

    // Conceder acceso
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    const { error } = await supabase.from('sessions').upsert({
      session_id: sessionId,
      payment_id: String(paymentId),
      paid_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    if (error) {
      await log.error('webhook-mp', 'Error Supabase al conceder acceso', { err: error, sessionId, paymentId });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    log.info('webhook-mp', 'Acceso concedido', { sessionId, paymentId, expiresAt });
    return NextResponse.json({ ok: true });

  } catch (err) {
    await log.error('webhook-mp', 'Error inesperado', { err });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
