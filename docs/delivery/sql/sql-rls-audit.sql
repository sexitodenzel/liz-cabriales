-- Auditoría de RLS — correr en Supabase SQL Editor (solo lectura, no modifica nada).
--
-- Contexto: las tablas nuevas (announcements, stock_alerts, nail_art_*, etc.)
-- tienen RLS en los SQL del repo, pero las tablas core (users, orders, payments,
-- carts, appointments, courses...) se crearon a mano y su estado de RLS no es
-- verificable desde el código. Este script lo revela.

-- 1) Tablas del esquema public SIN RLS habilitado (las que salgan aquí son el riesgo:
--    cualquier cliente con la anon key puede leerlas/escribirlas sin restricción).
SELECT tablename AS tabla_sin_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 2) Estado completo: RLS habilitado y cuántas políticas tiene cada tabla.
SELECT
  t.tablename,
  t.rowsecurity AS rls_habilitado,
  COUNT(p.policyname) AS num_politicas
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, t.tablename;

-- 3) Detalle de todas las políticas existentes (comparar contra
--    docs/tech/security-model.md).
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ⚠️ Ojo: una tabla con RLS habilitado pero 0 políticas queda BLOQUEADA para la
-- anon key (nadie lee nada), lo cual rompe la tienda. Antes de habilitar RLS en
-- una tabla que hoy no lo tiene, crear primero sus políticas según
-- docs/tech/security-model.md. El Security Advisor del dashboard
-- (Advisors → Security) marca esto mismo automáticamente.
