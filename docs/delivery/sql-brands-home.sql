-- Home brands section visibility
-- Ejecutar manualmente en Supabase SQL Editor.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN;

UPDATE brands
SET show_on_home = CASE
  WHEN logo_url IS NOT NULL AND btrim(logo_url) <> '' THEN true
  ELSE false
END
WHERE show_on_home IS NULL;

ALTER TABLE brands
  ALTER COLUMN show_on_home SET DEFAULT false;

ALTER TABLE brands
  ALTER COLUMN show_on_home SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brands_show_on_home_name
  ON brands (show_on_home, name);
