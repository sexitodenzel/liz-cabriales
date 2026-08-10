/**
 * Los megamenús son `hidden md:block`: en móvil nunca se muestran, pero React
 * los monta igual, así que sus efectos de precarga corrían en TODAS las visitas
 * de celular. En una página de producto eso significaba ~25 llamadas a la API y
 * ~76 imágenes de tiles que el visitante jamás vería, compitiendo por el ancho
 * de banda con las imágenes de la página real (la espera "eterna" en móvil).
 *
 * Esta puerta deja la precarga solo donde el megamenú existe de verdad: ancho
 * >= 768px (el breakpoint `md` de Tailwind) y puntero fino con hover, que es la
 * única forma de abrirlo. Se evalúa al correr el efecto, no en render, para no
 * desincronizar el HTML del servidor con el del cliente.
 */
export function canPrefetchMegaMenu(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  )
}
