-- Sección "Antes y Después" del home: pares de fotos (comparador deslizable)
-- que muestran el resultado de un servicio (quiropodia, pedicura, etc.).
-- Contenido 100% curado por el estudio desde /admin/antes-despues: Liz sube el
-- par de fotos, con etiqueta de servicio y descripción opcionales, y las
-- reordena. Idempotente: se puede correr varias veces.

create table if not exists public.before_after_items (
  id                uuid primary key default gen_random_uuid(),
  before_image_url  text        not null,
  after_image_url   text        not null,
  service_label     text,
  caption           text,
  sort_order        integer     not null default 0,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists before_after_items_order_idx
  on public.before_after_items (sort_order asc);

-- RLS: lectura pública solo de items activos; las escrituras pasan por el
-- API admin con service role (que ignora RLS). Mismo criterio endurecido del
-- resto del proyecto: sin políticas de escritura para anon/auth.
alter table public.before_after_items enable row level security;

drop policy if exists "before_after_items_public_read" on public.before_after_items;
create policy "before_after_items_public_read"
  on public.before_after_items
  for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- Textos del encabezado de la sección (editables por el estudio en el admin).
-- Fila única (id = 'default'). Los campos vacíos usan los valores por defecto
-- del componente.
-- ---------------------------------------------------------------------------

create table if not exists public.before_after_settings (
  id          text        primary key default 'default',
  eyebrow     text        not null default '',
  title       text        not null default '',
  subtitle    text        not null default '',
  cta_label   text        not null default '',
  cta_href    text        not null default '',
  updated_at  timestamptz not null default now()
);

insert into public.before_after_settings (id)
  values ('default')
  on conflict (id) do nothing;

alter table public.before_after_settings enable row level security;

drop policy if exists "before_after_settings_public_read" on public.before_after_settings;
create policy "before_after_settings_public_read"
  on public.before_after_settings
  for select
  using (true);
