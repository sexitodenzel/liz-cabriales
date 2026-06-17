-- Restaurar stock automáticamente cuando un pedido pagado se cancela
-- Ejecutar en Supabase SQL Editor
--
-- IMPORTANTE: el stock SOLO se descuenta cuando el webhook de MercadoPago
-- confirma el pago (deductStockForOrder en lib/supabase/payments.ts).
-- Por eso este trigger solo restaura stock si la orden estaba en un estado
-- que ya había descontado inventario. Cancelar una orden 'pending' no
-- debe restaurar nada porque nunca se descontó.

-- Función que suma de vuelta las cantidades a product_variants
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IN ('paid', 'awaiting_shipping_payment', 'shipping_paid', 'shipped') THEN
    UPDATE product_variants pv
    SET stock = pv.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.id = oi.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara en cada UPDATE de status en orders
DROP TRIGGER IF EXISTS trg_restore_stock_on_cancel ON orders;

CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_cancel();
