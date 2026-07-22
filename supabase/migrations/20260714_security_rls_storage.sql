-- ============================================================================
--  Endurecimiento de seguridad: Row Level Security (RLS) + políticas de Storage
-- ----------------------------------------------------------------------------
--  Ejecutar en el SQL Editor de Supabase. Es idempotente (se puede correr
--  varias veces). Las operaciones de administración usan el service role, que
--  ignora RLS; estas políticas protegen el acceso con la anon key + sesión de
--  usuario (server components y cliente).
--
--  IMPORTANTE: después de aplicar, probar flujos: ver perfil/órdenes/citas,
--  checkout, panel admin, subida de imágenes y descarga de facturas.
-- ============================================================================

-- ── Funciones auxiliares de rol ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'receptionist')
  );
$$;

-- ── users ───────────────────────────────────────────────────────────────────
alter table public.users enable row level security;

drop policy if exists users_select_self_or_staff on public.users;
create policy users_select_self_or_staff on public.users
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- Anti escalada de privilegios: un usuario no-admin no puede cambiar su `role`.
-- Robusto e independiente de los nombres de columnas del perfil.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.users;
create trigger trg_prevent_role_change
  before update on public.users
  for each row execute function public.prevent_role_change();

-- ── orders ──────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists orders_owner_insert on public.orders;
create policy orders_owner_insert on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders
  for all using (public.is_staff()) with check (public.is_staff());

-- ── payments ──────────────────────────────────────────────────────────────── 
alter table public.payments enable row level security;

drop policy if exists payments_owner_select on public.payments;
create policy payments_owner_select on public.payments
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists payments_staff_all on public.payments;
create policy payments_staff_all on public.payments
  for all using (public.is_staff()) with check (public.is_staff());

-- ── appointments ──────────────────────────────────────────────────────────── 
alter table public.appointments enable row level security;

drop policy if exists appointments_owner_select on public.appointments;
create policy appointments_owner_select on public.appointments
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists appointments_owner_insert on public.appointments;
create policy appointments_owner_insert on public.appointments
  for insert with check (user_id = auth.uid());

drop policy if exists appointments_owner_update on public.appointments;
create policy appointments_owner_update on public.appointments
  for update using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

drop policy if exists appointments_staff_all on public.appointments;
create policy appointments_staff_all on public.appointments
  for all using (public.is_staff()) with check (public.is_staff());

-- ── course_registrations ─────────────────────────────────────────────────────
alter table public.course_registrations enable row level security;

drop policy if exists course_reg_owner_select on public.course_registrations;
create policy course_reg_owner_select on public.course_registrations
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists course_reg_owner_insert on public.course_registrations;
create policy course_reg_owner_insert on public.course_registrations
  for insert with check (user_id = auth.uid());

drop policy if exists course_reg_staff_all on public.course_registrations;
create policy course_reg_staff_all on public.course_registrations
  for all using (public.is_staff()) with check (public.is_staff());

-- ── carts / cart_items ────────────────────────────────────────────────────── 
alter table public.carts enable row level security;

drop policy if exists carts_owner_all on public.carts;
create policy carts_owner_all on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.cart_items enable row level security;

drop policy if exists cart_items_owner_all on public.cart_items;
create policy cart_items_owner_all on public.cart_items
  for all using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

-- ── stock_alerts ────────────────────────────────────────────────────────────
alter table public.stock_alerts enable row level security;

drop policy if exists stock_alerts_owner_all on public.stock_alerts;
create policy stock_alerts_owner_all on public.stock_alerts
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

-- ============================================================================
--  STORAGE
-- ----------------------------------------------------------------------------
--  Bucket `images`      → lectura pública, escritura solo staff.
--  Bucket `invoice-docs`→ privado; staff todo, dueño puede leer sus facturas.
-- ============================================================================

-- images: lectura pública
drop policy if exists images_public_read on storage.objects;
create policy images_public_read on storage.objects
  for select using (bucket_id = 'images');

-- images: escritura/actualización/borrado solo staff
drop policy if exists images_staff_write on storage.objects;
create policy images_staff_write on storage.objects
  for insert with check (bucket_id = 'images' and public.is_staff());

drop policy if exists images_staff_update on storage.objects;
create policy images_staff_update on storage.objects
  for update using (bucket_id = 'images' and public.is_staff())
  with check (bucket_id = 'images' and public.is_staff());

drop policy if exists images_staff_delete on storage.objects;
create policy images_staff_delete on storage.objects
  for delete using (bucket_id = 'images' and public.is_staff());

-- invoice-docs: staff acceso total
drop policy if exists invoice_docs_staff_all on storage.objects;
create policy invoice_docs_staff_all on storage.objects
  for all using (bucket_id = 'invoice-docs' and public.is_staff())
  with check (bucket_id = 'invoice-docs' and public.is_staff());
