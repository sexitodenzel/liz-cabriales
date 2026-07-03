-- Horario semanal del estudio para disponibilidad de citas
CREATE TABLE IF NOT EXISTS public.studio_weekly_hours (
  day_of_week SMALLINT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT false,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.studio_weekly_hours IS
  'Horario base Lun-Dom (0=domingo). Define desde cuándo hasta cuándo se ofrecen slots de cita.';

COMMENT ON COLUMN public.studio_weekly_hours.day_of_week IS '0=Domingo, 1=Lunes, …, 6=Sábado (Date.getDay())';

-- Valores iniciales: igual que el hardcode anterior (Lun-Sáb 9-19, Dom cerrado)
INSERT INTO public.studio_weekly_hours (day_of_week, is_open, open_time, close_time)
VALUES
  (0, false, '09:00', '19:00'),
  (1, true, '09:00', '19:00'),
  (2, true, '09:00', '19:00'),
  (3, true, '09:00', '19:00'),
  (4, true, '09:00', '19:00'),
  (5, true, '09:00', '19:00'),
  (6, true, '09:00', '19:00')
ON CONFLICT (day_of_week) DO NOTHING;

ALTER TABLE public.studio_weekly_hours ENABLE ROW LEVEL SECURITY;
