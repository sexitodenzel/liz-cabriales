const storeButtonHover =
  "transition-all duration-200 ease-out hover:bg-neutral-900 hover:text-white active:scale-[0.97] active:duration-75 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-400 disabled:active:scale-100"

export const storeCardButtonClassName = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-2 py-2 text-[10px] font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

export const storeIconButtonClassName = [
  "shrink-0 cursor-pointer p-0.5 text-neutral-900 transition-all duration-200 ease-out hover:scale-110 hover:text-[#c6a75e] hover:drop-shadow-[0_0_6px_rgba(201,168,76,0.55)] active:scale-90 active:duration-75",
  "disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:scale-100 disabled:hover:text-neutral-300 disabled:hover:drop-shadow-none disabled:active:scale-100",
].join(" ")

export const storeDetailButtonClassName = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-5 py-3 text-sm font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
].join(" ")

export const storeInlineButtonClassName = [
  "inline-flex items-center justify-center rounded-full border border-neutral-900 bg-white px-4 py-2 text-[11px] font-normal uppercase tracking-wide text-neutral-900",
  storeButtonHover,
].join(" ")

const storeCheckoutBase = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 font-normal uppercase tracking-wide text-white",
  "transition-all duration-200 ease-out hover:bg-neutral-800 active:scale-[0.97] active:duration-75",
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:active:scale-100",
].join(" ")

export const storeCheckoutButtonClassName = [
  storeCheckoutBase,
  "px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-[11px]",
].join(" ")

export const storeCheckoutDetailButtonClassName = [
  storeCheckoutBase,
  "px-5 py-3 text-sm",
].join(" ")

// Botón principal de la página de detalle: pill negro sólido — hermano del
// storeCheckoutDetailButtonClassName (mismo rounded-full/negro) con la
// escala y tracking del hero.
export const storeHeroAddToCartClassName = [
  "inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-white",
  "transition-all duration-200 ease-out hover:bg-neutral-800 active:scale-[0.98] active:duration-75",
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:active:scale-100",
].join(" ")

// Default "iluminar dorado" hover effect for interactive elements in the store
// (color shift + soft gold drop-shadow glow). Pair with click feedback below.
export const storeGoldHoverGlow =
  "hover:text-[#c6a75e] hover:drop-shadow-[0_0_6px_rgba(201,168,76,0.55)]"

// Toolbar icon buttons (grid/list switcher, etc.) — click feedback baked in.
// Consumer adds its own active-state colors; pair inactive state with storeGoldHoverGlow.
export const storeToolbarIconClassName = [
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full",
  "transition-all duration-200 ease-out active:scale-90 active:duration-75",
].join(" ")

// Text + icon trigger button (Filtrar / Ordenar) — click feedback baked in.
// Consumer adds its own active-state colors; pair inactive state with storeGoldHoverGlow.
export const storeToolbarTriggerClassName = [
  "inline-flex cursor-pointer items-center gap-2 text-[13px] tracking-wide",
  "transition-all duration-200 ease-out active:scale-95 active:duration-75",
].join(" ")
