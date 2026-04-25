-- =============================================================================
-- Fase 2 — datos de prueba y verificación de columnas (Supabase SQL Editor)
-- Ejecutar por secciones si prefieres revisar resultados entre pasos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Verificación: columnas actuales vs. esperadas (revisar resultados manualmente)
-- -----------------------------------------------------------------------------
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = ANY (
    ARRAY[
      'services',
      'professionals',
      'appointments',
      'appointment_services',
      'blocked_slots',
      'instructors',
      'courses',
      'course_registrations'
    ]
  )
ORDER BY c.table_name, c.ordinal_position;

-- Columnas esperadas (referencia — comparar con el resultado anterior):
-- services: id, name, description, price, duration_min, is_active, created_at, updated_at
-- professionals: id, name, bio, photo_url, is_active, created_at
-- appointments: id, user_id, professional_id, appointment_type, date, start_time, end_time, total, status, created_at, updated_at
-- appointment_services: id, appointment_id, service_id, unit_price
-- blocked_slots: id, professional_id, date, start_time, end_time, reason, created_at
-- instructors: id, name, bio, photo_url, created_at
-- courses: id, instructor_id, title, description, cover_image, price, capacity, level, start_date, end_date, start_time, location, is_published, created_at, updated_at
-- course_registrations: id, course_id, user_id, attendees, status, added_by_admin, created_at

-- -----------------------------------------------------------------------------
-- 2) Servicios de prueba (MXN, duración en minutos)
-- Idempotente por nombre: no inserta duplicados si el nombre ya existe.
-- -----------------------------------------------------------------------------
INSERT INTO public.services (name, description, price, duration_min, is_active)
SELECT v.name, v.description, v.price, v.duration_min, true
FROM (
  VALUES
    ('Aplicación de uñas', 'Servicio de prueba', 350::numeric, 90),
    ('Manicure', 'Servicio de prueba', 200::numeric, 60),
    ('Pedicure', 'Servicio de prueba', 250::numeric, 75),
    ('Retiro de uñas', 'Servicio de prueba', 150::numeric, 45),
    ('Mantenimiento de uñas', 'Servicio de prueba', 180::numeric, 60),
    ('Pedicure Spa', 'Servicio de prueba', 300::numeric, 90),
    ('Quiropodia', 'Servicio de prueba', 400::numeric, 60)
) AS v(name, description, price, duration_min)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s WHERE s.name = v.name
);

-- -----------------------------------------------------------------------------
-- 3) Profesionales de prueba
-- -----------------------------------------------------------------------------
INSERT INTO public.professionals (name, bio, photo_url, is_active)
SELECT 'Liz Cabriales', NULL, NULL, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.professionals p WHERE p.name = 'Liz Cabriales'
);

INSERT INTO public.professionals (name, bio, photo_url, is_active)
SELECT 'Técnica 2', NULL, NULL, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.professionals p WHERE p.name = 'Técnica 2'
);

-- -----------------------------------------------------------------------------
-- 4) Instructor de prueba
-- -----------------------------------------------------------------------------
INSERT INTO public.instructors (name, bio, photo_url)
SELECT 'Instructor Demo', NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.instructors i WHERE i.name = 'Instructor Demo'
);

-- -----------------------------------------------------------------------------
-- 5) Comprobación rápida post-seed
-- -----------------------------------------------------------------------------
-- SELECT id, name, price, duration_min FROM public.services ORDER BY name;
-- SELECT id, name, is_active FROM public.professionals ORDER BY name;
-- SELECT id, name FROM public.instructors ORDER BY name;
