// Botones de la tienda. Un solo lenguaje, igual que el Button oficial del
// sitio: pill NEGRO sólido → hover DORADO (#c6a75e, el mismo dorado de los
// precios de producto). Antes había pills blancos de contorno (font-normal,
// tracking-wide) que hacían ver la tienda como otra marca.

const storeButtonBase = [
  "inline-flex items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 font-semibold uppercase text-white",
  "transition-all duration-200 ease-out hover:border-neutral-800 hover:bg-neutral-800 active:scale-[0.97] active:duration-75",
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:border-neutral-200 disabled:hover:bg-neutral-100 disabled:active:scale-100",
].join(" ")

// Botón dentro de card de producto (grid). Texto chico responsivo.
export const storeCardButtonClassName = [
  storeButtonBase,
  "w-full px-2 py-2 text-[10px] tracking-[0.14em] sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

// Icono suelto (wishlist, etc.): sin fondo, glow dorado en hover.
export const storeIconButtonClassName = [
  "shrink-0 cursor-pointer p-0.5 text-neutral-900 transition-all duration-200 ease-out hover:scale-110 hover:text-[#c6a75e] hover:drop-shadow-[0_0_6px_rgba(198,167,94,0.55)] active:scale-90 active:duration-75",
  "disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:scale-100 disabled:hover:text-neutral-300 disabled:hover:drop-shadow-none disabled:active:scale-100",
].join(" ")

// Botón ancho en página de detalle (PDP).
export const storeDetailButtonClassName = [
  storeButtonBase,
  "w-full px-5 py-3 text-[12px] tracking-[0.14em]",
].join(" ")

// Botón inline compacto.
export const storeInlineButtonClassName = [
  storeButtonBase,
  "px-4 py-2 text-[11px] tracking-[0.14em]",
].join(" ")

// CTA de checkout / carrito (ancho). Mismo pill negro → hover dorado.
export const storeCheckoutButtonClassName = [
  storeButtonBase,
  "w-full px-2 py-2 text-[10px] tracking-[0.14em] sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

export const storeCheckoutDetailButtonClassName = [
  storeButtonBase,
  "w-full px-5 py-3 text-sm tracking-[0.14em]",
].join(" ")

// CTA principal del detalle (Agregar al carrito) — escala mayor del hero.
export const storeHeroAddToCartClassName = [
  storeButtonBase,
  "w-full px-6 py-4 text-[13px] tracking-[0.16em]",
].join(" ")

// "Iluminar dorado" para elementos interactivos sueltos de la tienda.
export const storeGoldHoverGlow =
  "hover:text-[#c6a75e] hover:drop-shadow-[0_0_6px_rgba(198,167,94,0.55)]"

// Iconos de toolbar (grid/lista, etc.).
export const storeToolbarIconClassName = [
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full",
  "transition-all duration-200 ease-out active:scale-90 active:duration-75",
].join(" ")

// Triggers de texto+icono (Filtrar / Ordenar).
export const storeToolbarTriggerClassName = [
  "inline-flex cursor-pointer items-center gap-2 text-[13px] tracking-wide",
  "transition-all duration-200 ease-out active:scale-95 active:duration-75",
].join(" ")
