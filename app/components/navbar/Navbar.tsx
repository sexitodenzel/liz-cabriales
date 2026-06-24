"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingBag, X, Heart, User } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { tiendaCategories, cursosCategories, serviciosCategories } from "./menuData"
import CartMenu from "./dropdowns/CartMenu"
import DesktopMegaMenu from "./dropdowns/DesktopMegaMenu"
import BestSellersMegaMenu from "./dropdowns/BestSellersMegaMenu"
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

type DesktopMenu = "Tienda" | "Academia" | "Servicios" | "Best Sellers" | "Marcas" | "Conócenos" | null

type NavbarProps = {
  isLoggedIn?: boolean
}

const COMPACT_DESKTOP_MAX_WIDTH = 1200

const DESKTOP_NAV_ITEMS = [
  { label: "Tienda" as const, href: "/tienda" },
  { label: "Academia" as const, href: "/academia" },
  { label: "Servicios" as const, href: "/servicios" },
  { label: "Best Sellers" as const, href: "/tienda/mas-vendidos" },
  { label: "Marcas" as const, href: "/tienda" },
  { label: "Conócenos" as const, href: "/sobre-liz" },
] as const

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
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
  const [activeMenu, setActiveMenu] = useState<DesktopMenu>(null)
  const [navBarStyle, setNavBarStyle] = useState({ left: 0, width: 0, visible: false })
  const [navBarAnimate, setNavBarAnimate] = useState<"grow" | "slide">("grow")
  const [hideChrome, setHideChrome] = useState(false)
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navBarStyleRef = useRef({ left: 0, width: 0, visible: false })
  const navRef = useRef<HTMLElement>(null)
  const navLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const headerRef = useRef<HTMLElement>(null)
  const overlayGuardRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const {
    itemCount,
    isCartOpen,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
  } = useCart()
  const { count: wishlistCount } = useWishlist()

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
    }, 120)
  }
  const openDesktopMenu = (menu: Exclude<DesktopMenu, null>) => {
    clearMenuCloseTimer()
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

  // Aplica el valor target de --navbar-actual-h discreto. La animación es
  // 100% CSS (@property transition en :root), perfectamente sincronizada
  // con el header (que usa height: var(--navbar-actual-h)) y con los stickys
  // que la consumen (filter bar, etc.). Sin JS por frame = sin jank.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--navbar-actual-h",
      hideChrome
        ? "var(--navbar-desktop-collapsed-h)"
        : "var(--navbar-desktop-expanded-h)",
    )
  }, [hideChrome])

  useEffect(() => {
    if (isCartOpen) {
      setDrawerOpen(false)
      setMobileSearchOpen(false)
      setActiveMenu(null)
    }
  }, [isCartOpen])

  // Hermès-style scroll behavior: hide logo + action icons when scrolling down,
  // restore them when scrolling up. The center nav items always stay visible.
  useEffect(() => {
    const SCROLL_THRESHOLD = 100
    const DELTA_THRESHOLD = 14
    const COOLDOWN_MS = 120
    // Distancia desde el bottom donde NO togglear (evita loops por scroll-adjust
    // fantasma cuando el curtain footer revela su escena y el documento "rebota").
    const BOTTOM_GUARD_PX = 240

    lastScrollYRef.current = window.scrollY
    let rafId: number | null = null
    let cooldownUntil = 0

    function evaluate() {
      rafId = null
      const now = performance.now()
      if (now < cooldownUntil) {
        lastScrollYRef.current = window.scrollY
        return
      }

      const currentY = window.scrollY
      const delta = currentY - lastScrollYRef.current
      const docHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const distanceFromBottom = docHeight - (currentY + viewportHeight)

      if (distanceFromBottom < BOTTOM_GUARD_PX) {
        // Cerca del footer: mantén el estado actual; cualquier toggle aquí
        // dispararía un loop al cambiar la altura del documento.
        lastScrollYRef.current = currentY
        return
      }

      if (Math.abs(delta) < DELTA_THRESHOLD && currentY >= SCROLL_THRESHOLD) {
        return
      }

      setHideChrome((prev) => {
        let next = prev
        if (currentY < SCROLL_THRESHOLD) {
          next = false
        } else if (delta > 0) {
          next = true
        } else if (delta < 0) {
          next = false
        }
        if (next !== prev) {
          cooldownUntil = now + COOLDOWN_MS
        }
        return next
      })

      lastScrollYRef.current = window.scrollY
    }

    function onScroll() {
      if (rafId !== null) return
      rafId = requestAnimationFrame(evaluate)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Force chrome visible whenever the user is interacting with any overlay.
  useEffect(() => {
    if (activeMenu || isCartOpen || drawerOpen || mobileSearchOpen) {
      setHideChrome(false)
    }
  }, [activeMenu, isCartOpen, drawerOpen, mobileSearchOpen])

  useEffect(() => {
    const updateCompactDesktop = () => {
      const width = window.innerWidth
      setIsCompactDesktop(width >= 768 && width < COMPACT_DESKTOP_MAX_WIDTH)
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
    "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center text-black transition-all duration-200 ease-out hover:scale-110 hover:text-[#C6A75E] active:scale-90 active:duration-75 sm:h-11 sm:w-11"
  const showCompactToolbar = isCompactDesktop

  return (
    <>
      <header
        id="site-navbar"
        ref={headerRef}
        className="relative z-50 w-full sticky top-0 overflow-visible bg-white text-neutral-800"
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
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A75E] px-1 text-[10px] text-white">
                    {itemCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* ===== DESKTOP TOOLBAR (ancho completo) ===== */}
        {/* Altura controlada por --navbar-actual-h (animada vía @property CSS).
            Top row es flex-1, nav row es 48px fijo. Así una sola variable mueve
            navbar + filter bar sticky perfectamente sincronizados. */}
        <div
          className={`navbar-toolbar relative z-10 flex w-full flex-col ${showCompactToolbar ? "hidden" : "hidden md:flex"}`}
          style={{ height: "var(--navbar-actual-h)" }}
          onMouseLeave={scheduleMenuClose}
        >
          {/* Fila superior: logo centrado + iconos a la derecha. Su altura cae a 0
              cuando --navbar-actual-h se reduce a la altura de la fila nav. */}
          <div
            className="min-h-0 flex-1 overflow-hidden transition-opacity duration-150 ease-out"
            style={{ opacity: hideChrome ? 0 : 1 }}
            aria-hidden={hideChrome}
          >
            <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center pt-4">
                <div aria-hidden />

                <Link
                  href="/"
                  className="shrink-0 justify-self-center no-underline transition-opacity hover:opacity-90"
                  tabIndex={hideChrome ? -1 : 0}
                  aria-label="Ir al inicio"
                  onMouseEnter={scheduleMenuClose}
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
                  onMouseEnter={scheduleMenuClose}
                >
                  <button
                    type="button"
                    onClick={() => { setActiveMenu(null); toggleMobileSearch() }}
                    className={`${iconBtnBase} h-9 w-9 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
                    aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Buscar"}
                  >
                    <Search className="h-5 w-5" strokeWidth={1.75} />
                  </button>

                  <Link
                    href="/wishlist"
                    onClick={() => setActiveMenu(null)}
                    className={`relative ${iconBtnBase} h-9 w-9 justify-center`}
                    tabIndex={hideChrome ? -1 : 0}
                    aria-label="Favoritos"
                  >
                    <span className="relative shrink-0">
                      <Heart className="h-5 w-5" strokeWidth={1.75} />
                      <WishlistCountBadge count={wishlistCount} />
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
                      {itemCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A75E] px-1 text-[10px] text-white">
                          {itemCount}
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
                className={`pointer-events-none absolute -bottom-1 h-[1.5px] bg-[#C6A75E] duration-150 ease-out ${
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
                    activeMenu === label ? "text-[#C6A75E]" : "text-[#1a1a1a] hover:text-[#C6A75E]"
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
          onMouseLeave={scheduleMenuClose}
        />
        <DesktopMegaMenu
          isOpen={activeMenu === "Academia"}
          categories={cursosCategories}
          sectionHref="/academia"
          sectionLabel="cursos"
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
        />
        <DesktopMegaMenu
          isOpen={activeMenu === "Servicios"}
          categories={serviciosCategories}
          sectionHref="/servicios"
          sectionLabel="servicios"
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
        />
        <BestSellersMegaMenu
          isOpen={activeMenu === "Best Sellers"}
          products={bestSellers}
          loading={emptyStateLoading}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
        />
        <BrandsMegaMenu
          isOpen={activeMenu === "Marcas"}
          brands={brandMenuItems}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
        />
        <LizMegaMenu
          isOpen={activeMenu === "Conócenos"}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
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
      />

      {/* Overlay de blur global (carrito + megamenu desktop) */}
      <div
        className={`fixed inset-0 top-[var(--site-chrome-bottom,var(--navbar-actual-h))] backdrop-blur-md bg-black/10 z-[45] transition-opacity duration-300 md:top-0 ${
          isCartOpen || activeMenu ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          closeCart()
          setDrawerOpen(false)
          setActiveMenu(null)
        }}
        onClick={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          if (overlayGuardRef.current) return
          closeCart()
          setDrawerOpen(false)
          setActiveMenu(null)
        }}
      />
    </>
  )
}
