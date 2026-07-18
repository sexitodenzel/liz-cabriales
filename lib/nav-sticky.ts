/**
 * Recetas ÚNICAS para stickys que conviven con el colapso del navbar
 * (barras de filtros, headers de wizard, sidebars de detalle, cart bar).
 *
 * Árbol de decisión (ver memoria "navbar-follow-collapse-recipe"):
 *
 *   ¿La barra debe ABRAZAR el navbar? (full-width; si se despega deja una
 *   rendija con el contenido asomándose detrás)
 *     · SÍ → "follow"        pegada al navbar, viaja con él (transform GPU).
 *            "follow-below"   igual, 5.5rem más abajo (debajo de otra barra
 *                             sticky alta, p.ej. header con título).
 *            "follow-below-sm" igual, 3.75rem más abajo (debajo de una barra
 *                             corta, p.ej. breadcrumbs del wizard de servicios).
 *     · NO → "plain"          sidebar que solo debe quedarse visible; el hueco
 *                             que deja el navbar al colapsar es aire aceptable.
 *                             (Sin follow no hay salto ni necesita guard/park.)
 *
 * Modificadores:
 *   · guard: true → si hay contenido ENCIMA de la barra (hero, título de paso)
 *                   que aún scrollea cuando el header superior ya dockeó.
 *                   Evita que el navbar colapse antes de que ESTA barra dockee
 *                   (si no, follow-collapse la traslada -56px en flujo y abre
 *                   hueco / recorta el título). Marca data-nav-collapse-guard,
 *                   que el motor de colapso de Navbar.tsx lee genéricamente.
 *   · park       → si la barra agota su columna y al final el -56px la deja
 *                  descansando 56px arriba del borde, usa el hook
 *                  useNavFollowParked (necesita ref/efecto, no cabe en className).
 *                  Ver lib/hooks/use-nav-follow-parked.
 *
 * Gotcha de alineación (bug "se pasa la cajita"): un sticky se alinea al FONDO
 * de su columna vecina; si esa columna termina con margin-bottom (un grid item
 * crea BFC y ese margen NO colapsa) el sticky cae ese margen de más. Quita el
 * margin de la última sección de la columna.
 *
 * ⚠️ Tailwind JIT solo genera clases que aparecen como STRING LITERAL en el
 *    código escaneado. Por eso cada receta es un literal COMPLETO aquí y el
 *    offset NO se interpola. Para un offset distinto, añade una receta nueva
 *    (no la construyas con template strings) o el `top-[...]` no se generará.
 */

/**
 * Evento (window) que Navbar.tsx dispara cada vez que el colapso Hermès
 * CAMBIA de estado (no en cada scroll). detail: { collapsed }. Lo consume el
 * hero de home (HomeHeroTriCards) en ≥1200px como única fuente de verdad de
 * su compactado: colapso del navbar y coreografía del hero arrancan en el
 * mismo frame, y el estado compacto solo existe con navbar colapsado — que es
 * exactamente lo que asume la geometría de --home-hero-inset (72px).
 */
export const NAV_COLLAPSE_EVENT = "lc-nav-collapse"

export type NavCollapseEventDetail = { collapsed: boolean }

export type NavStickyRecipe =
  | "follow"
  | "follow-below"
  | "follow-below-sm"
  | "plain"

const RECIPE_CLASS: Record<NavStickyRecipe, string> = {
  follow: "navbar-follow-collapse sticky top-[var(--navbar-actual-h)]",
  "follow-below":
    "navbar-follow-collapse sticky top-[calc(var(--navbar-actual-h)+5.5rem)]",
  "follow-below-sm":
    "navbar-follow-collapse sticky top-[calc(var(--navbar-actual-h)+3.75rem)]",
  plain: "sticky self-start top-[calc(var(--navbar-actual-h,64px)+1.5rem)]",
}

export type NavStickyProps = {
  className: string
  "data-nav-collapse-guard"?: ""
}

/**
 * Props (className + guard opcional) para un sticky que convive con el navbar.
 *
 * @param recipe  receta del árbol de decisión de arriba.
 * @param extra   clases visuales propias del elemento. DEBEN ir como literal en
 *                el JSX que llama (Tailwind las escanea ahí, no en runtime).
 * @param opts.guard  marca data-nav-collapse-guard (solo con hero encima).
 *
 * @example
 *   <header {...navSticky("follow", "z-30 border-b bg-white/95 backdrop-blur")}>
 *   <aside {...navSticky("plain", "rounded-xl border p-7")}>
 */
export function navSticky(
  recipe: NavStickyRecipe,
  extra = "",
  opts: { guard?: boolean } = {},
): NavStickyProps {
  const className = extra
    ? `${RECIPE_CLASS[recipe]} ${extra}`
    : RECIPE_CLASS[recipe]
  return opts.guard
    ? { className, "data-nav-collapse-guard": "" }
    : { className }
}
