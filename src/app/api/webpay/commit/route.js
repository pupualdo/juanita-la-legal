import { WebpayPlus, Options, Environment, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
const ENVIRONMENT = process.env.WEBPAY_COMMERCE_CODE ? Environment.Production : Environment.Integration;

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
      new Options(COMMERCE_CODE, API_KEY, ENVIRONMENT)
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

      // Activar sesión en Supabase — usar el sessionId de Transbank
      // Si es null/undefined, buscar por prefijo de buy_order (JLL-XXXXXXXX-...)
      let effectiveSessionId = sessionId;

      if (!effectiveSessionId && buyOrder) {
        const prefix = buyOrder.replace('JLL-', '');
        if (prefix && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          // Buscar sesión que empiece con el prefijo del buy_order
          const { data: found } = await getSupabase()
            .from('sessions')
            .select('session_id')
            .ilike('session_id', `${prefix}%`)
            .maybeSingle();
          effectiveSessionId = found?.session_id || null;
        }
      }

      if (effectiveSessionId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        try {
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          // Solo actualizar status + expires_at + payment info, NO sobrescribir history
          const { error: upsertError } = await getSupabase()
            .from('sessions')
            .upsert({
              session_id: effectiveSessionId,
              status: 'active',
              expires_at: expiresAt,
              payment_method: 'webpay',
              payment_amount: amount,
              payment_id: String(authCode || buyOrder),
              payment_metadata: { auth_code: authCode, card: cardNumber },
            }, { onConflict: 'session_id' });

          if (upsertError) {
            log.error('webpay-commit', 'Error activando sesión', { err: upsertError, sessionId: effectiveSessionId });
          } else {
            log.info('webpay-commit', 'Sesión activada', { sessionId: effectiveSessionId });
          }
        } catch (supaErr) {
          log.error('webpay-commit', 'Supabase no disponible', { err: supaErr?.message });
        }
      } else {
        log.warn('webpay-commit', 'Sin sessionId o Supabase no configurado', { sessionId, buyOrder });
      }

      // Redirigir directo a /?paid=true — la sesión ya está activada en Supabase
      // Saltamos /success porque verify-payment es solo para MercadoPago
      const paidSession = sessionId || '';
      const paidParams = paidSession ? `paid=true&session=${encodeURIComponent(paidSession)}&method=webpay` : 'paid=true&method=webpay';
      return NextResponse.redirect(`${APP_URL}/?${paidParams}`);
    }

    // ── Pago rechazado ──
    log.warn('webpay-commit', 'Pago rechazado', {
      responseCode: response.response_code,
      sessionId: response.session_id,
    });

    return NextResponse.redirect(`${APP_URL}/payment-error?reason=rejected&code=${response.response_code}`);

  } catch (error) {
    const errorMsg = (error?.message || String(error || '')).slice(0, 200);
    const errorName = error?.name || 'UnknownError';
    try { await log.error('webpay-commit', 'Error confirmando transacción', { error: errorMsg, name: errorName, token: tokenWs || 'n/a' }); } catch {}

    // Token expirado es el error más común en sandbox
    const reason = (errorMsg || '').includes('expired') || (errorMsg || '').includes('timeout') || (errorMsg || '').includes('not found')
      ? 'token_expired'
      : 'system';

    return NextResponse.redirect(
      `${APP_URL}/payment-error?reason=${reason}&msg=${encodeURIComponent(errorMsg || 'unknown')}`
    );
  }
}
