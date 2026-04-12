create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  payment_id text,
  tema text,
  paid_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  history jsonb default '[]'::jsonb
);
