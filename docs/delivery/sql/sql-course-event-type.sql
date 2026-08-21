-- Tipo de evento en cursos — ejecutar manualmente en Supabase SQL Editor.
-- Permite distinguir las "clases especiales" que se muestran en el calendario
-- de la academia (taller máster internacional/nacional, masterclass, seminario
-- técnico). El default 'curso' conserva el comportamiento actual.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'curso';

-- Valores de referencia (sin CHECK rígido para no romper lecturas si en el
-- futuro se agregan tipos nuevos desde el panel):
--   curso
--   taller_master_internacional
--   taller_master_nacional
--   masterclass
--   seminario_tecnico
