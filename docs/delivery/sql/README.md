# Índice de scripts SQL

Migraciones y seeds que se corren **manualmente** en Supabase → SQL Editor. No se ejecutan
solos ni los usa el código en runtime (solo se referencian en mensajes de error para guiar
al mantenedor).

> **Verificado contra la base de datos real el 2026-08-12.** Las columnas/tablas de todos los
> scripts marcados abajo existen en Supabase. `ESTADO.md` (en `../golive/`) es la fuente de verdad.

**Cómo correr uno:** Supabase → SQL Editor → pegar el contenido del `.sql` → Run.
Los archivos `*-seed.sql` cargan datos de ejemplo/reales y **requieren primero** su migración base
(indicado en el encabezado de cada seed).

---

## 🔴 Pendiente de correr

| Script | Para qué |
|---|---|
| `sql-nail-art-view-cleanup.sql` | Cierra alerta "Security Definer View" (sin prisa; no bloquea) |

## ✅ Corridos (verificados en la BD 2026-08-12)

Las columnas/tablas de estos scripts **existen** en Supabase:

| Script | Verificado por |
|---|---|
| `sql-sprint-whatsapp.sql` | `users.phone_verified`, `orders.shipping_payment_status`, tabla `notification_log` |
| `sql-sprint5-supabase.sql` | `orders.requires_invoice`, `orders.rfc` |
| `sql-invoice-fields.sql` | `orders.invoice_status` |
| `sql-local-delivery.sql` | valor `local_delivery` aceptado en `orders.delivery_type` |
| `sql-instructor-title.sql` | `instructors.title` |
| `sql-course-instructors.sql` | tabla `course_instructors` |
| `sql-course-highlights.sql` | `courses.diploma_included`, `courses.highlights` |
| `sql-course-event-type.sql` | `courses.event_type` |
| `sql-course-short-description.sql` | `courses.short_description` |
| `sql-product-reviews.sql` | reseñas activas (docs) |
| `sql-course-reviews.sql` | reseñas de cursos (docs) |
| `sql-course-display-settings.sql` | controles públicos de curso (docs) |
| `sql-blog.sql` | 6 posts cargados en `blog_posts` |

## ❓ Verificar en Supabase (estado no confirmado en docs)

La mayoría corresponden a features que ya están vivas en el sitio, así que probablemente ya
se corrieron; confirmar caso por caso.

| Script | Para qué |
|---|---|
| `sql-announcements.sql` | Barra de anuncios |
| `sql-brand-description.sql` | Descripción editable por marca |
| `sql-brand-descriptions-seed.sql` | Seed de descripciones de marcas (requiere `sql-brand-description.sql`) |
| `sql-brands-home.sql` | Visibilidad de marcas en el home |
| `sql-course-gallery.sql` | Galería retrospectiva de cursos |
| `sql-course-gallery-cover.sql` | Portada de galería por curso |
| `sql-course-highlights-seed.sql` | Seed de chips (requiere `sql-course-highlights.sql`) |
| `sql-course-images.sql` | Galería de múltiples imágenes por curso |
| `sql-course-instructor-role.sql` | Rol del vínculo curso↔instructor |
| `sql-course-instructors-seed.sql` | Seed de maestros adicionales (requiere `sql-course-instructors.sql`) |
| `sql-course-swap-primary.sql` | Cambiar instructor principal en cursos con panel de ponentes |
| `sql-events-gallery.sql` | Galería de eventos en /sobre-liz |
| `sql-fix-orders-status-check.sql` | Fix del CHECK de estados en `orders` |
| `sql-instructor-seminario-seed.sql` | Seed de masters del seminario (requiere `sql-instructor-title.sql`) |
| `sql-instructor-titles-seed.sql` | Seed de títulos de masters (requiere `sql-instructor-title.sql`) |
| `sql-landing-slots.sql` | Slots configurables de la landing |
| `sql-landing-slots-cleanup-pillars.sql` | Limpieza de slots obsoletos del PillarStage |
| `sql-limpieza-datos-prueba.sql` | Limpieza de datos de prueba de la tienda |
| `sql-nail-art.sql` | Nail art UGC (ver `supabase/migrations/20260723_nail_art_ugc.sql`) |
| `sql-navbar-redesign.sql` | Rediseño del navbar/menú |
| `sql-organizer-mildred.sql` | Alta de Mildred Sainz como co-organizadora |
| `sql-phone-otp-limits.sql` | Límites anti-abuso del OTP de teléfono |
| `sql-product-abrasivity.sql` | Clasificación de abrasividad para puntas |
| `sql-product-desktop-image-mode.sql` | Modo de imagen en cards de producto (desktop) |
| `sql-product-discounts.sql` | Descuentos/ofertas por producto |
| `sql-product-search-synonyms.sql` | Sinónimos de búsqueda por producto |
| `sql-product-variant-attributes.sql` | Atributos visuales de presentaciones (color/talla) |
| `sql-restore-stock-on-cancel.sql` | Trigger: restaurar stock al cancelar pedido pagado |
| `sql-rls-audit.sql` | Auditoría de RLS (solo lectura) |
| `sql-rls-fixes.sql` | Correcciones de RLS (requiere revisar `sql-rls-audit.sql`) |
| `sql-rls-subcategories-read.sql` | Política de lectura para `subcategories` |
| `sql-seed-categories-menu.sql` | Seed de categorías/subcategorías del menú |
| `sql-seed-puntas.sql` | Seed de contenedores para puntas |
| `sql-shipping-profile.sql` | Campos de dirección de envío en el perfil |
| `sql-sprint5-supabase.sql` | Sprint 5: CFDI + trigger `handle_new_user` (Google OAuth) |
| `sql-stock-alerts.sql` | Alertas de "avísame cuando vuelva a haber stock" |
| `sql-subcategories.sql` | Subcategorías administrables |
