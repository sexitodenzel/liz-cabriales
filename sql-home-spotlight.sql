-- Sección "Spotlight" del home: collage editorial estilo OPI Pro Spotlight.
-- Contenido 100% curado por el estudio desde /admin/home-spotlight: Mildred
-- sube las imágenes (nail art, fotos del estudio, promos…), con avatar y
-- etiqueta opcionales, y las reordena. Idempotente: se puede correr varias veces.

create table if not exists public.home_spotlight_items (
  id          uuid primary key default gen_random_uuid(),
  image_url   text        not null,
  avatar_url  text,
  label       text,
  link_href   text,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists home_spotlight_items_order_idx
  on public.home_spotlight_items (sort_order asc);

-- RLS: lectura pública solo de items activos; las escrituras pasan por el
-- API admin con service role (que ignora RLS). Mismo criterio endurecido del
-- resto del proyecto: sin políticas de escritura para anon/auth.
alter table public.home_spotlight_items enable row level security;

drop policy if exists "home_spotlight_public_read" on public.home_spotlight_items;
create policy "home_spotlight_public_read"
  on public.home_spotlight_items
  for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- Textos del encabezado de la sección (editables por el estudio en el admin).
-- Fila única (id = 'default'). Los campos vacíos usan los valores por defecto
-- del componente. `title` admite varias líneas (una por renglón) para el
-- reveal enmascarado.
-- ---------------------------------------------------------------------------

create table if not exists public.home_spotlight_settings (
  id          text        primary key default 'default',
  eyebrow     text        not null default '',
  title       text        not null default '',
  subtitle    text        not null default '',
  body        text        not null default '',
  cta_label   text        not null default '',
  cta_href    text        not null default '',
  updated_at  timestamptz not null default now()
);

insert into public.home_spotlight_settings (id)
  values ('default')
  on conflict (id) do nothing;

alter table public.home_spotlight_settings enable row level security;

drop policy if exists "home_spotlight_settings_public_read" on public.home_spotlight_settings;
create policy "home_spotlight_settings_public_read"
  on public.home_spotlight_settings
  for select
  using (true);
