# Pase a11y — Cards de "Compra por colección" (2026-08-21)

Alcance: `app/components/home/TabbedShopper.tsx` (lo renderiza únicamente
`app/components/home/CategoriasSection.tsx`).

Rediseño: se quitó la caja gris (`bg-neutral-100`) con bordes pegados
(`-ml-px`, `border-neutral-300`). Ahora manda la foto (4/5, `rounded-xl`), las
acciones flotan sobre la imagen —chips blancos arriba a la derecha y, solo en
desktop, un pill negro que sube al hover— y el pie queda en marca / nombre /
precio.

## Corregido en este pase

- `hover:text-[#a8862f]` como color de texto sobre claro (prohibido por el
  audit) → token `text-gold` (#8a6d26): 4.72:1 sobre marfil, 4.89:1 sobre
  blanco. Eran dos usos: el hover del nombre (preexistente) y el del chip.
- El corazón de favoritos ahora expone `aria-pressed={wishlisted}`; antes el
  estado solo se comunicaba cambiando el `aria-label`.
- Los chips y el pill se montan como **hermanos** del enlace de la foto, no
  como hijos: un `<button>`/`<a>` dentro de otro `<a>` es HTML inválido y
  rompe la navegación por teclado. Verificado: 0 anclas anidadas en el SSR.
- Las acciones ocultas en desktop responden a `group-focus-within`, así que
  aparecen al tabular; `opacity-0` no impide el foco y el pill recupera
  `pointer-events` al enfocarse. El corazón ya marcado **no** se oculta: si se
  ocultara, en desktop no habría forma de ver el estado sin pasar el mouse.
- El reveal del pill es solo `opacity`/`transform`, con
  `motion-reduce:transition-none`.

Verificado: `tsc` limpio; SSR de `/` sin imgs sin alt, sin controles de solo
ícono sin nombre accesible, 1 h1 y sin anclas anidadas; contrastes calculados
(no estimados): marca `neutral-500` 4.58:1, nombre 19.12:1, ícono del chip
17.93:1, pill blanco sobre negro 17.93:1.

## Riesgo residual aceptado

- El **precio** sigue en `#c6a75e` sobre marfil = **2.23:1**, muy por debajo de
  4.5:1. No es de este pase: es el dorado de precio unificado de toda la
  tienda (53 archivos con `text-[#c6a75e]`, incluidos `ProductCard`, PDP,
  carrito y checkout), y cambiarlo solo aquí dejaría la landing en un dorado
  distinto al del catálogo. La salida, cuando se decida, es migrar el precio a
  `text-gold` (#8a6d26 = 4.72:1) en toda la tienda de una sola pasada. En el
  footer negro el mismo `#c6a75e` sí es válido y no debe tocarse.
- El precio tachado usa `text-neutral-400` (2.44:1). Es información duplicada
  (el precio vigente está al lado en tamaño mayor) y el patrón viene de
  `ProductCard`; se migra junto con el punto anterior.
- ESLint marca `react-hooks/set-state-in-effect` en el efecto del reveal
  (línea ~327). Es preexistente y también está en `BeforeAfterShowcase.tsx`;
  fuera del alcance de este pase.
