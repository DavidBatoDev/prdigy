-- Create table to store password reset codes (hashed) with expiry and consumption tracking
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid null,
  code_hash text not null,
  salt text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.password_resets is 'Stores hashed password reset codes with expiry and consumption flags';

-- Helpful indexes
create index if not exists password_resets_email_idx on public.password_resets (email);
create index if not exists password_resets_created_idx on public.password_resets (created_at desc);

-- Enable RLS to block direct client access (functions use service role)
alter table public.password_resets enable row level security;

-- No public policies; service role bypasses RLS. Optionally allow owner-only access via custom policies if needed.
