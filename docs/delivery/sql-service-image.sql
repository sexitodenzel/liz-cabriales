-- Foto por servicio (aparece en los tiles del megamenú de Servicios y donde se
-- muestren los servicios). Idempotente.
alter table public.services
  add column if not exists image_url text;

comment on column public.services.image_url is
  'URL pública (bucket images) de la foto del servicio. Se muestra en el megamenú de Servicios.';
