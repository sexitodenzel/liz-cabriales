-- Auditoría de inicios de sesión (retención ~3 meses).
-- Ejecutar en Supabase SQL Editor. Idempotente.

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  email text,
  full_name text,
  role text,
  method text not null default 'password'
    check (method in ('password', 'oauth', 'magic_link', 'invite', 'recovery', 'unknown')),
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists login_events_created_at_idx
  on public.login_events (created_at desc);

create index if not exists login_events_user_id_idx
  on public.login_events (user_id);

create index if not exists login_events_email_idx
  on public.login_events (email);

comment on table public.login_events is
  'Registro de inicios de sesión exitosos para auditoría (retención 90 días).';

alter table public.login_events enable row level security;

-- Solo staff puede leer. Escrituras van por service role (bypass RLS).
drop policy if exists login_events_staff_select on public.login_events;
create policy login_events_admin_select
  on public.login_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

-- Nadie inserta/actualiza/borra con la anon/authenticated key.
-- El backend usa SUPABASE_SERVICE_ROLE_KEY.
