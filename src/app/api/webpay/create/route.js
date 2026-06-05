import { WebpayPlus, Options, Environment, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { log } from '@/lib/logger';

// ── Configuración de entorno ──
// Usa credenciales de integración (sandbox) por defecto.
// En producción, setear WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY en Vercel.
const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
const ENVIRONMENT = process.env.WEBPAY_COMMERCE_CODE ? Environment.Production : Environment.Integration;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://juanitalalegal.cl';

export async function POST(request) {
  try {
    // Rate limit: 5 intentos por minuto por IP
    const ip = getClientIp(request);
    const { allowed, retryAfter } = rateLimit(ip, 'webpay-create', { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { sessionId, amount, topic } = await request.json();

    if (!sessionId || !amount) {
      return NextResponse.json({ error: 'Faltan datos (sessionId, amount).' }, { status: 400 });
    }

    // buyOrder debe ser único: usamos sessionId truncado
    const buyOrder = `JLL-${sessionId.slice(0, 8)}`;
    // sessionId para Transbank (máx 61 chars)
    const tbkSessionId = sessionId.slice(0, 61);
    // Monto en CLP (entero)
    const amountClp = Math.round(Number(amount));

    const returnUrl = `${APP_URL}/api/webpay/commit`;

    log.info('webpay-create', 'Creating WebPay transaction', { sessionId, buyOrder, amount: amountClp });

    const tx = new WebpayPlus.Transaction(
      new Options(COMMERCE_CODE, API_KEY, ENVIRONMENT)
    );

    const response = await tx.create(buyOrder, tbkSessionId, amountClp, returnUrl);

    log.info('webpay-create', 'Transaction created', { token: response.token });

    return NextResponse.json({
      ok: true,
      token: response.token,
      url: response.url,
    });

  } catch (error) {
    await log.error('webpay-create', 'Error creating WebPay transaction', { err: error });
    return NextResponse.json(
      { error: 'Error al iniciar el pago con WebPay. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
