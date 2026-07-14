"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search, ShoppingBag, X, Heart, User } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { getSearchDestination } from "@/lib/search-navigation"
import { tiendaCategories, cursosCategories } from "./menuData"
import CartMenu from "./dropdowns/CartMenu"
import DesktopMegaMenu from "./dropdowns/DesktopMegaMenu"
import ServiciosMegaMenu from "./dropdowns/ServiciosMegaMenu"
import BrandsMegaMenu from "./dropdowns/BrandsMegaMenu"
import LizMegaMenu from "./dropdowns/LizMegaMenu"
import MobileDrawer from "./MobileDrawer"
import MobileSearchOverlay from "./MobileSearchOverlay"
import {
  withRecentProductsCategory,
  type RecentProductMenuItem,
} from "@/lib/navbar/recent-products"
import {
  withBrandsCategory,
  type BrandMenuItem,
} from "@/lib/navbar/brands-category"
import {
  type SearchSuggestionBrand,
  type SearchSuggestionCategory,
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import { useCart } from "../cart/CartContext"
import { useWishlist } from "../wishlist/WishlistContext"
import WishlistCountBadge from "../wishlist/WishlistCountBadgeClient"
import SlidingNumber from "../ui/motion/sliding-number"

type DesktopMenu = "Tienda" | "Academia" | "Servicios" | "Marcas" | "Conócenos" | null

type NavbarProps = {
  isLoggedIn?: boolean
}

const COMPACT_DESKTOP_MAX_WIDTH = 1200

// Borde inferior del navbar expandido (px). El navbar es sticky top-0 sin
// transform en reposo, así que su bottom = --navbar-actual-h. Se lee una vez
// por breakpoint (constante dentro de cada media query), no por frame.
function readNavbarBottom(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--navbar-actual-h"
  )
  const value = parseFloat(raw)
  return Number.isFinite(value) ? value : 104
}

const DESKTOP_NAV_ITEMS = [
  { label: "Tienda" as const, href: "/tienda" },
  { label: "Academia" as const, href: "/academia" },
  { label: "Servicios" as const, href: "/servicios" },
  { label: "Marcas" as const, href: "/tienda" },
  { label: "Conócenos" as const, href: "/sobre-liz" },
] as const

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [recentProducts, setRecentProducts] = useState<RecentProductMenuItem[]>([])
  const [brandMenuItems, setBrandMenuItems] = useState<BrandMenuItem[]>([])
  const [suggestionProducts, setSuggestionProducts] = useState<SearchSuggestionProduct[]>([])
  const [suggestionBrands, setSuggestionBrands] = useState<SearchSuggestionBrand[]>([])
  const [suggestionCategories, setSuggestionCategories] = useState<SearchSuggestionCategory[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [topSearches, setTopSearches] = useState<TopSearchChip[]>([])
  const [bestSellers, setBestSellers] = useState<SearchSuggestionProduct[]>([])
  const [emptyStateLoading, setEmptyStateLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isCompactDesktop, setIsCompactDesktop] = useState(false)
  const [isDesktopWidth, setIsDesktopWidth] = useState(false)
  const [activeMenu, setActiveMenu] = useState<DesktopMenu>(null)
  const [navBarStyle, setNavBarStyle] = useState({ left: 0, width: 0, visible: false })
  const [navBarAnimate, setNavBarAnimate] = useState<"grow" | "slide">("grow")
  const [hideChrome, setHideChrome] = useState(false)
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navBarStyleRef = useRef({ left: 0, width: 0, visible: false })
  const activeMenuRef = useRef<DesktopMenu>(null)
  const navRef = useRef<HTMLElement>(null)
  const navLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const headerRef = useRef<HTMLElement>(null)
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
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
    menuCloseTimerRef.current = setTimeout(() => {
      setActiveMenu(null)
      hideNavBar()
    }, 200)
  }
  const openDesktopMenu = (menu: Exclude<DesktopMenu, null>) => {
    clearMenuCloseTimer()
    setHideChrome(false)
    closeCart()
    setMobileSearchOpen(false)
    setDrawerOpen(false)
    setActiveMenu(menu)
  }
  const handleNavMouseEnter = (menu: Exclude<DesktopMenu, null>) => {
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

  useEffect(() => {
    document.documentElement.classList.toggle("navbar-menu-open", Boolean(activeMenu))
    return () => {
      document.documentElement.classList.remove("navbar-menu-open")
    }
  }, [activeMenu])

  useEffect(() => {
    if (!drawerOpen) return

    let lastY = window.scrollY
    function handleScroll() {
      const currentY = window.scrollY
      // Ignore micro-scrolls from layout shifts / mobile browser chrome
      if (currentY - lastY > 12) {
        setDrawerOpen(false)
      }
      lastY = currentY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [drawerOpen])

  // Colapso del navbar (solo desktop ≥1200px), binario y por DIRECCIÓN de
  // scroll: bajar colapsa, subir expande de inmediato (no solo al llegar al
  // top). El movimiento lo hace CSS con una transition de transform sobre
  // html.lc-nav-collapsed (ver globals.css) — 100% GPU, nada por frame.
  // Umbrales ACUMULADOS por dirección: micro-scrolls (layout shifts, rueda
  // inercial rebotando) no togglean. Cerca del top queda siempre expandido
  // para que el toggle no parpadee mientras el sticky aún no se pega; el
  // announcement bar (contenido previo al header) cuenta como parte del top.
  // hideChrome (aria/tabIndex de la fila superior) sigue este mismo estado.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1200px)")
    const COLLAPSE_AFTER = 24
    const EXPAND_AFTER = -8
    let lastY = window.scrollY
    let acc = 0
    // Barra sticky de la página que sigue el colapso (marcada con
    // data-nav-collapse-guard). Se cachea entre frames; se re-consulta si el
    // elemento se desmonta al cambiar de ruta.
    let guardEl: HTMLElement | null = null
    // Borde inferior del navbar EXPANDIDO (sin transform) = --navbar-actual-h.
    let navbarBottom = readNavbarBottom()

    const setCollapsed = (collapsed: boolean) => {
      document.documentElement.classList.toggle("lc-nav-collapsed", collapsed)
      // Con un megamenu abierto el chrome debe seguir accesible (aria/tabIndex)
      if (!activeMenuRef.current) setHideChrome(collapsed)
    }

    const update = () => {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      const root = document.documentElement
      if (!mq.matches) {
        acc = 0
        root.classList.remove("lc-nav-guard-free")
        setCollapsed(false)
        return
      }
      const pinOffset =
        document.getElementById("site-announcement-bar")?.offsetHeight ?? 0
      // En la zona top vamos a expandir sí o sí: el lc-nav-collapsed viejo NO
      // cuenta como "pegada" (si no, al saltar al top guard-free quedaba
      // apagado sin más scrolls que lo corrigieran, y el escudo ::before
      // tapaba el breadcrumb con la barra ya en el flujo).
      const inTopZone = y <= pinOffset + 56
      const collapsed =
        !inTopZone && root.classList.contains("lc-nav-collapsed")

      // ¿La barra sticky de la página (data-nav-collapse-guard) ya tocó el
      // navbar y está pegada bajo él? Solo leemos layout mientras seguimos
      // expandidos (colapsados sabemos que está pegada → sin reflow por frame).
      if (!collapsed && (!guardEl || !guardEl.isConnected)) {
        guardEl = document.querySelector<HTMLElement>("[data-nav-collapse-guard]")
      }
      let guardTop = Number.POSITIVE_INFINITY
      if (!collapsed && guardEl && guardEl.isConnected) {
        guardTop = guardEl.getBoundingClientRect().top
        if (inTopZone) {
          // El rect incluye el transform del colapso: tras un salto al top la
          // barra aún trae -56px y el rect miente "pegada" (148-56=92), dejando
          // escudo y transición activos sin más scrolls que lo corrijan. En la
          // zona top decide el layout puro (rect - translateY). Fuera del top
          // se queda el rect CON transform: es lo que hace que el undock
          // gradual espere a transform≈0 y el snap no dé salto.
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
        guardTop <= navbarBottom + 1

      // DESPEGADA: la barra vive en el flujo, sobre su hero (o arriba del todo),
      // no bajo el navbar. Ahí NO debe arrastrar la transición de 480ms del
      // colapso: si lo hace, al frenar arriba sigue deslizándose ~0.1s hasta su
      // sitio. La marcamos para que CSS le quite la transition (snap inmediato)
      // y apague el escudo ::before (globals.css). El check de "despegada" solo
      // se cumple con el transform ya en ~0, así que el snap no da salto.
      // Pegada → sigue al navbar con su transición (necesario para que no se
      // abra un hueco con el hero al colapsar).
      root.classList.toggle("lc-nav-guard-free", !guardDocked)

      if (inTopZone) {
        acc = 0
        setCollapsed(false)
        return
      }
      // No colapsar hasta que la barra se haya pegado: si el navbar sube 56px
      // mientras la barra aún baja por el hero, queda un hueco con el hero
      // asomándose (bug /academia: se leía "Eventos temporada 2026").
      if (!guardDocked) {
        acc = 0
        setCollapsed(false)
        return
      }
      if (delta > 0 !== acc > 0) acc = 0
      acc += delta
      if (acc > COLLAPSE_AFTER) setCollapsed(true)
      else if (acc < EXPAND_AFTER) setCollapsed(false)
    }

    const handleModeChange = () => {
      lastY = window.scrollY
      acc = 0
      navbarBottom = readNavbarBottom()
      if (!mq.matches) setCollapsed(false)
    }
    window.addEventListener("scroll", update, { passive: true })
    mq.addEventListener("change", handleModeChange)
    update()
    return () => {
      window.removeEventListener("scroll", update)
      mq.removeEventListener("change", handleModeChange)
      document.documentElement.classList.remove("lc-nav-collapsed")
      document.documentElement.classList.remove("lc-nav-guard-free")
    }
  }, [])

  useEffect(() => {
    if (isCartOpen) {
      setDrawerOpen(false)
      setMobileSearchOpen(false)
      setActiveMenu(null)
    }
  }, [isCartOpen])

  // Mantener chrome visible mientras hay overlay abierto (megamenu, carrito, búsqueda).
  useEffect(() => {
    if (activeMenu || isCartOpen || drawerOpen || mobileSearchOpen) {
      setHideChrome(false)
    }
  }, [activeMenu, isCartOpen, drawerOpen, mobileSearchOpen])

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

  // Autofocus del input integrado en desktop cuando se abre la búsqueda.
  useEffect(() => {
    if (!mobileSearchOpen) return
    if (isCompactDesktop) return
    const timer = window.setTimeout(() => {
      desktopSearchInputRef.current?.focus()
    }, 320)
    return () => window.clearTimeout(timer)
  }, [mobileSearchOpen, isCompactDesktop])

  // Mobile drawer: incluye marcas como categoría dentro de Tienda (comportamiento existente).
  const tiendaMenuCategories = useMemo(
    () =>
      withBrandsCategory(
        withRecentProductsCategory(tiendaCategories, recentProducts),
        brandMenuItems
      ),
    [recentProducts, brandMenuItems]
  )

  // Desktop megamenu de Tienda: sin marcas (marcas tiene su propio megamenu).
  const tiendaDesktopCategories = useMemo(
    () => withRecentProductsCategory(tiendaCategories, recentProducts),
    [recentProducts]
  )

  useEffect(() => {
    let isMounted = true
    async function loadRecentProducts() {
      try {
        const response = await fetch("/api/products/recent")
        if (!response.ok) return
        const json = (await response.json()) as {
          data?: Array<{ name: string; slug: string }>
        }
        if (!isMounted || !Array.isArray(json.data)) return
        setRecentProducts(
          json.data.map((product) => ({
            name: product.name,
            slug: product.slug,
          }))
        )
      } catch {
        /* ignore */
      }
    }
    void loadRecentProducts()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadBrands() {
      try {
        const response = await fetch("/api/brands")
        if (!response.ok) return
        const json = (await response.json()) as {
          data?: Array<{ name: string; slug: string }>
        }
        if (!isMounted || !Array.isArray(json.data)) return
        setBrandMenuItems(
          json.data.map((brand) => ({
            name: brand.name,
            slug: brand.slug,
          }))
        )
      } catch {
        /* ignore */
      }
    }
    void loadBrands()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadEmptyState() {
      try {
        const [topRes, bestRes] = await Promise.all([
          fetch("/api/navbar/top-searches"),
          fetch("/api/products/best-sellers"),
        ])
        const [topJson, bestJson] = await Promise.all([
          topRes.ok ? topRes.json() : Promise.resolve({ data: [] }),
          bestRes.ok ? bestRes.json() : Promise.resolve({ data: [] }),
        ])
        if (!isMounted) return
        setTopSearches(
          Array.isArray(topJson?.data) ? (topJson.data as TopSearchChip[]) : []
        )
        setBestSellers(
          Array.isArray(bestJson?.data) ? (bestJson.data as SearchSuggestionProduct[]) : []
        )
      } finally {
        if (isMounted) setEmptyStateLoading(false)
      }
    }
    void loadEmptyState()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSuggestionProducts([])
      setSuggestionBrands([])
      setSuggestionCategories([])
      setSuggestionsLoading(false)
      return
    }
    let isMounted = true
    setSuggestionsLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/search-suggestions?q=${encodeURIComponent(query)}`
        )
        if (!response.ok) return
        const json = (await response.json()) as {
          data?: {
            products?: SearchSuggestionProduct[]
            brands?: SearchSuggestionBrand[]
            categories?: SearchSuggestionCategory[]
          }
        }
        if (!isMounted) return
        setSuggestionProducts(Array.isArray(json.data?.products) ? json.data!.products! : [])
        setSuggestionBrands(Array.isArray(json.data?.brands) ? json.data!.brands! : [])
        setSuggestionCategories(Array.isArray(json.data?.categories) ? json.data!.categories! : [])
      } finally {
        if (isMounted) setSuggestionsLoading(false)
      }
    }, 180)
    return () => { isMounted = false; clearTimeout(timeout) }
  }, [searchQuery])

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
    "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center text-black transition-all duration-200 ease-out hover:scale-110 hover:text-[#c9a84c] active:scale-90 active:duration-75 sm:h-11 sm:w-11"
  const showCompactToolbar = isCompactDesktop

  return (
    <>
      <header
        id="site-navbar"
        ref={headerRef}
        className="relative z-50 w-full sticky top-0 overflow-visible bg-ivory text-neutral-800"
        onMouseLeave={scheduleMenuClose}
      >

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
              className="shrink-0 no-underline transition-opacity hover:opacity-90"
              aria-label="Ir al inicio"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                <Image
                  src="/images/logo.png"
                  alt="Liz Cabriales"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
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
              aria-label="Carrito"
            >
              <span className="relative shrink-0">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
                {cartBadgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9a84c] px-1 text-[10px] text-white">
                    <SlidingNumber value={cartBadgeCount} />
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* ===== DESKTOP TOOLBAR (ancho completo) ===== */}
        {/* Altura del header (104px) controlada por CSS @media. Cuando colapsa,
            el header se mueve con `transform` (GPU) — no animamos height. */}
        <div
          className={`navbar-toolbar relative z-10 flex h-full w-full flex-col ${showCompactToolbar ? "hidden" : "hidden md:flex"}`}
        >
          {/* Fila superior: logo centrado + iconos a la derecha. Al colapsar, el
              header entero se traslada -56px (GPU) y esta fila queda fuera del
              viewport; hideChrome solo apaga su aria/tabIndex. */}
          <div
            className="min-h-0 flex-1 overflow-hidden"
            aria-hidden={hideChrome}
          >
            <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center pt-4">
                <div
                  className="relative z-20 flex min-w-0 shrink-0 items-center justify-self-start gap-3 pl-1"
                  onMouseEnter={scheduleMenuClose}
                >
                  <button
                    type="button"
                    onClick={() => { setActiveMenu(null); toggleMobileSearch() }}
                    className={`${iconBtnBase} h-9 w-9 shrink-0 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
                    aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Buscar"}
                  >
                    <Search className="h-5 w-5" strokeWidth={1.75} />
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      router.push(getSearchDestination(searchQuery))
                      setSearchQuery("")
                      setMobileSearchOpen(false)
                    }}
                    className="flex items-center gap-2 border-b border-neutral-900 pb-1 will-change-[width]"
                    style={{
                      width: mobileSearchOpen ? "300px" : "150px",
                      transition: "width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <input
                      ref={desktopSearchInputRef}
                      type="text"
                      inputMode="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (!mobileSearchOpen) {
                          setActiveMenu(null)
                          closeCart()
                          setDrawerOpen(false)
                          setMobileSearchOpen(true)
                        }
                      }}
                      placeholder="Buscar"
                      tabIndex={hideChrome ? -1 : 0}
                      className="navbar-search-input min-w-0 flex-1 bg-transparent text-[13px] tracking-wide text-neutral-900 outline-none placeholder:text-neutral-400"
                      aria-label="Buscar productos"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery.length > 0) {
                          setSearchQuery("")
                        } else if (mobileSearchOpen) {
                          setMobileSearchOpen(false)
                        }
                      }}
                      tabIndex={mobileSearchOpen || searchQuery.length > 0 ? 0 : -1}
                      className={`inline-flex shrink-0 items-center justify-center text-neutral-900 transition-opacity duration-150 ease-out hover:text-[#c9a84c] ${
                        mobileSearchOpen || searchQuery.length > 0
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 pointer-events-none"
                      }`}
                      aria-label={searchQuery.length > 0 ? "Limpiar búsqueda" : "Cerrar búsqueda"}
                      aria-hidden={!(mobileSearchOpen || searchQuery.length > 0)}
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </form>
                </div>

                <Link
                  href="/"
                  className="shrink-0 justify-self-center no-underline transition-opacity hover:opacity-90"
                  tabIndex={hideChrome ? -1 : 0}
                  aria-label="Ir al inicio"
                  onMouseEnter={() => activeMenu && scheduleMenuClose()}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center lg:h-10 lg:w-10">
                    <Image
                      src="/images/logo.png"
                      alt="Liz Cabriales"
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </span>
                </Link>

                <div
                  className="relative z-20 flex shrink-0 items-center justify-self-end gap-0.5 pr-1"
                  onMouseEnter={() => activeMenu && scheduleMenuClose()}
                >
                  <Link
                    href="/wishlist"
                    onClick={() => setActiveMenu(null)}
                    className={`relative ${iconBtnBase} h-9 w-9 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
                    aria-label="Favoritos"
                  >
                    <span className="relative shrink-0">
                      <Heart className="h-5 w-5" strokeWidth={1.75} />
                      <WishlistCountBadge count={wishlistBadgeCount} />
                    </span>
                  </Link>

                  <Link
                    href={isLoggedIn ? "/perfil" : "/login"}
                    onClick={() => setActiveMenu(null)}
                    className={`${iconBtnBase} h-9 w-9 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
                    aria-label={isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
                  >
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </Link>

                  <button
                    type="button"
                    className={`relative ${iconBtnBase} h-9 w-9 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
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
                    aria-label="Carrito"
                  >
                    <span className="relative shrink-0">
                      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                      {cartBadgeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9a84c] px-1 text-[10px] text-white">
                          <SlidingNumber value={cartBadgeCount} />
                        </span>
                      )}
                    </span>
                  </button>
                </div>
            </div>
          </div>

          {/* Fila inferior: nav items centrados. Siempre visible. */}
          <div className="flex h-12 w-full items-center justify-center">
            <nav ref={navRef} className="relative flex items-center justify-center gap-0">
              <span
                aria-hidden
                className={`pointer-events-none absolute -bottom-1 h-[1.5px] bg-[#c9a84c] duration-150 ease-out ${
                  navBarAnimate === "grow"
                    ? "transition-[width]"
                    : "transition-[left,width]"
                }`}
                style={{
                  left: navBarStyle.left,
                  width: navBarStyle.visible ? navBarStyle.width : 0,
                }}
              />
              {DESKTOP_NAV_ITEMS.map(({ label, href }) => (
                <Link
                  key={label}
                  ref={(el) => {
                    if (el) navLinkRefs.current.set(label, el)
                    else navLinkRefs.current.delete(label)
                  }}
                  href={href}
                  onMouseEnter={() => handleNavMouseEnter(label)}
                  onFocus={() => handleNavMouseEnter(label)}
                  className={`relative inline-flex items-center justify-center px-2 whitespace-nowrap text-center text-[13px] font-medium uppercase tracking-[0.14em] transition-colors lg:px-3 lg:text-[14px] lg:tracking-[0.16em] ${
                    activeMenu === label ? "text-[#c9a84c]" : "text-[#1a1a1a] hover:text-[#c9a84c]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <CartMenu />

        {/* ===== DESKTOP MEGAMENUS ===== */}
        <DesktopMegaMenu
          isOpen={activeMenu === "Tienda"}
          categories={tiendaDesktopCategories}
          sectionHref="/tienda"
          sectionLabel="toda la tienda"
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
        <DesktopMegaMenu
          isOpen={activeMenu === "Academia"}
          categories={cursosCategories}
          sectionHref="/academia"
          sectionLabel="cursos"
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
        <LizMegaMenu
          isOpen={activeMenu === "Conócenos"}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
        />
      </header>

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isLoggedIn={isLoggedIn}
        tiendaCategories={tiendaMenuCategories}
      />

      <MobileSearchOverlay
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        products={suggestionProducts}
        brands={suggestionBrands}
        categories={suggestionCategories}
        suggestionsLoading={suggestionsLoading}
        topSearches={topSearches}
        bestSellers={bestSellers}
        emptyLoading={emptyStateLoading}
        hideForm={!showCompactToolbar}
      />

      {/* Overlay de blur global (carrito + megamenu desktop + búsqueda) */}
      <div
        className={`fixed inset-0 top-[var(--site-chrome-bottom,var(--navbar-actual-h))] backdrop-blur-md bg-black/10 z-[45] transition-opacity duration-300 md:top-0 ${
          isCartOpen || activeMenu || (mobileSearchOpen && !showCompactToolbar && isDesktopWidth) ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          closeCart()
          setDrawerOpen(false)
          setActiveMenu(null)
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
