# Sistema de reseñas (julio 2026)

Tres capas independientes. Las dos primeras son dinámicas (Supabase), la
tercera es contenido curado en código.

## 1. Reseñas propias con estrellas (compra/inscripción verificada)

Dos sistemas espejo con la misma arquitectura:

| | Productos | Cursos |
|---|---|---|
| Tabla | `product_reviews` | `course_reviews` |
| SQL | `docs/delivery/sql-product-reviews.sql` ✅ corrido | `docs/delivery/sql-course-reviews.sql` ✅ corrido |
| Quién puede reseñar | Compra pagada del producto (`order_items` en orden con status distinto de pending/cancelled) | Inscripción `paid` al curso (cursos ya realizados) |
| Capa de datos | `lib/supabase/product-reviews.ts` | `lib/supabase/course-reviews.ts` |
| API pública | `GET/POST /api/products/[id]/reviews` | `GET/POST /api/courses/[id]/reviews` |
| API moderación | `/api/admin/product-reviews/[id]` | `/api/admin/reviews/[id]` |
| UI pública | `app/tienda/components/ProductReviews.tsx` en la página de producto + estrellas bajo el título (`ProductInfoPanel`, anchor `#resenas`) | `app/academia/[id]/CourseReviews.tsx` en cursos pasados |
| Moderación | `/admin/resenas` (listado global) | Página de edición del curso |

Reglas comunes: 1 reseña por usuaria por entidad (upsert editable), rating
1–5, comentario opcional ≤1000 chars, `is_approved` para ocultar sin borrar,
RLS que replica la verificación en la base (defensa en profundidad: la API
valida con service role Y la política de insert exige la compra/inscripción).

Detalle de diseño: la página de producto se sirve cacheada, así que
`ProductReviews` hidrata elegibilidad y frescura client-side con el GET
(que incluye `canReview`/`ownReview` si hay sesión). Todo degrada a vacío
sin romper si la tabla no existe.

Para avalar alumnas históricas de cursos: inscripción manual desde el admin
(`addManualRegistration`).

## 2. Reseñas externas verificables (conócenos, `/sobre-liz`)

`app/sobre-liz/components/VerifiedReviews.tsx` + const `VERIFIED_REVIEWS` en
`app/sobre-liz/page.tsx`. Curado a mano porque las APIs de Google/Facebook no
permiten importar reseñas (ToS/límites):

- **Agregados oficiales** (cards oscuras con CTA a la fuente):
  - Google Maps: 5.0 · 3 opiniones — ficha por CID estable
    `https://maps.google.com/?cid=11615870019560735969`
  - Facebook: 100% recomendada · 8 opiniones — página
    `profile.php?id=100063880305172&sk=reviews`
- **Citas textuales** con badge "vía Facebook/Google": las 8 de Facebook y
  las 2 de Google con texto. Se agregan más en `VERIFIED_REVIEWS.quotes`.

Este bloque sustituyó al carrusel de testimonios ficticios (eliminado en el
commit `5d6360f`).

## 3. Prensa ("En los medios", `/sobre-liz`)

`app/sobre-liz/components/PressMentions.tsx` + const `PRESS_MENTIONS` en
`app/sobre-liz/page.tsx`. Cards con medio/titular/fecha que enlazan a la
publicación original (nota de Somos Noticias Mx del Seminario QAP 2025 y
entrevista en Revista Nail Krush 2021). La sección se oculta sola si la
lista queda vacía. Los permalinks de posts de Facebook se obtienen haciendo
hover real sobre el timestamp del post (el href está ofuscado hasta entonces).

## Placeholder pendiente

`app/servicios/reviews-data.ts` (`/servicios/resenas`) sigue siendo
placeholder hardcodeado del estudio; ya tiene campo `source` preparado para
migrar a reseñas reales (p. ej. las de Google del estudio).

## A11y

Pase registrado en `docs/a11y/reviews-medios-2026-07-18.md` (tokens de color,
aria-labels de estrellas, motion-safe, riesgos residuales aceptados).
