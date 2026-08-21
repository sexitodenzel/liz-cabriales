-- Correcciones de RLS — correr en Supabase SQL Editor.
-- Basado en la auditoría de políticas (docs/delivery/sql-rls-audit.sql).
--
-- Contexto: todas las escrituras del servidor usan el service role, que ignora
-- RLS. Estas políticas solo gobiernan el acceso DIRECTO con la anon key desde
-- el navegador. Por eso podemos endurecerlas sin romper los flujos del backend.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) course_registrations: quitar el "OR user_id IS NULL".
--    Hoy deja que CUALQUIER visitante anónimo lea todas las inscripciones de
--    invitados (nombre, correo, teléfono). Las inscripciones de invitados se
--    crean por el servidor (service role) y el invitado recibe su confirmación
--    por email; nadie necesita leer esta tabla con la anon key.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuario puede ver sus inscripciones a cursos" ON course_registrations;
CREATE POLICY "Usuario puede ver sus inscripciones a cursos"
  ON course_registrations
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario autenticado puede inscribirse a cursos" ON course_registrations;
CREATE POLICY "Usuario autenticado puede inscribirse a cursos"
  ON course_registrations
  FOR INSERT
  WITH CHECK ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) services / professionals: eliminar la política duplicada permisiva (true),
--    dejando solo la de "activos". Evita exponer registros inactivos.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Cualquiera puede ver servicios" ON services;
DROP POLICY IF EXISTS "Cualquiera puede ver profesionales" ON professionals;
-- Se conservan: "Lectura pública de servicios activos" (is_active = true)
--               "Lectura pública de profesionales activos" (is_active = true)

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) users: permitir que el usuario actualice SU PROPIA fila (perfil).
--    Hoy solo hay política de SELECT. Agregar UPDATE no abre riesgo: el USING y
--    el WITH CHECK atan la fila a auth.uid(), así que nadie edita filas ajenas.
--    (Si el perfil se edita solo por el servidor/service role, esto es inocuo.)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can update own row" ON users;
CREATE POLICY "Users can update own row"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
