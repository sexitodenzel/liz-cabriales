# Auditoría de seguridad — 2026-07-05

Alcance: revisión de superficie de ataque de la tienda completa a raíz de una
preocupación por inyección SQL. Método: revisión de las 90+ rutas `/api/*`
(autenticación, autorización, validación de input), rastreo de todo punto donde
input del usuario se interpola en consultas, revisión del modelo de auth
(login, roles, middleware/layout admin), y auditoría completa de RLS en Supabase
contra `security-model.md`.

## Veredicto general

- **No hay inyección SQL.** Todo pasa por el query builder de Supabase
  (PostgREST), que parametriza los valores. No existe una sola consulta SQL
  construida por concatenación de strings. El `=` en el login es inofensivo:
  las credenciales van a GoTrue (`signInWithPassword`) y el password se compara
  contra un hash bcrypt, nunca se interpreta como SQL.
- Los dos únicos puntos donde input se interpola en filtros PostgREST están
  protegidos: `tokenizeSearchQuery` elimina todo lo que no sea `[a-z0-9]`
  (`lib/search-text.ts`), y el buscador de usuarios admin escapa `%_\` antes del
  `ilike` (`app/api/admin/users/search/route.ts`).
- Las 56 rutas `/api/admin/*` verifican rol con `requireAdmin` /
  `requireAdminOrReceptionist`, leyendo el rol de la tabla `users` (no del JWT).
- Los precios de las órdenes se calculan server-side desde
  `product_variants.price` — el cliente no puede manipular montos.
- RLS cubre **todas** las tablas del esquema público (0 tablas sin RLS).

## Hallazgos corregidos — código

| # | Hallazgo | Corrección | Archivo |
|---|----------|------------|---------|
| 1 | OTP de teléfono sin límite de intentos: un código de 6 dígitos con 10 min de vida se podía forzar por fuerza bruta. | Máximo 5 intentos fallidos por código; al quinto se bloquea (`TOO_MANY_ATTEMPTS`, HTTP 429). Comparación del hash con `timingSafeEqual`. | `lib/notifications/phone-verification.ts` |
| 2 | Envío de OTP por WhatsApp sin rate limiting: spameable, con costo por mensaje. | Cooldown de 60 s entre envíos (derivado de `expires_at`) + tope de 10 códigos/día por usuario (`RATE_LIMITED`, HTTP 429). | `lib/notifications/phone-verification.ts`, `app/api/phone/send-code/route.ts` |
| 3 | Firma del webhook de MercadoPago opcional: si faltara `MERCADOPAGO_WEBHOOK_SECRET`, procesaría sin verificar. Comparación con `===`. | En producción sin secret → no procesa nada (200 + error en logs). Firma comparada con `timingSafeEqual`. | `app/api/webhooks/mercadopago/route.ts` |
| 4 | Enumeración de usuarios: `/api/auth/check-email` público, sin límite, revela si un correo tiene cuenta. | Rate limiting de 10 req/min por IP (429 + `Retry-After`). Helper reutilizable. | `app/api/auth/check-email/route.ts`, `lib/rate-limit.ts` (nuevo) |
| 5 | Cron `cleanup-pending` aceptaba el secret por query param (`?secret=`), que queda en logs. | Solo header `Authorization: Bearer`. | `app/api/cron/cleanup-pending/route.ts` |
| 6 | Extensión de archivo en uploads sin sanitizar (`file.name.split(".").pop()`): podía contener `/` y crear rutas raras en el bucket. | Sanitizada a `[a-z0-9]` (máx 8 chars). | `app/api/orders/[id]/ticket-upload/route.ts`, `.../invoice-upload/route.ts` |

## Hallazgos corregidos — RLS (Supabase)

Ejecutados vía SQL Editor. Contexto clave: **todas las escrituras del backend
usan el service role, que ignora RLS**; estas políticas solo gobiernan el acceso
directo con la anon key desde el navegador.

| # | Hallazgo | Corrección | Script |
|---|----------|------------|--------|
| 7 | `course_registrations`: política de lectura `(user_id = auth.uid()) OR (user_id IS NULL)` → **cualquier visitante anónimo podía leer todas las inscripciones de invitados** (nombre, correo, teléfono). | Quitado el `OR user_id IS NULL` de SELECT e INSERT. Los invitados se inscriben por service role; no leen la tabla con anon key. | `sql-rls-fixes.sql` |
| 8 | `services` y `professionals` con políticas SELECT duplicadas (una `true`, otra `is_active = true`) → se exponían registros inactivos (se combinan con OR). | Eliminada la política permisiva `true`; queda solo la de `is_active`. | `sql-rls-fixes.sql` |
| 9 | `users` sin política de UPDATE (el modelo permite editar la fila propia). | Agregada UPDATE atada a `auth.uid() = id` en USING y WITH CHECK. | `sql-rls-fixes.sql` |
| 10 | `subcategories`: RLS habilitado con 0 políticas → bloqueada para anon key; el buscador la consulta con anon, así que las sugerencias de subcategoría nunca aparecían (fallo silencioso). | Política de lectura pública (mismo patrón que `categories`). | `sql-rls-subcategories-read.sql` |

## Verificado y en buen estado (sin cambios)

- **8 tablas con RLS y 0 políticas están bloqueadas a propósito** — solo las lee
  el service role desde el servidor: `app_settings`, `service_filters`,
  `professional_filter_links`, `appointment_service_options`, `course_images`,
  `studio_settings`, `studio_weekly_hours`, `notification_log`.
- No hay IDOR en lo revisado: cancelar órdenes/citas y subir archivos filtran
  por `user_id` del usuario autenticado.
- El OTP se guarda hasheado (SHA-256), los inputs se validan con Zod, `.env.local`
  no está en git, y el único `dangerouslySetInnerHTML` es CSS estático (sin XSS).
- El webhook usa idempotencia (`claim*` + `email_sent`) y consulta el pago a la
  API de MP con el access token (no confía en el body).

## Pendiente (siguiente sprint)

- **Verificar en Vercel (producción) que `MERCADOPAGO_WEBHOOK_SECRET` exista.**
  Con el hallazgo #3, si falta, el webhook deja de acreditar pagos (por diseño,
  para no procesar sin firma). Ver `docs/delivery/pendientes/mercadopago.md`.
- Opcional: rate limiting a nivel plataforma (Vercel WAF) para `/api/auth/*` y
  `/api/phone/*` como refuerzo del límite en memoria (que es por instancia).

## Scripts SQL de esta auditoría

- `docs/delivery/sql-phone-otp-limits.sql` — columnas de límites del OTP (**correr**).
- `docs/delivery/sql-rls-audit.sql` — queries de diagnóstico (solo lectura).
- `docs/delivery/sql-rls-fixes.sql` — correcciones #7, #8, #9.
- `docs/delivery/sql-rls-subcategories-read.sql` — corrección #10.
