import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

let supabase = null;
function getSupabase() {
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
    supabase = createClient(process.env.SUPABASE_URL, key);
  }
  return supabase;
}

const RESEARCH_PROMPT = `Eres un investigador legal especializado en derecho chileno.
Tu tarea es buscar y verificar información legal actualizada para responder la consulta.
Usa la búsqueda web para encontrar información en fuentes oficiales chilenas:
bcn.cl, dt.gob.cl, chileatiende.gob.cl, sii.cl, pjud.cl, serviciomigraciones.cl.
Responde en español chileno claro y cita las fuentes que encontraste.`;

export async function POST(request) {
  try {
    const { sessionId, topic } = await request.json();

    if (!sessionId || !topic) {
      return NextResponse.json({ error: 'Parámetros requeridos: sessionId, topic' }, { status: 400 });
    }

    const db = getSupabase();
    const { data: session } = await db
      .from('sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }

    const apiKey = (process.env.JUANITA_ANTHROPIC_KEY || '').trim();
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: RESEARCH_PROMPT,
      messages: [{ role: 'user', content: topic }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    });

    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return NextResponse.json({ result: textContent });
  } catch (error) {
    console.error('Error research:', error);
    return NextResponse.json({ error: 'Error en la investigación' }, { status: 500 });
  }
}
