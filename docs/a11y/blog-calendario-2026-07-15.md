# Pase a11y — Blog + Calendario de academia (2026-07-15)

Superficies nuevas revisadas: `/blog`, `/blog/[slug]`, vista **Calendario** de
`/academia` (`app/academia/CourseCalendar.tsx` + toggle en `CourseGrid.tsx`) y el
form admin `app/admin/blog/BlogForm.tsx`.

## Contraste — corregido (todos ≥ 4.5:1)

Cálculo WCAG (script del audit base). Se ajustaron los tokens de tags/chips y
grises que quedaban por debajo de 4.5:1 en texto pequeño:

- Chips de tipo de evento (`app/academia/event-types.ts`): texto oscurecido a
  `#7a5f21` (curso, taller internacional), `#856025` (taller nacional). Marcador
  "HOY" del calendario: fondo `#c9a84c` → `#8a6d26` (blanco encima = 4.89:1).
- Tags del blog (`lib/blog-categories.ts`): Tips `#7a5f21`, Tendencias `#8f4a30`,
  Cuidado `#4c6a3d` (Inspiración/Novedades ya pasaban).
- `/blog`: fecha `#a8a8a8` y excerpt `#8a8a8a` → `#6b6b6b`; CTA y labels
  `#a8862f` → `#8a6d26` (token gold); píldoras activas de categoría
  `bg-[#c9a84c] text-white` → `bg-[#8a6d26] text-white`.
- `/blog/[slug]`: mismos reemplazos (`#a8862f`→`#8a6d26`, grises→`#6b6b6b`).
- Chip de tipo en las cards del grid (`CourseGrid.tsx`): texto `#8a6d26` → `#7a5f21`.

No se reintrodujo `#c9a84c`/`#a8862f` como color de **texto** sobre claro.
`#c9a84c` queda solo en hairlines/bordes decorativos y dots del calendario
(reforzados siempre con etiqueta de texto, no color solo).

## Teclado / semántica — OK

- Toggle de vista (Cuadrícula/Lista/**Calendario**) usa `<button aria-label>` +
  `aria-pressed`. Navegación de mes con botones `aria-label`.
- Chips de evento del calendario y cards son `<Link>`; nada de `div onClick`.
- `/blog` y `/blog/[slug]`: un solo `<h1>`. Imágenes con `alt` descriptivo
  (o placeholder con alt del título). Tiles de categoría = `<Link>`.
- No se tocó el anillo `:focus-visible` global ni el viewport (zoom libre).

## Riesgo aceptado

- **Orden de headings h1→h3 en `/blog/[slug]`:** el cuerpo se renderiza con el
  componente compartido `components/shared/RichText.tsx`, que emite `##`/`###`
  como `<h3>`. Tras el `<h1>` del título, el primer subtítulo del cuerpo es un
  `<h3>` (salta el nivel 2). Es el **mismo patrón ya presente y auditado** en las
  páginas de curso (`CourseDetail`) y nail-art; no se refactoriza el componente
  compartido en este cambio. Si se decide corregir, hacerlo en `RichText` (emitir
  `<h2>`) para todo el sitio a la vez.

## Pendiente de datos

Las páginas dependen de dos migraciones manuales (aún sin correr en Supabase):
`docs/delivery/sql-blog.sql` y `docs/delivery/sql-course-event-type.sql`. Lectura
resiliente: sin ellas, `/blog` muestra estado vacío y el calendario omite
`event_type`. El escaneo SSR completo con datos reales queda para después de
correr los SQL.
