import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres un clasificador legal para Chile.
Devuelve SOLO un JSON sin texto adicional ni markdown.
Temas posibles: familia, laboral, arriendo, herencia, migracion, terrenos

Formato exacto:
{"tema":"familia","emoji":"🏠","titulo":"Derecho de Familia","resumen":"frase corta del caso"}

Mapeo de emojis:
- familia → 🏠
- laboral → 💼
- arriendo → 🔑
- herencia → 📜
- migracion → 🌍
- terrenos → 🌿`;

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: 'Query requerida' }, { status: 400 });

    const apiKey = process.env.JUANITA_ANTHROPIC_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is missing from environment');
      return NextResponse.json({ error: 'Configuración inválida' }, { status: 500 });
    }
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error classify:', error);
    return NextResponse.json({ error: 'Error al clasificar' }, { status: 500 });
  }
}
