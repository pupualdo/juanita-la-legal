import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no está configurada en este ambiente' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'No se recibió archivo de audio' }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    const detail = error?.error?.message || error?.message || String(error);
    return NextResponse.json({ error: `Whisper falló: ${detail}` }, { status: 500 });
  }
}
