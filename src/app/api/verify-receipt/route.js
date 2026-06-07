import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

export const maxDuration = 30;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt');
    const sessionId = formData.get('sessionId');
    const expectedAmount = parseInt(formData.get('expectedAmount') || '4995', 10);

    if (!file || !sessionId) {
      return NextResponse.json({ ok: false, error: 'Falta el comprobante o la sesión.' }, { status: 400 });
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Formato no soportado. Usa JPG, PNG o PDF.' }, { status: 400 });
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'El archivo es muy grande (máx 10MB).' }, { status: 400 });
    }

    // Convertir a base64 para enviar a la API de visión
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type;

    // ── Analizar comprobante con Claude Vision ──
    const visionResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.JUANITA_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: 'Eres un verificador de comprobantes de pago. Analizas imágenes de transferencias bancarias chilenas y extraes la información relevante. Responde SIEMPRE en JSON crudo, sin markdown, sin explicaciones.',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Analiza esta imagen de comprobante de transferencia bancaria chilena. Responde ÚNICAMENTE con un JSON en este formato exacto:
{
  "isReceipt": true/false,
  "amount": número (monto detectado en pesos chilenos, null si no se ve),
  "date": "fecha en formato YYYY-MM-DD o null",
  "reference": "número de referencia u operación o null",
  "bank": "nombre del banco o null",
  "confidence": "high/medium/low"
}

Reglas:
- isReceipt debe ser true si la imagen claramente muestra un comprobante de transferencia/pago. false si es otra cosa (un meme, una foto random, etc.)
- amount es el monto en PESOS CHILENOS (si ves "$4.995" o "4.995", el valor es 4995. Si ves "4995", es 4995)
- Si no puedes determinar algo con certeza, pon null
- NO incluyas markdown, solo el JSON crudo`
            }
          ],
        }],
      }),
    });

    if (!visionResponse.ok) {
      console.error('Vision API error:', visionResponse.status);
      return NextResponse.json({ ok: false, error: 'Error al analizar el comprobante. Intenta de nuevo.' }, { status: 500 });
    }

    const visionData = await visionResponse.json();
    const rawText = visionData?.content?.[0]?.text || '';
    
    // Extraer JSON de la respuesta
    let analysis;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    if (!analysis || !analysis.isReceipt) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No se pudo identificar un comprobante válido en la imagen. Asegúrate de que se vea claramente el monto y la fecha.',
        analysis 
      }, { status: 400 });
    }

    // ── Validar monto ──
    const tolerance = 500; // ±$500 de tolerancia
    if (!analysis.amount || Math.abs(analysis.amount - expectedAmount) > tolerance) {
      return NextResponse.json({
        ok: false,
        error: `El monto detectado ($${analysis.amount?.toLocaleString('es-CL') || '?'}) no coincide con el esperado ($${expectedAmount.toLocaleString('es-CL')}).`,
        analysis,
      }, { status: 400 });
    }

    // ── Subir comprobante a Supabase Storage ──
    const fileName = `receipts/${sessionId}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
    const { error: uploadError } = await getSupabase().storage
      .from('receipts')
      .upload(fileName, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // No bloqueamos — continuamos igual
    }

    const receiptUrl = uploadError ? null : `${process.env.SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;

    // ── Activar sesión ──
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
    const { error: sessionError } = await getSupabase()
      .from('sessions')
      .upsert({
        session_id: sessionId,
        status: 'active',
        expires_at: expiresAt,
        receipt_url: receiptUrl,
        receipt_analysis: analysis,
        receipt_amount: analysis.amount,
        receipt_date: analysis.date,
        payment_method: 'transfer',
        created_at: new Date().toISOString(),
        history: [],
      }, { onConflict: 'session_id' });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ ok: false, error: 'Error al activar la sesión. Intenta de nuevo.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      analysis,
      message: '✅ Comprobante verificado. Acceso activado.',
    });

  } catch (err) {
    console.error('verify-receipt error:', err);
    return NextResponse.json({ ok: false, error: 'Error inesperado. Intenta de nuevo.' }, { status: 500 });
  }
}
