-- Quién canceló la cita (para distinguir en el panel de admin)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_by text
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('client', 'admin', 'system'));

COMMENT ON COLUMN public.appointments.cancelled_by IS
  'client = cancelado por el cliente; admin = cancelado desde panel; system = expiración automática';
