-- Flags de visualización pública por servicio (módulo /servicios).
-- El admin siempre ve precio y duración; estos campos solo afectan la UI pública.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS hide_price_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS hide_duration_public BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN services.hide_price_public IS
  'Si true, el precio no se muestra en el módulo público de servicios.';

COMMENT ON COLUMN services.hide_duration_public IS
  'Si true, la duración no se muestra en el módulo público de servicios.';
