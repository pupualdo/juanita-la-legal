import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(request) {
  // Simple token auth — set ADMIN_SECRET in Vercel env vars
  const { searchParams } = new URL(request.url);
  if (!ADMIN_SECRET || searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    const [sessionsRes, feedbackRes, activeRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('session_id, paid_at, expires_at, tema, rating, feedback')
        .order('paid_at', { ascending: false })
        .limit(200),
      supabase
        .from('message_feedback')
        .select('id, session_id, message_id, vote, comment, message_preview, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('sessions')
        .select('session_id, paid_at, expires_at, tema')
        .gt('expires_at', now)
        .order('expires_at', { ascending: true }),
    ]);

    if (sessionsRes.error) throw sessionsRes.error;
    if (feedbackRes.error) throw feedbackRes.error;
    // activeRes error is non-fatal

    const sessions = sessionsRes.data ?? [];
    const messageFeedback = feedbackRes.data ?? [];
    const activeSessions = activeRes.data ?? [];

    // Aggregate stats
    const totalSessions = sessions.length;
    const ratedSessions = sessions.filter(s => s.rating != null);
    const avgRating = ratedSessions.length
      ? (ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length).toFixed(2)
      : null;
    const thumbsUp = messageFeedback.filter(f => f.vote === 'up').length;
    const thumbsDown = messageFeedback.filter(f => f.vote === 'down').length;

    return NextResponse.json({
      stats: {
        totalSessions,
        activeSessions: activeSessions.length,
        ratedSessions: ratedSessions.length,
        avgRating,
        thumbsUp,
        thumbsDown,
      },
      sessions,
      activeSessions,
      messageFeedback,
    });
  } catch (err) {
    console.error('Admin feedback error:', err);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
