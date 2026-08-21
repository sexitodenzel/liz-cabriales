-- Habilita la entrega a domicilio local (repartidor) como tercer tipo de entrega.
-- Ejecutar en Supabase SQL Editor.
--
-- Contexto:
--   orders.delivery_type aceptaba solo 'shipping' | 'pickup'. La entrega local
--   ('local_delivery') se comporta como el retiro en lo económico —en el sitio
--   solo se cobran los productos— pero sí guarda dirección (shipping_address /
--   shipping_city / shipping_state). El costo del envío lo paga el cliente
--   directamente al repartidor, así que NO pasa por el flujo de cotización de
--   guías ni por 'awaiting_shipping_payment'.
--
-- Este script elimina cualquier CHECK existente sobre orders.delivery_type y
-- crea uno nuevo que incluye 'local_delivery'. Es idempotente.

DO $$
DECLARE
  con record;
BEGIN
  -- Elimina cualquier CHECK constraint definido sobre la columna delivery_type.
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t   ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'orders'
      AND n.nspname = 'public'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%delivery_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', con.conname);
  END LOOP;

  -- Crea el CHECK actualizado con los tres valores permitidos.
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_delivery_type_check
    CHECK (delivery_type IN ('shipping', 'pickup', 'local_delivery'));
END $$;

-- Verificación:
--   SELECT pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conname = 'orders_delivery_type_check';
