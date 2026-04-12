import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export async function POST(request) {
  try {
    const { tema, resumen, sessionId } = await request.json();

    const preference = new Preference(mp);
    const result = await preference.create({ body: {
      items: [{
        title: `Consulta Legal Juanita La Legal — ${tema}`,
        description: resumen,
        unit_price: 9990,
        quantity: 1,
        currency_id: 'CLP'
      }],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/success?session=${sessionId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment-error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment-error`
      },
      auto_return: 'approved',
      external_reference: sessionId
    }});

    return NextResponse.json({ checkoutUrl: result.init_point });
  } catch (error) {
    console.error('Error create-payment:', error);
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
