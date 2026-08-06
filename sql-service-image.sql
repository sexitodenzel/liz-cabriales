-- Foto por servicio: cada servicio puede tener su propia imagen, que Mildred o
-- Liz suben desde el panel (Admin → Citas → Servicios). Se usa en el menú móvil
-- de "Servicios" (tiles) en vez del placeholder gris "Próximamente".
--
-- Es ADITIVO: la galería general del estudio (slots servicios_gallery_* en
-- /admin/media) sigue igual y alimentando /servicios y el megamenú de escritorio.
-- Idempotente: se puede correr varias veces.

alter table public.services
  add column if not exists image_url text;
