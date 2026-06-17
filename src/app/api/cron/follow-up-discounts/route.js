import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FOLLOWUP_CODE = 'VUELVE70';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://juanitalalegal.cl';

const TOPIC_LABELS = {
  familia: 'familia', laboral: 'laboral', arriendo: 'arriendo', herencia: 'herencia',
  migracion: 'migración', terrenos: 'terrenos', deudas: 'deudas', empresas: 'tu empresa',
  contratos: 'contratos', documento: 'tu documento', otros: 'tu consulta',
};

function buildEmailHtml(lead) {
  const temaTxt = lead.tema && TOPIC_LABELS[lead.tema] ? ` sobre ${TOPIC_LABELS[lead.tema]}` : '';
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#faf8f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2a2018;">
  <div style="max-width:480px;margin:0 auto;padding:28px 22px;">
    <div style="font-size:22px;font-weight:800;color:#1a3a2a;font-family:Georgia,serif;margin-bottom:6px;">⚖️ Juanita La Legal</div>
    <div style="background:#fff;border:1px solid #e0d8c8;border-radius:18px;padding:24px;">
      <div style="font-size:13px;font-weight:700;color:#b8860b;text-transform:uppercase;letter-spacing:1.2px;">Solo por hoy</div>
      <h1 style="font-size:24px;color:#1a3a2a;margin:6px 0 12px;line-height:1.25;">70% de descuento para resolver tu caso${temaTxt}</h1>
      <p style="font-size:15px;color:#6a5e50;line-height:1.6;margin:0 0 18px;">
        Quedaste a un paso de tu orientación completa. Te dejamos un descuento especial para que termines lo que empezaste:
        te explico <strong>exactamente qué hacer, paso a paso</strong>, con tus derechos, los plazos y a dónde acudir.
      </p>
      <div style="background:#1a3a2a;color:#f5f0e8;border-radius:12px;padding:14px;text-align:center;font-size:14px;margin-bottom:18px;">
        Tu código: <strong style="font-size:20px;letter-spacing:3px;">${FOLLOWUP_CODE}</strong><br>
        <span style="font-size:12px;color:#8fbc8f;">Aplica 70% — válido por 24 horas</span>
      </div>
      <a href="${APP_URL}" style="display:block;background:#009ee3;color:#fff;text-decoration:none;text-align:center;border-radius:12px;padding:14px;font-size:16px;font-weight:700;">
        Resolver mi caso ahora →
      </a>
    </div>
    <p style="font-size:11px;color:#a09080;text-align:center;margin-top:16px;line-height:1.5;">
      Orientación legal general e informativa. No reemplaza a un abogado/a.<br>
      Recibes esto porque dejaste tu correo en juanita-la-legal.
    </p>
  </div>
</body></html>`;
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Leads que dejaron correo hace entre 24 y 48h, no pagaron y no recibieron follow-up.
  const now = Date.now();
  const from = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const to = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, email, tema')
    .eq('converted', false)
    .eq('followup_sent', false)
    .gte('created_at', from)
    .lte('created_at', to)
    .limit(200);

  if (error) {
    await log.error('cron-followup', 'query failed', { err: error });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const candidates = leads?.length || 0;

  if (!process.env.RESEND_API_KEY) {
    // Sin proveedor de email configurado: no enviamos, pero reportamos cuántos había.
    return NextResponse.json({ ok: false, reason: 'no_resend_key', candidates });
  }

  let sent = 0;
  for (const lead of leads || []) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Juanita La Legal <onboarding@resend.dev>',
          to: lead.email,
          subject: 'Tu 70% de descuento para resolver tu caso 👩‍⚖️',
          html: buildEmailHtml(lead),
        }),
      });
      if (res.ok) {
        await supabase.from('leads').update({ followup_sent: true }).eq('id', lead.id);
        sent++;
      } else {
        const body = await res.text().catch(() => '');
        await log.error('cron-followup', 'resend send failed', { status: res.status, body, leadId: lead.id });
      }
    } catch (err) {
      await log.error('cron-followup', 'send exception', { err, leadId: lead.id });
    }
  }

  return NextResponse.json({ ok: true, candidates, sent });
}
