import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://juanitalalegal.cl';

export async function GET(request) {
  return handleCommit(request);
}

export async function POST(request) {
  return handleCommit(request);
}

async function handleCommit(request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);

    const tokenWs = params['token_ws'];
    const tbkToken = params['TBK_TOKEN'];
    const tbkOrdenCompra = params['TBK_ORDEN_COMPRA'];
    const tbkIdSession = params['TBK_ID_SESSION'];

    // ── Timeout o sesión expirada ──
    if (!tokenWs && !tbkToken) {
      log.warn('webpay-commit', 'Timeout — sin token', { tbkOrdenCompra, tbkIdSession });
      return NextResponse.redirect(`${APP_URL}/payment-error?reason=timeout`);
    }

    // ── Usuario abortó el pago ──
    if (tbkToken && !tokenWs) {
      log.info('webpay-commit', 'Pago abortado por usuario', { tbkToken, tbkOrdenCompra });
      return NextResponse.redirect(`${APP_URL}/payment-error?reason=abort`);
    }

    // ── Confirmar transacción ──
    log.info('webpay-commit', 'Confirmando transacción', { token: tokenWs });

    const tx = new WebpayPlus.Transaction(
      new Options(COMMERCE_CODE, API_KEY, process.env.WEBPAY_COMMERCE_CODE ? 'LIVE' : 'INTEGRATION')
    );

    const response = await tx.commit(tokenWs);

    // ── Pago aprobado ──
    if (response.response_code === 0) {
      const sessionId = response.session_id;
      const buyOrder = response.buy_order;
      const amount = response.amount;
      const authCode = response.authorization_code;
      const cardNumber = response.card_detail?.card_number || '';

      log.info('webpay-commit', 'Pago aprobado', { sessionId, buyOrder, amount, authCode });

      // Activar sesión en Supabase (si existe)
      if (sessionId) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const { error: upsertError } = await supabase
          .from('sessions')
          .upsert({
            session_id: sessionId,
            status: 'active',
            expires_at: expiresAt,
            payment_method: 'webpay',
            payment_amount: amount,
            payment_auth_code: authCode,
            payment_card: cardNumber,
            created_at: new Date().toISOString(),
            history: [],
          }, { onConflict: 'session_id' });

        if (upsertError) {
          log.error('webpay-commit', 'Error activando sesión en Supabase', { err: upsertError, sessionId });
          // No bloqueamos — redirigimos igual con el sessionId
        }
      }

      // Redirigir al success page con el sessionId
      return NextResponse.redirect(`${APP_URL}/success?session=${sessionId || ''}&method=webpay`);
    }

    // ── Pago rechazado ──
    log.warn('webpay-commit', 'Pago rechazado', {
      responseCode: response.response_code,
      sessionId: response.session_id,
    });

    return NextResponse.redirect(`${APP_URL}/payment-error?reason=rejected&code=${response.response_code}`);

  } catch (error) {
    await log.error('webpay-commit', 'Error confirmando transacción', { err: error });
    return NextResponse.redirect(`${APP_URL}/payment-error?reason=system`);
  }
}
