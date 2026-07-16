# A11y — Megamenús del navbar (Academia / Servicios) + cards móvil

Fecha: 2026-07-15
Alcance: `AcademiaMegaMenu`, `ServiciosMegaMenu` (rediseño a 2 paneles), flyers de
próximos cursos, placeholders de servicio, y las cards equivalentes en el drawer
móvil (`MobileDrawer` → secciones Academia/Servicios). Filtro nuevo "Tipo de
evento" en `/academia`.

## OK verificado
- Contraste de texto propio nuevo (calculado WCAG sobre `--color-ivory` #fbfbfa /
  blanco):
  - Títulos/columnas `#1a1a1a` sobre ivory → **16.81:1** ✓
  - Sublinks `neutral-700` sobre ivory → **10.01:1** ✓
  - Label de tile `neutral-600` sobre `neutral-100` → **7.17:1** ✓
  - Badge "Próximamente" corregido `neutral-400`→`neutral-600` (2.52 → 7.17) ✓
- Teclado: todos los items clickeables son `<Link>`/`<button>`; los tiles
  placeholder son `<div>` no interactivos (sin `onClick`, correcto). Rieles con
  `onMouseEnter`/`onFocus`. Esc cierra ambos megamenús. Sin `outline-none` nuevo.
- Semántica: flyers con `alt={course.title}`; chips de nivel sobre imagen oscura
  (`#e2c06f` sobre `#141414/55`, patrón existente de las cards de academia).
- Drawer móvil: reutiliza el patrón de `NailArtPanel` (grid 2 col aspect-[3/4]),
  ajustado al ancho del drawer; usa el componente `Drawer` (focus trap + Esc).

## Riesgo pendiente (SISTÉMICO, no bloqueante)
- Los enlaces "Ver…" dorados de **todos** los megamenús usan `--color-gold-soft`
  (`#c9a84c` / `#C6A75E`) como texto sobre ivory → **~2.2:1**, por debajo de
  4.5:1. Afecta por igual a `TiendaMegaMenu`, `LizMegaMenu`, `BrandsMegaMenu`,
  `DesktopMegaMenu` y ahora Academia/Servicios (se mantuvo el color para no
  romper la alineación visual con la tienda, que era el objetivo del cambio).
  - **Fix recomendado (global, en un solo barrido):** cambiar esos enlaces y el
    estado activo del riel a `--color-gold` (`#8a6d26` → **4.72:1** ✓). Debe
    hacerse en los 5 megamenús a la vez para no introducir dos dorados distintos.
  - No se aplicó aquí para no expandir el alcance a componentes fuera de esta
    tarea ni divergir de la referencia (Tienda) de forma parcial.
