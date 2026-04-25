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
