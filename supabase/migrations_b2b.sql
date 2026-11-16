-- ─── MIGRACIONES B2B — Juanita La Legal ─────────────────────────────────────
-- Correr en Supabase (SQL Editor) en orden. Son idempotentes (IF NOT EXISTS).

-- ── FASE 2: ampliar leads para el diagnóstico B2B ────────────────────────────
alter table leads
  add column if not exists empresa text,
  add column if not exists rut text,
  add column if not exists nombre_contacto text;

-- ── FASE 3: tabla de órdenes ────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  rut text not null,
  razon_social text,
  giro text,
  email text not null,
  entregable_id text not null,
  form_data jsonb default '{}'::jsonb,
  borrador text,
  version_final text,
  estado text default 'pagado',  -- pagado|borrador_generado|en_revision|aprobado|entregado|devuelto
  notas_revisor text,
  payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  approved_at timestamptz,
  delivered_at timestamptz
);
alter table orders enable row level security;
create index if not exists orders_estado_idx on orders (estado);
create index if not exists orders_email_idx on orders (email);
