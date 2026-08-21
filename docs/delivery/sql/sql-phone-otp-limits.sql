-- Límites anti-abuso para la verificación de teléfono por OTP (WhatsApp).
-- Correr en Supabase SQL Editor.
--
-- - phone_verification_attempts: intentos fallidos del código actual
--   (se bloquea a los 5; se resetea al enviar un código nuevo).
-- - phone_otp_sends_date / phone_otp_sends_count: tope de envíos por día (10).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_verification_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_otp_sends_date DATE,
  ADD COLUMN IF NOT EXISTS phone_otp_sends_count INTEGER NOT NULL DEFAULT 0;
