-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: CHECK constraint `orders_status_check` desactualizado
-- ─────────────────────────────────────────────────────────────────────────────
--
-- CONTEXTO
--   El flujo de envío en 2 pasos (cobro de guía) mueve la orden a los estados
--   'awaiting_shipping_payment' y luego 'shipping_paid'. El sprint de WhatsApp
--   asumió que `orders.status` era TEXT libre y no tocó ningún CHECK, pero la
--   tabla SÍ tiene un constraint `orders_status_check` con la lista vieja de
--   estados. Resultado: al cotizar el envío, el UPDATE truena con
--       23514  new row for relation "orders" violates check constraint
--              "orders_status_check"
--   y el panel muestra "Error guardando datos de envío".
--
-- QUÉ HACE
--   Reemplaza el constraint por uno que incluye los 7 estados que usa el código
--   (ver `OrderStatus` en types/index.ts). Es idempotente: se puede correr las
--   veces que sea.
--
-- CÓMO CORRERLO
--   Supabase → SQL Editor → pegar todo → Run.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'awaiting_shipping_payment',
    'shipping_paid',
    'shipped',
    'delivered',
    'cancelled'
  ));

-- Verificación (opcional): lista el constraint recién creado.
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'orders'::regclass AND conname = 'orders_status_check';
