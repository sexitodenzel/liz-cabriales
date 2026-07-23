-- ============================================================================
--  Bucket privado `nail-art-ugc` — INSTRUCCIONES (leer completo)
-- ----------------------------------------------------------------------------
--
--  ERROR típico en SQL Editor:
--    42501: must be owner of relation objects
--
--  Causa: `storage.objects` / policies de Storage las administra
--  `supabase_storage_admin`. El SQL Editor (rol `postgres`) a menudo
--  NO puede CREATE/DROP POLICY ni a veces INSERT en storage.buckets.
--
--  Por eso este archivo NO intenta crear policies por SQL.
--  Hazlo desde la UI de Storage (pasos abajo).
--
--  Nota de arquitectura (este proyecto):
--  - Upload y signed URLs usan SUPABASE_SERVICE_ROLE_KEY → BYPASAN RLS.
--  - Las policies de INSERT para `authenticated` son defensa-in-depth
--    (por si algún día subes desde el cliente). No son obligatorias
--    para que funcione /api/nail-art/upload e /api/nail-art/image.
--  - Lo crítico: bucket PRIVATE y SIN policy de SELECT pública.
--
-- ============================================================================

-- Opcional: solo si tu proyecto SÍ te deja escribir en storage.buckets.
-- Si falla con 42501, ignora este bloque y crea el bucket en la UI.
/*
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nail-art-ugc',
  'nail-art-ugc',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
*/

-- ============================================================================
--  PASOS MANUALES EN SUPABASE DASHBOARD
-- ============================================================================
--
--  1) Storage → New bucket
--       Name:           nail-art-ugc
--       Public bucket:  OFF (privado)
--       File size:      6 MB (opcional)
--       MIME:           image/jpeg, image/png, image/webp (opcional)
--
--  2) Storage → nail-art-ugc → Policies
--
--     a) NO crees ninguna policy de SELECT para anon/authenticated.
--        (Sin SELECT público = no se puede leer el archivo por URL directa.)
--
--     b) (Opcional, defensa en profundidad) New policy → Insert
--        Policy name: nail_art_ugc_auth_upload_own_folder
--        Allowed operation: INSERT
--        Target roles: authenticated
--        WITH CHECK expression:
--
--          bucket_id = 'nail-art-ugc'
--          AND (storage.foldername(name))[1] = auth.uid()::text
--
--     c) (Opcional) UPDATE — misma expresión en USING y WITH CHECK
--     d) (Opcional) DELETE — misma expresión en USING
--
--  3) Verifica: Storage → nail-art-ugc → el badge debe decir Private.
--
-- ============================================================================
