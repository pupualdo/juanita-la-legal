create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  payment_id text,
  tema text,
  paid_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  history jsonb default '[]'::jsonb
);

-- Correos capturados en el email-gate previo al teaser. Sirven para enviar
-- descuentos más agresivos a quienes no convirtieron (converted = false).
create table if not exists leads (
  id         bigserial primary key,
  email      text not null,
  tema       text,
  resumen    text,
  session_id    text,
  converted     boolean default false,
  followup_sent boolean default false,
  created_at    timestamptz default now()
);
create index if not exists leads_email_idx on leads (email);
create index if not exists leads_converted_idx on leads (converted);
create index if not exists leads_followup_idx on leads (followup_sent);
