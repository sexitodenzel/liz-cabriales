"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Search, ShoppingBag, X, Heart, User } from "lucide-react"
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { getSearchDestination } from "@/lib/search-navigation"
import { tiendaCategories, cursosCategories } from "./menuData"
import CartMenu from "./dropdowns/CartMenu"
import AcademiaMegaMenu from "./dropdowns/AcademiaMegaMenu"
import TiendaMegaMenu from "./dropdowns/TiendaMegaMenu"
import ServiciosMegaMenu from "./dropdowns/ServiciosMegaMenu"
import BrandsMegaMenu from "./dropdowns/BrandsMegaMenu"
import NailArtMegaMenu from "./dropdowns/NailArtMegaMenu"
import LizMegaMenu from "./dropdowns/LizMegaMenu"
import MobileDrawer from "./MobileDrawer"
import MobileSearchOverlay from "./MobileSearchOverlay"
import { type BrandMenuItem } from "@/lib/navbar/brands-category"
import {
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import { useInstantSearch } from "./useInstantSearch"
import { flattenPayload } from "@/lib/search/types"
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from "@/lib/search/recent-searches"
import { useCart } from "../cart/CartContext"
import { useWishlist } from "../wishlist/WishlistContext"
import WishlistCountBadge from "../wishlist/WishlistCountBadgeClient"
import SlidingNumber from "../ui/motion/sliding-number"

type DesktopMenu = "Tienda" | "Academia" | "Servicios" | "Marcas" | "Nail Art" | "Conócenos" | null

type NavbarProps = {
  isLoggedIn?: boolean
  /** Barra de anuncios (server component). Es la fila que se comprime. */
  announcement?: ReactNode
}

const COMPACT_DESKTOP_MAX_WIDTH = 1200

// Borde inferior del chrome expandido (px) = anuncios + filas del navbar. El
// header sticky nunca lleva transform (lo lleva .navbar-shell), así que su
// offsetHeight es la medida exacta — y a diferencia de --navbar-actual-h no se
// queda obsoleta si la barra de anuncios llega por streaming después de
// hidratar. Se lee una vez por breakpoint / resize, no por frame.
function readNavbarBottom(): number {
  const header = document.getElementById("site-navbar")
  if (header && header.offsetHeight > 0) return header.offsetHeight
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--navbar-actual-h"
  )
  const value = parseFloat(raw)
  return Number.isFinite(value) ? value : 104
}

const DESKTOP_NAV_ITEMS = [
  { label: "Tienda" as const, href: "/tienda", menu: "Tienda" as const },
  { label: "Servicios" as const, href: "/servicios", menu: "Servicios" as const },
  { label: "Academia" as const, href: "/academia", menu: "Academia" as const },
  { label: "Nail Art" as const, href: "/nail-art", menu: "Nail Art" as const },
  { label: "Marcas" as const, href: "/marcas", menu: "Marcas" as const },
  { label: "Conócenos" as const, href: "/sobre-liz", menu: "Conócenos" as const },
] as const

export default function Navbar({ isLoggedIn = false, announcement = null }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [brandMenuItems, setBrandMenuItems] = useState<BrandMenuItem[]>([])
  const { payload: searchPayload, loading: suggestionsLoading } =
    useInstantSearch(searchQuery)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [topSearches, setTopSearches] = useState<TopSearchChip[]>([])
  const [bestSellers, setBestSellers] = useState<SearchSuggestionProduct[]>([])
  const [emptyStateLoading, setEmptyStateLoading] = useState(true)
  const emptyStateLoadedRef = useRef(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isCompactDesktop, setIsCompactDesktop] = useState(false)
  const [isDesktopWidth, setIsDesktopWidth] = useState(false)
  const [activeMenu, setActiveMenu] = useState<DesktopMenu>(null)
  const [navBarStyle, setNavBarStyle] = useState({ left: 0, width: 0, visible: false })
  const [navBarAnimate, setNavBarAnimate] = useState<"grow" | "slide">("grow")
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navBarStyleRef = useRef({ left: 0, width: 0, visible: false })
  const activeMenuRef = useRef<DesktopMenu>(null)
  const overlayOpenRef = useRef(false)
  const navRef = useRef<HTMLElement>(null)
  const navLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const headerRef = useRef<HTMLElement>(null)
  const overlayGuardRef = useRef(false)
  const {
    itemCount,
    isLoading: cartLoading,
    isCartOpen,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
  } = useCart()
  const { count: wishlistCount, hydrated: wishlistHydrated } = useWishlist()

  // Suspense alrededor del navbar (layout) permite hidratación selectiva: el
  // CartProvider puede terminar de leer localStorage ANTES de que este Navbar
  // hidrate. Si el badge depende solo de cartLoading, el cliente ya trae
  // itemCount > 0 y no coincide con el HTML del server (sin badge).
  // hasMounted es por instancia y siempre false en el primer render → match.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const cartBadgeCount = hasMounted && !cartLoading ? itemCount : 0
  const wishlistBadgeCount = hasMounted && wishlistHydrated ? wishlistCount : 0

  const clearMenuCloseTimer = () => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current)
      menuCloseTimerRef.current = null
    }
  }
  const getNavLinkRect = (menu: Exclude<DesktopMenu, null>) => {
    const link = navLinkRefs.current.get(menu)
    if (!link) return null
    return { left: link.offsetLeft, width: link.offsetWidth }
  }
  const applyNavBarStyle = (style: { left: number; width: number; visible: boolean }) => {
    navBarStyleRef.current = style
    setNavBarStyle(style)
  }
  const hideNavBar = () => {
    setNavBarAnimate("grow")
    applyNavBarStyle({ ...navBarStyleRef.current, width: 0, visible: false })
  }
  const updateNavBar = (menu: Exclude<DesktopMenu, null>) => {
    const target = getNavLinkRect(menu)
    if (!target) return

    const prev = navBarStyleRef.current
    const wasVisible = prev.visible && prev.width > 0

    if (!wasVisible) {
      setNavBarAnimate("grow")
      applyNavBarStyle({ left: target.left, width: 0, visible: true })
      requestAnimationFrame(() => {
        applyNavBarStyle({ ...target, visible: true })
      })
      return
    }

    setNavBarAnimate("slide")
    applyNavBarStyle({ ...target, visible: true })
  }
  const scheduleMenuClose = () => {
    clearMenuCloseTimer()
    // Grace corto: solo para cruzar el puente nav → panel (~20px CSS).
    // Antes 320ms se sentía ~1s al salir hacia zonas sin desplegable.
    menuCloseTimerRef.current = setTimeout(() => {
      setActiveMenu(null)
      hideNavBar()
    }, 80)
  }
  const openDesktopMenu = (menu: Exclude<DesktopMenu, null>) => {
    clearMenuCloseTimer()
    closeCart()
    setMobileSearchOpen(false)
    setDrawerOpen(false)
    setActiveMenu(menu)
  }
  const handleNavMouseEnter = (menu: Exclude<DesktopMenu, null>) => {
    clearMenuCloseTimer()
    openDesktopMenu(menu)
    updateNavBar(menu)
  }

  useEffect(() => {
    if (!activeMenu) {
      hideNavBar()
    }
  }, [activeMenu])

  useEffect(() => {
    if (!activeMenu) return
    const handleResize = () => updateNavBar(activeMenu)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [activeMenu])

  useEffect(() => () => clearMenuCloseTimer(), [])

  activeMenuRef.current = activeMenu
  overlayOpenRef.current = Boolean(
    activeMenu || isCartOpen || drawerOpen || mobileSearchOpen
  )

  useEffect(() => {
    document.documentElement.classList.toggle("navbar-menu-open", Boolean(activeMenu))
    return () => {
      document.documentElement.classList.remove("navbar-menu-open")
    }
  }, [activeMenu])

  // Compresión del chrome (todas las vistas): bajar comprime; solo vuelve a
  // mostrarse al llegar al tope real de la página (no con cualquier scroll
  // hacia arriba a media página). Lo único que se va es la barra de
  // anuncios; el navbar es permanente. CSS mueve con transform
  // html.lc-nav-collapsed (ver globals.css, --navbar-collapse-shift) — 100%
  // GPU. Umbral de colapso ACUMULADO: micro-scrolls no togglean.
  useEffect(() => {
    const mqDesktopNav = window.matchMedia("(min-width: 1200px)")
    const COLLAPSE_AFTER = 40
    let lastY = window.scrollY
    let acc = 0
    // Barra sticky de la página que sigue el hide (marcada con
    // data-nav-collapse-guard). Se cachea entre frames; se re-consulta si el
    // elemento se desmonta al cambiar de ruta.
    let guardEl: HTMLElement | null = null
    // Borde inferior del chrome EXPANDIDO (sin transform) = anuncios + navbar.
    let navbarBottom = readNavbarBottom()
    // Línea de dock del guard: su `top` sticky resuelto en px.
    let guardDockTop = navbarBottom

    const setCollapsed = (collapsed: boolean) => {
      document.documentElement.classList.toggle("lc-nav-collapsed", collapsed)
    }

    const update = () => {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      const root = document.documentElement

      // Menú / overlays abiertos: CONGELAR el estado actual, no forzar el
      // expandido. El navbar ya está siempre visible, así que devolver la barra
      // de anuncios solo serviría para empujar el megamenú 36px hacia abajo
      // justo al abrirlo (el panel es `top-full` del header).
      if (overlayOpenRef.current) {
        acc = 0
        return
      }

      // La barra de anuncios ya no consume scroll (viaja dentro del header
      // sticky), así que la zona de reposo es el tope real de la página.
      const inTopZone = y <= 24
      const collapsed =
        !inTopZone && root.classList.contains("lc-nav-collapsed")

      // Guard dock (móvil + desktop): no colapsar hasta que la barra sticky
      // con [data-nav-collapse-guard] se haya pegado. Si el navbar se oculta
      // mientras la barra aún baja por el hero, el follow-collapse la traslada
      // en flujo y queda "pegada" rara / con hueco (academia/tienda móvil).
      if (!collapsed && (!guardEl || !guardEl.isConnected)) {
        // El streaming SSR de Next deja una copia OCULTA de la página dentro de
        // <div hidden id="S:x"> (plantilla de un boundary Suspense). Esa copia
        // duplica el [data-nav-collapse-guard] con tamaño 0 y offsetParent null.
        // Tomar el primero por querySelector funciona por orden de documento,
        // pero es frágil: si la copia oculta quedara primero, su rect top=0
        // haría creer que el guard ya dockeó y el navbar colapsaría sobre el
        // hero. Elegimos el que está REALMENTE renderizado (offsetParent).
        const candidates = document.querySelectorAll<HTMLElement>(
          "[data-nav-collapse-guard]"
        )
        guardEl =
          Array.from(candidates).find((el) => el.offsetParent !== null) ??
          candidates[0] ??
          null
        if (guardEl) {
          const dockTop = parseFloat(getComputedStyle(guardEl).top)
          guardDockTop = Number.isFinite(dockTop) ? dockTop : navbarBottom
        }
      }
      let guardTop = Number.POSITIVE_INFINITY
      if (!collapsed && guardEl && guardEl.isConnected) {
        guardTop = guardEl.getBoundingClientRect().top
        if (inTopZone) {
          const transform = getComputedStyle(guardEl).transform
          if (transform && transform !== "none") {
            guardTop -= new DOMMatrixReadOnly(transform).m42
          }
        }
      }
      const guardDocked =
        collapsed ||
        !guardEl ||
        !guardEl.isConnected ||
        guardTop <= guardDockTop + 1

      // lc-nav-guard-free solo tiene CSS en ≥1200px; en móvil el toggle es no-op visual.
      root.classList.toggle("lc-nav-guard-free", !guardDocked)

      if (inTopZone) {
        acc = 0
        setCollapsed(false)
        return
      }
      if (!guardDocked) {
        acc = 0
        setCollapsed(false)
        return
      }

      // Solo colapsa (acumulado hacia abajo); la reaparición NO se dispara por
      // scroll hacia arriba a media página — solo vuelve al tope real
      // (inTopZone) o mientras el guard no ha dockeado, arriba.
      if (delta > 0 !== acc > 0) acc = 0
      acc += delta
      if (acc > COLLAPSE_AFTER) setCollapsed(true)
    }

    // Re-medir. guardEl = null fuerza además releer su línea de dock
    // (getComputedStyle(...).top), que vale --navbar-actual-h: si esa var
    // cambia y no se relee, el guard queda 36px descuadrado y `guardDocked`
    // da false para siempre → el chrome no se comprime nunca.
    const handleModeChange = () => {
      lastY = window.scrollY
      acc = 0
      navbarBottom = readNavbarBottom()
      guardEl = null
    }
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", handleModeChange)
    mqDesktopNav.addEventListener("change", handleModeChange)
    // El alto del header cambia sin resize ni cambio de breakpoint: cuando la
    // barra de anuncios llega por streaming (Suspense) o se apaga desde el
    // panel. Es el disparador exacto para volver a medir.
    const headerResize = new ResizeObserver(handleModeChange)
    if (headerRef.current) headerResize.observe(headerRef.current)
    update()
    return () => {
      headerResize.disconnect()
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", handleModeChange)
      mqDesktopNav.removeEventListener("change", handleModeChange)
      document.documentElement.classList.remove("lc-nav-collapsed")
      document.documentElement.classList.remove("lc-nav-guard-free")
    }
  }, [])

  // Home overlay: transparente mientras el hero sigue a pantalla completa
  // (pin ~20vh de scroll muerto + respiro). Umbral viejo (anuncio+56) hacía
  // que al “llegar al tope” visual el menú siguiera ivory hasta otro scroll.
  useLayoutEffect(() => {
    const overlayRange = () => {
      // Cubre el pin del hero (120vh − 100vh) + respiro; histéresis al salir.
      // La barra de anuncios ya no suma: viaja dentro del header sticky y no
      // consume scroll del documento.
      const pin = Math.round(window.innerHeight * 0.22)
      return { enterAt: pin + 24, exitAt: pin + 96 }
    }

    let overlayOn = false
    if (pathname === "/" && typeof window !== "undefined") {
      overlayOn = window.scrollY <= overlayRange().enterAt
    }

    const sync = () => {
      const isHome = pathname === "/"
      if (!isHome) {
        overlayOn = false
        document.documentElement.classList.remove("lc-home-overlay")
        return
      }

      const chromeBusy =
        Boolean(activeMenu) || drawerOpen || mobileSearchOpen || isCartOpen
      if (chromeBusy) {
        document.documentElement.classList.remove("lc-home-overlay")
        return
      }

      const y = window.scrollY
      const { enterAt, exitAt } = overlayRange()
      if (overlayOn) {
        if (y > exitAt) overlayOn = false
      } else if (y <= enterAt) {
        overlayOn = true
      }

      document.documentElement.classList.toggle("lc-home-overlay", overlayOn)
    }

    sync()
    window.addEventListener("scroll", sync, { passive: true })
    window.addEventListener("resize", sync)
    // scrollend: al frenar en el tope tras un fling, el último scroll a veces
    // no cae bajo el umbral y el menú se quedaba ivory hasta otro gesto.
    window.addEventListener("scrollend", sync)
    return () => {
      window.removeEventListener("scroll", sync)
      window.removeEventListener("resize", sync)
      window.removeEventListener("scrollend", sync)
      document.documentElement.classList.remove("lc-home-overlay")
    }
  }, [pathname, activeMenu, drawerOpen, mobileSearchOpen, isCartOpen])

  useEffect(() => {
    if (isCartOpen) {
      setDrawerOpen(false)
      setMobileSearchOpen(false)
      setActiveMenu(null)
    }
  }, [isCartOpen])

  useEffect(() => {
    const updateCompactDesktop = () => {
      const width = window.innerWidth
      setIsCompactDesktop(width >= 768 && width < COMPACT_DESKTOP_MAX_WIDTH)
      setIsDesktopWidth(width >= 768)
    }
    updateCompactDesktop()
    window.addEventListener("resize", updateCompactDesktop)
    return () => window.removeEventListener("resize", updateCompactDesktop)
  }, [])

  useEffect(() => {
    if (isCompactDesktop) {
      setActiveMenu(null)
    }
  }, [isCompactDesktop])

  // El foco del campo ya no se maneja aquí: el input vive en
  // MobileSearchOverlay en las dos variantes y él mismo lo enfoca al abrir.

  // Tienda no incluye marcas ni en desktop ni en el drawer móvil: Marcas es su
  // propia entrada de primer nivel (con su megamenú en desktop y su panel con
  // logos en el drawer).
  const tiendaDesktopCategories = tiendaCategories

  useEffect(() => {
    let isMounted = true
    async function loadBrands() {
      try {
        const response = await fetch("/api/brands")
        if (!response.ok) return
        const json = (await response.json()) as {
          data?: Array<{ name: string; slug: string; logo_url?: string | null }>
        }
        if (!isMounted || !Array.isArray(json.data)) return
        setBrandMenuItems(
          json.data.map((brand) => ({
            name: brand.name,
            slug: brand.slug,
            logo_url: brand.logo_url ?? null,
          }))
        )
      } catch {
        /* ignore */
      }
    }
    void loadBrands()
    return () => { isMounted = false }
  }, [])

  // Panel vacío (más buscado + más vendidos): se pide la primera vez que se
  // abre el buscador, no en cada carga de página.
  useEffect(() => {
    // El "ya se pidió" vive en un ref, no en estado: si fuera estado, cambiarlo
    // volvería a correr este efecto, su limpieza cancelaría la petición en
    // curso y los datos nunca llegarían a pintarse.
    if (!mobileSearchOpen || emptyStateLoadedRef.current) return
    emptyStateLoadedRef.current = true
    async function loadEmptyState() {
      try {
        const [topResult, bestResult] = await Promise.allSettled([
          fetch("/api/navbar/top-searches"),
          fetch("/api/products/best-sellers"),
        ])

        let topData: TopSearchChip[] = []
        let bestData: SearchSuggestionProduct[] = []

        if (topResult.status === "fulfilled" && topResult.value.ok) {
          try {
            const topJson = await topResult.value.json()
            if (Array.isArray(topJson?.data)) topData = topJson.data as TopSearchChip[]
          } catch {
            /* JSON inválido */
          }
        }

        if (bestResult.status === "fulfilled" && bestResult.value.ok) {
          try {
            const bestJson = await bestResult.value.json()
            if (Array.isArray(bestJson?.data)) {
              bestData = bestJson.data as SearchSuggestionProduct[]
            }
          } catch {
            /* JSON inválido */
          }
        }

        setTopSearches(topData)
        setBestSellers(bestData)
      } catch {
        /* Red caída / HMR stale — el navbar sigue sin top searches */
      } finally {
        setEmptyStateLoading(false)
      }
    }
    void loadEmptyState()
  }, [mobileSearchOpen])

  /* ── Interacción del buscador ──────────────────────────────────────────── */

  // Lista plana en el mismo orden en que se pintan las secciones: es lo que
  // recorren las flechas del teclado.
  const suggestionItems = useMemo(
    () => flattenPayload(searchPayload),
    [searchPayload]
  )
  const activeSuggestionItem =
    activeSuggestion >= 0 ? suggestionItems[activeSuggestion] ?? null : null

  // Cambió lo escrito (o llegaron otros resultados): la selección vuelve al
  // inicio para no navegar a un elemento que ya no está en pantalla.
  useEffect(() => {
    setActiveSuggestion(-1)
  }, [searchQuery, searchPayload])

  useEffect(() => {
    setRecentSearches(readRecentSearches())
  }, [])

  const closeSearch = () => {
    setMobileSearchOpen(false)
    setActiveSuggestion(-1)
  }

  const rememberQuery = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length < 2) return
    setRecentSearches(pushRecentSearch(trimmed))
  }

  const submitSearch = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    rememberQuery(trimmed)
    router.push(getSearchDestination(trimmed))
    setSearchQuery("")
    closeSearch()
  }

  // El propio <Link> navega; aquí solo se guarda la consulta y se cierra.
  const handleSuggestionSelect = () => {
    rememberQuery(searchQuery)
    setSearchQuery("")
    closeSearch()
  }

  // El re-foco tras elegir una búsqueda reciente lo hace el overlay, que es
  // quien tiene el ref del input.
  const handleRecentPick = (value: string) => {
    setSearchQuery(value)
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchQuery("")
      closeSearch()
      event.currentTarget.blur()
      return
    }

    if (event.key === "Enter") {
      if (activeSuggestionItem) {
        event.preventDefault()
        rememberQuery(searchQuery)
        setSearchQuery("")
        closeSearch()
        router.push(activeSuggestionItem.href)
      }
      return
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    if (suggestionItems.length === 0) return

    event.preventDefault()
    const delta = event.key === "ArrowDown" ? 1 : -1
    setActiveSuggestion((current) => {
      const next = current + delta
      if (next < -1) return suggestionItems.length - 1
      if (next >= suggestionItems.length) return -1
      return next
    })
  }

  const toggleMobileSearch = () => {
    if (mobileSearchOpen) {
      setMobileSearchOpen(false)
      return
    }
    closeCart()
    setDrawerOpen(false)
    setMobileSearchOpen(true)
  }

  const iconBtnBase =
    "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center text-black transition-all duration-200 ease-out hover:scale-110 hover:text-[#c6a75e] active:scale-90 active:duration-75 sm:h-11 sm:w-11"
  const showCompactToolbar = isCompactDesktop

  return (
    <>
      <header
        id="site-navbar"
        ref={headerRef}
        className="relative z-50 w-full sticky top-0 overflow-visible text-neutral-800"
        onMouseLeave={scheduleMenuClose}
      >
      {/* .navbar-shell = TODO el contenido del header. El colapso del chrome
          traslada ESTE div (y el ::after que pinta la barra marfil), nunca el
          <header>: en iOS Safari un `position: sticky` que además es capa
          compuesta (transform 3D + will-change) deja de pegarse y se va con el
          scroll — el navbar no aparecía en móvil. La caja sticky se queda
          quieta y su contenido sube: visualmente idéntico. */}
      <div className="navbar-shell">
        {/* Barra de anuncios: la ÚNICA fila que se comprime al scrollear. Vive
            aquí dentro (no como hermana en el layout) para que el chrome sea un
            solo elemento sticky con un solo transform (el del shell): así los
            megamenús (`top-full`), las barras .navbar-follow-collapse y los
            overlays fixed que ya escapan por portal conservan su geometría
            exacta. */}
        {announcement}

        {/* ===== COMPACT TOOLBAR (mobile + ventanas estrechas en desktop) ===== */}
        <div className={`navbar-toolbar relative z-10 h-[var(--navbar-h)] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center ${showCompactToolbar ? "grid" : "grid md:hidden"}`}>
          <div className="flex min-w-0 items-center justify-start">
            <button
              type="button"
              onClick={() => { closeCart(); setMobileSearchOpen(false); setDrawerOpen((o) => !o) }}
              className={`relative ${iconBtnBase} justify-start`}
              aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span
                className={`absolute left-0 flex h-7 w-6 flex-col items-center justify-center gap-[6px] transition-all duration-200 ${
                  drawerOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
                aria-hidden="true"
              >
                <span className="block h-[2px] w-6 rounded-full bg-current" />
                <span className="block h-[2px] w-6 rounded-full bg-current" />
              </span>
              <X
                className={`absolute left-0 top-1/2 h-7 w-6 -translate-y-1/2 transition-all duration-200 ${
                  drawerOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-center px-2">
            <Link
              href="/"
              className="navbar-brand-link shrink-0 no-underline transition-opacity hover:opacity-90"
              aria-label="Ir al inicio"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                <Image
                  src="/images/logo.png"
                  alt="Liz Cabriales"
                  width={56}
                  height={56}
                  className="navbar-brand-logo h-full w-full object-contain"
                  priority
                />
              </span>
            </Link>
          </div>

          <div className="relative z-20 flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={toggleMobileSearch}
              className={`${iconBtnBase} justify-center`}
              aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Buscar"}
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              className={`relative ${iconBtnBase} justify-end`}
              onClick={() => {
                if (isCartOpen) {
                  closeCart()
                } else {
                  setMobileSearchOpen(false)
                  setDrawerOpen(false)
                  openCart()
                }
              }}
              aria-label="Bolsa"
            >
              <span className="relative shrink-0">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
                {cartBadgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6a75e] px-1 text-[10px] text-white">
                    <SlidingNumber value={cartBadgeCount} />
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* ===== DESKTOP TOOLBAR (ancho completo) ===== */}
        {/* UNA sola fila (estilo OPI): logo · módulos · iconos. Alto =
            --navbar-h (72px en ≥1200px). El header no fija altura: se la dan la
            barra de anuncios + esta fila, así el chrome mide lo justo cuando la
            barra no está. La fila es PERMANENTE; lo único que se comprime al
            scrollear es el anuncio. */}
        {/* Rejilla 1fr·auto·1fr en vez de flex: las columnas laterales miden
            igual, así los módulos quedan CENTRADOS en la barra aunque la marca
            y el grupo de iconos tengan anchos distintos (con flex iban pegados
            al logo). */}
        <div
          className={`navbar-toolbar relative z-10 grid h-[var(--navbar-h)] w-full grid-cols-[1fr_auto_1fr] items-center gap-6 lg:gap-8 ${showCompactToolbar ? "hidden" : "hidden md:grid"}`}
        >
          {/* Lockup de marca: logo + wordmark, mismo par que el footer
              ("Liz Cabriales" en display + "Studio" en versalitas espaciadas).
              Sin color propio: hereda el del header, así el overlay del home
              lo pasa a blanco solo. */}
          <Link
            href="/"
            className="navbar-brand-link relative z-[2] flex w-fit shrink-0 items-center gap-2.5 justify-self-start no-underline transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
            onMouseEnter={() => activeMenu && scheduleMenuClose()}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center lg:h-16 lg:w-16">
              <Image
                src="/images/logo.png"
                alt="Liz Cabriales"
                width={80}
                height={80}
                className="navbar-brand-logo h-full w-full object-contain"
                priority
              />
            </span>
            <span
              aria-hidden
              className="navbar-brand-wordmark flex flex-col justify-center leading-none"
            >
              <span className="font-display text-[15px] font-medium tracking-[-0.02em] whitespace-nowrap">
                Liz Cabriales
              </span>
              <span className="mt-[3px] text-[8px] uppercase tracking-[0.44em] opacity-70">
                Studio
              </span>
            </span>
          </Link>

          {/* self-stretch: el nav ocupa el alto completo de la fila para que el
              indicador pueda anclarse a bottom-0 = borde inferior del navbar
              (como OPI), no pegado al texto. Sigue siendo el offsetParent de los
              enlaces, así que offsetLeft/offsetWidth no cambian. */}
          <nav ref={navRef} className="relative flex shrink-0 items-center gap-0 self-stretch justify-self-center">
            <span
              aria-hidden
              className={`navbar-nav-indicator pointer-events-none absolute bottom-0 h-[2px] bg-gold-soft duration-150 ease-out ${
                navBarAnimate === "grow"
                  ? "transition-[width]"
                  : "transition-[left,width]"
              }`}
              style={{
                left: navBarStyle.left,
                width: navBarStyle.visible ? navBarStyle.width : 0,
              }}
            />
            {DESKTOP_NAV_ITEMS.map(({ label, href, menu }) => (
              <Link
                key={label}
                ref={(el) => {
                  if (el) navLinkRefs.current.set(label, el)
                  else navLinkRefs.current.delete(label)
                }}
                href={href}
                onMouseEnter={() => (menu ? handleNavMouseEnter(menu) : scheduleMenuClose())}
                onFocus={() => (menu ? handleNavMouseEnter(menu) : scheduleMenuClose())}
                className={`relative inline-flex items-center justify-center whitespace-nowrap px-2.5 text-center text-[12.5px] font-medium uppercase tracking-[0.16em] transition-colors lg:px-3.5 lg:text-[13.5px] lg:tracking-[0.18em] ${
                  activeMenu === label ? "text-[#c6a75e]" : "text-black hover:text-[#c6a75e]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Orden pedido: lupa → favoritos → cuenta → bolsa. La barra queda
              siempre limpia (solo iconos): el campo ya NO vive aquí, baja como
              panel pegado al navbar desde MobileSearchOverlay, que es dueño del
              input en las dos variantes. La lupa solo abre/cierra.
              `ml-auto` mantiene el grupo pegado a la derecha. */}
          <div
            className="relative z-20 flex shrink-0 items-center justify-end gap-0 justify-self-end"
            onMouseEnter={() => activeMenu && scheduleMenuClose()}
          >
          <button
            type="button"
            onClick={() => { setActiveMenu(null); toggleMobileSearch() }}
            className={`${iconBtnBase} h-10 w-10 shrink-0 justify-center`}
            aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Buscar"}
          >
            <Search className="h-6 w-6" strokeWidth={1.75} />
          </button>

          <Link
            href="/wishlist"
            onClick={() => setActiveMenu(null)}
            className={`relative ${iconBtnBase} h-10 w-10 justify-center`}
            aria-label="Favoritos"
          >
            <span className="relative shrink-0">
              <Heart className="h-6 w-6" strokeWidth={1.75} />
              <WishlistCountBadge count={wishlistBadgeCount} />
            </span>
          </Link>

          <Link
            href={isLoggedIn ? "/perfil" : "/login"}
            onClick={() => setActiveMenu(null)}
            className={`${iconBtnBase} h-10 w-10 justify-center`}
            aria-label={isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
          >
            <User className="h-6 w-6" strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            className={`relative ${iconBtnBase} h-10 w-10 justify-center`}
            onClick={() => {
              setActiveMenu(null)
              if (isCartOpen) {
                closeCart()
              } else {
                setMobileSearchOpen(false)
                setDrawerOpen(false)
                openCart()
              }
            }}
            aria-label="Bolsa"
          >
            <span className="relative shrink-0">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
              {cartBadgeCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6a75e] px-1 text-[10px] text-white">
                  <SlidingNumber value={cartBadgeCount} />
                </span>
              )}
            </span>
          </button>
          </div>
        </div>

        <CartMenu />

        {/* ===== DESKTOP MEGAMENUS ===== */}
        <TiendaMegaMenu
          isOpen={activeMenu === "Tienda"}
          categories={tiendaDesktopCategories}
          sectionHref="/tienda"
          sectionLabel="toda la tienda"
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <AcademiaMegaMenu
          isOpen={activeMenu === "Academia"}
          categories={cursosCategories}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <ServiciosMegaMenu
          isOpen={activeMenu === "Servicios"}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <BrandsMegaMenu
          isOpen={activeMenu === "Marcas"}
          brands={brandMenuItems}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <NailArtMegaMenu
          isOpen={activeMenu === "Nail Art"}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <LizMegaMenu
          isOpen={activeMenu === "Conócenos"}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        </div>
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isLoggedIn={isLoggedIn}
        tiendaCategories={tiendaDesktopCategories}
        brands={brandMenuItems}
      />

      <MobileSearchOverlay
        open={mobileSearchOpen}
        onClose={closeSearch}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        payload={searchPayload}
        suggestionsLoading={suggestionsLoading}
        activeId={activeSuggestionItem?.id ?? null}
        onSelectSuggestion={handleSuggestionSelect}
        onSubmit={submitSearch}
        onSearchKeyDown={handleSearchKeyDown}
        recentSearches={recentSearches}
        onPickRecent={handleRecentPick}
        onClearRecent={() => setRecentSearches(clearRecentSearches())}
        topSearches={topSearches}
        bestSellers={bestSellers}
        emptyLoading={emptyStateLoading}
        dropdown={!showCompactToolbar}
      />

      {/* Overlay de blur global (carrito + megamenu desktop + búsqueda).
          El megamenú NO se cierra en mouseEnter: con el navbar colapsado el
          header puede dejar el cursor sobre el overlay un instante y eso
          provocaba un loop abrir/cerrar. Se cierra solo con click. */}
      <div
        className={`fixed inset-0 top-[var(--site-chrome-bottom,var(--navbar-actual-h))] backdrop-blur-md bg-black/10 z-[45] transition-opacity duration-300 md:top-0 ${
          isCartOpen || activeMenu || (mobileSearchOpen && !showCompactToolbar && isDesktopWidth) ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          // No tocar activeMenu aquí (ver comentario arriba).
          closeCart()
          setDrawerOpen(false)
          setMobileSearchOpen(false)
        }}
        onClick={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          if (overlayGuardRef.current) return
          closeCart()
          setDrawerOpen(false)
          setActiveMenu(null)
          setMobileSearchOpen(false)
        }}
      />
    </>
  )
}
