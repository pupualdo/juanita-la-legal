import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { log } from '@/lib/logger';
import { CATALOGO } from '@/config/catalogo';
import { evaluarDiagnostico } from '@/config/diagnostico';

let _supabase = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const { allowed } = rateLimit(ip, 'diagnostico', { limit: 10, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
    }

    const { respuestas, email, empresa, rut } = await request.json();
    if (!respuestas || typeof respuestas !== 'object') {
      return NextResponse.json({ error: 'Respuestas requeridas' }, { status: 400 });
    }

    const resultado = evaluarDiagnostico(respuestas);

    // Mapear entregables recomendados al catálogo (nombre, precio, plazo)
    const entregables = resultado.entregables
      .map((id) => {
        const item = CATALOGO.find((c) => c.id === id);
        return item
          ? { id: item.id, nombre: item.nombre, emoji: item.emoji, precio: item.precio, plazo: item.plazo }
          : null;
      })
      .filter(Boolean);

    const completo = Boolean(email && empresa && rut);

    if (completo) {
      try {
        await getSupabase().from('leads').insert({
          email,
          empresa,
          rut,
          nombre_contacto: empresa,
          tema: 'b2b-diagnostico',
          resumen: resultado.carencias.map((c) => c.titulo).join(', ') || 'Sin carencias detectadas',
          converted: false,
        });
        log.info('diagnostico', 'Lead B2B guardado', { email, empresa });
      } catch (err) {
        // No bloquear el resultado por un fallo de guardado
        await log.error('diagnostico', 'Error guardando lead', { err });
      }
    }

    if (completo) {
      return NextResponse.json({
        completo: true,
        carencias: resultado.carencias,
        entregables,
        cumplido: resultado.cumplido,
      });
    }

    // Resultado parcial: solo títulos (valor real) + total, para invitar al detalle
    return NextResponse.json({
      completo: false,
      total_carencias: resultado.carencias.length,
      titulos: resultado.carencias.map((c) => c.titulo),
      cumplido: resultado.cumplido,
    });
  } catch (error) {
    await log.error('diagnostico', 'Error inesperado', { err: error });
    return NextResponse.json({ error: 'Error en el diagnóstico' }, { status: 500 });
  }
}
