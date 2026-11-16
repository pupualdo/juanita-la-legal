-- ─── MIGRACIONES B2B — Juanita La Legal ─────────────────────────────────────
-- Correr en Supabase (SQL Editor) en orden. Son idempotentes (IF NOT EXISTS).

-- ── FASE 2: ampliar leads para el diagnóstico B2B ────────────────────────────
alter table leads
  add column if not exists empresa text,
  add column if not exists rut text,
  add column if not exists nombre_contacto text;

-- ── FASE 3 (se agrega cuando corresponda): tabla de órdenes ─────────────────
-- (ver plan aprobado; se incluirá aquí en la Fase 3)
