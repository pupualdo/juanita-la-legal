/**
 * Structured server-side logger.
 *
 * In production (Vercel) all console output goes to the function logs
 * accessible at vercel.com/project/functions.
 *
 * Optionally persists ERROR-level entries to the Supabase `error_logs` table
 * for review in the admin dashboard.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.error('webhook-mp', 'Payment fetch failed', { paymentId, err });
 *   log.warn('verify-payment', 'Session not found', { sessionId });
 *   log.info('chat', 'Stream started', { sessionId });
 */

import { createClient } from '@supabase/supabase-js';

let _supabase = null;
function getSupabase() {
  if (!_supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supabase;
}

function serialize(value) {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack, name: value.name };
  }
  return value;
}

function entry(level, route, message, context) {
  return {
    level,
    route,
    message,
    context: context ? Object.fromEntries(
      Object.entries(context).map(([k, v]) => [k, serialize(v)])
    ) : undefined,
    ts: new Date().toISOString(),
  };
}

async function persist(record) {
  try {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('error_logs').insert({
      level: record.level,
      route: record.route,
      message: record.message,
      context: record.context ?? null,
      created_at: record.ts,
    });
  } catch {
    // Never throw from the logger
  }
}

export const log = {
  info(route, message, context) {
    console.log(JSON.stringify(entry('info', route, message, context)));
  },

  warn(route, message, context) {
    console.warn(JSON.stringify(entry('warn', route, message, context)));
  },

  async error(route, message, context) {
    const record = entry('error', route, message, context);
    console.error(JSON.stringify(record));
    await persist(record);
  },
};
