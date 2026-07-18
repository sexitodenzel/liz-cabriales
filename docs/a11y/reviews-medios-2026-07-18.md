# Pase a11y — Reviews de productos + En los medios + Reseñas de Facebook (2026-07-18)

Alcance: `app/tienda/components/ProductReviews.tsx`, estrellas en
`ProductInfoPanel.tsx`, `app/sobre-liz/components/PressMentions.tsx`,
`app/sobre-liz/components/FacebookReviews.tsx`.

## Corregido en este pase

- Fechas `#9a9a9a` sobre blanco (2.81:1) → `#6b6b6b` (5.33:1) en los tres
  componentes nuevos.
- `#a8862f` hardcodeado como texto sobre claro (3.15:1 sobre neutral-100) →
  token `text-gold` (#8a6d26) en ProductReviews, FacebookReviews y el hover
  del ícono externo de PressMentions.
- `Stars` de ProductReviews ahora expone `role="img"` +
  `aria-label="N de 5 estrellas"` (antes el rating de cada reseña era solo
  visual).
- Zoom de imagen en cards de PressMentions condicionado a `motion-safe:`.

Verificado: tsc limpio; SSR de `/sobre-liz` y `/tienda/[slug]` sin imgs sin
alt, 1 h1, sin bloqueo de zoom; contrastes calculados (no estimados).

## Riesgo residual aceptado

- `text-gold` (#8a6d26) sobre `bg-neutral-100` (#f5f5f5) = **4.48:1**, un pelo
  bajo 4.5:1 para los eyebrows de 11px del formulario de reseña ("Compra
  verificada"). Mismo patrón ya existente en cards de cuenta. Si se endurece
  el criterio, la salida es subir el eyebrow a 12px semibold o mover el
  formulario a `bg-white` (4.89:1).
- La inicial del avatar en reseñas usa `text-gold` sobre `#c6a75e/15` (~4.4:1);
  es decorativa (el nombre completo está al lado), no bloqueante.
- `CourseReviews.tsx` y `TestimonialsCarousel.tsx` (preexistentes) aún usan
  `#a8862f`/`#9a9a9a` como texto sobre claro — mismo hallazgo, fuera del
  alcance de este pase. Migrarlos igual que aquí cuando se toquen.
