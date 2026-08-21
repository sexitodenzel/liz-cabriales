-- Ejecutar en Supabase SQL Editor
-- Campos para el flujo de facturación CFDI

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_email       TEXT,
  ADD COLUMN IF NOT EXISTS constancia_fiscal_url TEXT,
  ADD COLUMN IF NOT EXISTS ticket_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS invoice_status      TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invoice_issued_at   TIMESTAMPTZ;

-- TAMBIÉN crear el bucket en Supabase Storage:
-- 1. Ir a Storage → Create new bucket
-- 2. Name: invoice-docs
-- 3. Public: NO (privado)
-- 4. File size limit: 10 MB
-- Las subidas se hacen con service_role desde el backend, no necesita políticas extra.
