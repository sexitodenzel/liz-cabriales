-- Agregar campos de dirección de envío al perfil del usuario
-- Ejecutar en Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS colonia      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cp           TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS municipio    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS entre_calles TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referencia   TEXT;
