import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { log } from '@/lib/logger';
import { CATALOGO } from '@/config/catalogo';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { allowed } = rateLimit(ip, 'orders-create', { limit: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 });
    }

    const { entregable_id, form_data, empresa, rut, razon_social, giro, email } = await request.json();

    const item = CATALOGO.find((c) => c.id === entregable_id);
    if (!item) {
      return NextResponse.json({ error: 'Entregable inválido' }, { status: 400 });
    }
    if (!empresa || !rut || !email) {
      return NextResponse.json({ error: 'Faltan datos de la empresa (empresa, RUT, email)' }, { status: 400 });
    }

    // Crear la orden (estado inicial 'pagado'; el webhook confirma y dispara la generación)
    const { data: order, error } = await getSupabase()
      .from('orders')
      .insert({
        empresa,
        rut,
        razon_social: razon_social || null,
        giro: giro || null,
        email,
        entregable_id,
        form_data: form_data || {},
        estado: 'pagado',
      })
      .select()
      .single();

    if (error) {
      await log.error('orders-create', 'Error creando orden', { err: error });
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
    }

    // Crear preferencia de pago en MercadoPago
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [
          {
            title: `${item.nombre} — ${empresa}`,
            description: item.descripcion.slice(0, 250),
            unit_price: item.precio,
            quantity: 1,
            currency_id: 'CLP',
          },
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/success?order=${order.id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment-error?reason=rejected`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment-pending?order=${order.id}`,
        },
        auto_return: 'approved',
        external_reference: order.id,
      },
    });

    log.info('orders-create', 'Orden y preferencia creadas', { orderId: order.id, entregable: entregable_id });
    return NextResponse.json({ orderId: order.id, checkoutUrl: result.init_point });
  } catch (error) {
    await log.error('orders-create', 'Error inesperado', { err: error });
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
  }
}
