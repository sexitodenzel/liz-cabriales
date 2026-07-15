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
 *                             sticky, p.ej. el header del wizard de servicios).
 *     · NO → "plain"          sidebar que solo debe quedarse visible; el hueco
 *                             que deja el navbar al colapsar es aire aceptable.
 *                             (Sin follow no hay salto ni necesita guard/park.)
 *
 * Modificadores:
 *   · guard: true → SOLO si hay un HERO alto ENCIMA de la barra. Evita que el
 *                   navbar colapse antes de que la barra dockee (si no, abre un
 *                   hueco con el hero asomándose). Marca data-nav-collapse-guard,
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

export type NavStickyRecipe = "follow" | "follow-below" | "plain"

const RECIPE_CLASS: Record<NavStickyRecipe, string> = {
  follow: "navbar-follow-collapse sticky top-[var(--navbar-actual-h)]",
  "follow-below":
    "navbar-follow-collapse sticky top-[calc(var(--navbar-actual-h)+5.5rem)]",
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
