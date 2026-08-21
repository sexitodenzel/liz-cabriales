-- Limpieza de los slots del "Hero Slider" clásico (sustituido por HomeHeroTriCards).
-- Ejecutar UNA VEZ en Supabase SQL Editor.
--
-- Contexto: el hero de la landing son las tres tri-cards (`home_tri_tienda`,
-- `home_tri_academia`, `home_tri_cabina`, sección `home`). Los slots de sección
-- `hero` sobraron del carrusel anterior: ningún componente los lee, pero seguían
-- apareciendo en /admin/media, así que se podían editar creyendo que cambiaban
-- algo del sitio. `hero_slide_1/2/3` venían del seed de sql-landing-slots.sql
-- (ya corregido ahí); `hero_1` y `hero_4` se crearon después desde el botón
-- "Agregar slide" del panel.
--
-- El panel se limpia solo: en app/admin/media/page.tsx la sección no se pinta
-- si no tiene slots, así que al quedar en cero desaparece junto con su botón.
--
-- Las imágenes NO se borran del bucket: solo se quitan las filas. Si hiciera
-- falta recuperar alguna, las URLs quedaron en el log de esta limpieza.

DELETE FROM landing_slots
WHERE section = 'hero'
  AND key IN ('hero_1', 'hero_4', 'hero_slide_1', 'hero_slide_2', 'hero_slide_3');
