-- Timeout de inactividad del panel admin (plan Free: control en app, no en Auth Pro).
-- Ejecutar en Supabase SQL Editor. Idempotente.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

COMMENT ON COLUMN public.users.last_activity_at IS
  'Última actividad en /admin (staff). Usado para timeout por inactividad de 30 min.';

CREATE INDEX IF NOT EXISTS users_last_activity_at_idx
  ON public.users (last_activity_at);
