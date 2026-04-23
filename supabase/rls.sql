-- Enable Row-Level Security on all tables.
-- Server-side code uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so no policies are needed — the anon/public role gets zero access.

alter table sessions        enable row level security;
alter table message_feedback enable row level security;
alter table error_logs      enable row level security;

-- Explicitly drop any accidental open policies (run if prompted by Supabase advisor)
-- drop policy if exists "anon read" on sessions;
-- drop policy if exists "anon read" on message_feedback;
-- drop policy if exists "anon read" on error_logs;
