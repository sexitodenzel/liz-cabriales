-- Configuración global del estudio (singleton)
CREATE TABLE IF NOT EXISTS public.studio_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  transfer_account_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.studio_settings IS
  'Ajustes del estudio editables desde el panel de agenda.';

COMMENT ON COLUMN public.studio_settings.transfer_account_number IS
  'Número de cuenta CLABE/tarjeta mostrado al cliente para transferir el anticipo de citas.';

INSERT INTO public.studio_settings (id, transfer_account_number)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;
