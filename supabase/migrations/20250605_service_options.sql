-- Servicios: mostrar lista de extras/tipos de uña al reservar
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS show_options BOOLEAN NOT NULL DEFAULT false;

-- Catálogo global de extras y tipos de uña
CREATE TABLE IF NOT EXISTS public.service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('extra', 'nail_type')),
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_delta INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Qué opciones aplican a cada servicio (habilitar/deshabilitar)
CREATE TABLE IF NOT EXISTS public.service_option_links (
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.service_options(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (service_id, option_id)
);

-- Opciones elegidas en cada cita
CREATE TABLE IF NOT EXISTS public.appointment_service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  option_id UUID NOT NULL REFERENCES public.service_options(id),
  option_label TEXT NOT NULL,
  option_type TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_option_links_service
  ON public.service_option_links(service_id);

CREATE INDEX IF NOT EXISTS idx_appointment_service_options_appt
  ON public.appointment_service_options(appointment_id);

-- Opciones de ejemplo (idempotente por label + tipo)
INSERT INTO public.service_options (label, option_type, price_delta, duration_delta, sort_order)
SELECT v.label, v.option_type, v.price_delta, v.duration_delta, v.sort_order
FROM (
  VALUES
    ('Natural', 'nail_type', 0::numeric, 0, 1),
    ('Acrílico', 'nail_type', 50::numeric, 15, 2),
    ('Gel', 'nail_type', 80::numeric, 20, 3),
    ('Polygel', 'nail_type', 100::numeric, 25, 4),
    ('Diseño sencillo', 'extra', 80::numeric, 15, 10),
    ('Diseño elaborado', 'extra', 150::numeric, 30, 11),
    ('Retiro previo', 'extra', 100::numeric, 20, 12)
) AS v(label, option_type, price_delta, duration_delta, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.service_options o
  WHERE o.label = v.label AND o.option_type = v.option_type
);
