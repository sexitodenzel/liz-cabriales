-- ─── Sprint WhatsApp + Envío TUA ─────────────────────────────────────────────
-- Ejecutar manualmente en Supabase SQL Editor.
-- Los comandos son idempotentes (IF NOT EXISTS / DEFAULT seguro).

-- ── 1. Teléfono y verificación en users ──────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_code_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_expires_at TIMESTAMPTZ;

-- ── 2. Envío TUA en orders ────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount_final NUMERIC;
-- Valores posibles: 'not_required' | 'pending' | 'paid' | 'waived'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_payment_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_payment_preference_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_payment_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guide_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guide_created_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Nuevos valores de estado: 'awaiting_shipping_payment', 'shipping_paid'
-- (La columna es TEXT, no enum, por lo que no requiere migración de tipo)

-- ── 3. Tabla de log de notificaciones (idempotencia) ─────────────────────────

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL,        -- 'whatsapp' | 'email'
  template_name TEXT NOT NULL,
  recipient_phone TEXT,
  provider_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para evitar duplicados por reintentos de webhook
CREATE UNIQUE INDEX IF NOT EXISTS notif_log_idempotency
  ON notification_log (entity_type, entity_id, channel, template_name);
