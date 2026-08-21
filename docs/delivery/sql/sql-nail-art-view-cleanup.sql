-- Cierra la alerta CRITICAL "Security Definer View" de public.nail_art_posts_public.
--
-- QUE ES: una vista creada a mano en el panel de Supabase (no existe en ningun
-- SQL de este repo). Como toda vista normal, corre con los permisos de su dueno
-- y por eso se salta el RLS de nail_art_posts: un visitante anonimo lee a traves
-- de ella lo que la tabla le negaria.
--
-- POR QUE NO ERA GRAVE (verificado 2026-08-09): filtra bien.
--   WHERE is_active = true AND status = 'approved'
-- Solo expone campos publicos (titulo, slug, foto, nombre del autor). No hay
-- correos ni user_id, y no deja ver contenido pendiente de moderacion.
--
-- POR QUE SE BORRA EN VEZ DE ARREGLARSE: nadie la usa. La galeria publica
-- (lib/supabase/nail-art.ts) lee nail_art_posts directo desde el servidor con la
-- service role y filtra en la consulta. Un grep por "nail_art_posts_public" en
-- app/ y lib/ no devuelve nada. Es codigo muerto en la base.
--
-- Arreglarla con security_invoker exigiria ademas crear una politica de lectura
-- publica en la tabla base — mas superficie de ataque para algo que nadie llama.
-- Menos piezas es mas seguro que mas piezas bien configuradas.

-- ---------------------------------------------------------------------------
-- PASO 1 (comprobacion). Debe devolver 0 filas. Si devuelve algo, ALGO depende
-- de la vista: no borres hasta revisarlo.
-- ---------------------------------------------------------------------------
select
  dependent.relname as objeto_que_depende,
  dependent.relkind as tipo
from pg_depend d
join pg_rewrite r on r.oid = d.objid
join pg_class dependent on dependent.oid = r.ev_class
join pg_class source on source.oid = d.refobjid
where source.relname = 'nail_art_posts_public'
  and dependent.relname <> 'nail_art_posts_public';

-- ---------------------------------------------------------------------------
-- PASO 2 (el arreglo). RESTRICT hace que falle sola si algo dependiera de ella.
-- Nunca uses CASCADE aqui: se llevaria por delante lo que dependa sin avisar.
-- ---------------------------------------------------------------------------
drop view if exists public.nail_art_posts_public restrict;

-- ---------------------------------------------------------------------------
-- PASO 3 (verificacion). Debe devolver 0 filas.
-- ---------------------------------------------------------------------------
select viewname
from pg_views
where schemaname = 'public'
  and viewname = 'nail_art_posts_public';

-- ---------------------------------------------------------------------------
-- MARCHA ATRAS, por si algo externo al repo la usaba (un panel, un reporte).
-- Es la definicion exacta que tenia al 2026-08-09.
-- ---------------------------------------------------------------------------
-- create view public.nail_art_posts_public as
--   select id, title, slug, description, cover_image, is_active, sort_order,
--          created_at, updated_at, author_display_name, status, is_editorial,
--          likes_count
--   from nail_art_posts
--   where is_active = true and status = 'approved'::text;
