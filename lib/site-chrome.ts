/** Borde superior dinámico (anuncios + navbar). */
export const SITE_CHROME_TOP_CLASS =
  "top-[var(--site-chrome-bottom,var(--navbar-actual-h))]"

/** Panel fijo a ancho completo entre el chrome del sitio y el borde inferior del viewport. */
export const MOBILE_CHROME_PANEL_CLASS = `fixed inset-x-0 bottom-0 ${SITE_CHROME_TOP_CLASS}`

/** Misma zona útil, para contenedores `absolute` (p. ej. MobileDrawer). */
export const MOBILE_CHROME_INSET_CLASS = `inset-x-0 bottom-0 ${SITE_CHROME_TOP_CLASS}`
