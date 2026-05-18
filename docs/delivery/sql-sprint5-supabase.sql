-- Sprint 5 — ejecutar manualmente en Supabase SQL Editor (no corre automáticamente).

-- 1) Rol recepcionista en public.users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client', 'admin', 'receptionist'));

-- 2) CFDI / facturación en public.orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_invoice BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_surcharge NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN orders.requires_invoice IS 'Cliente solicitó factura CFDI al checkout';
COMMENT ON COLUMN orders.invoice_surcharge IS 'Cargo MXN por facturación (sobre subtotal del carrito)';

-- 3) OAuth (Google) — asegurar alta de perfil en public.users con rol client
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_full_name TEXT;
  resolved_first_name TEXT;
  resolved_last_name TEXT;
BEGIN
  meta_first_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'first_name', '')), '');
  meta_last_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'last_name', '')), '');
  meta_full_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');

  IF meta_first_name IS NOT NULL THEN
    resolved_first_name := meta_first_name;
  ELSIF meta_full_name IS NOT NULL THEN
    resolved_first_name := split_part(meta_full_name, ' ', 1);
  ELSE
    resolved_first_name := NULL;
  END IF;

  IF meta_last_name IS NOT NULL THEN
    resolved_last_name := meta_last_name;
  ELSIF meta_full_name IS NOT NULL AND strpos(meta_full_name, ' ') > 0 THEN
    resolved_last_name := trim(substring(meta_full_name from strpos(meta_full_name, ' ') + 1));
  ELSE
    resolved_last_name := NULL;
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    resolved_first_name,
    resolved_last_name,
    'client'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.users.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.users.last_name, EXCLUDED.last_name),
    role = COALESCE(public.users.role, 'client');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
