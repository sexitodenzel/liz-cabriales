"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, ShoppingBag, X } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { tiendaCategories } from "./menuData"
import CartMenu from "./dropdowns/CartMenu"
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
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import { useCart } from "../cart/CartContext"
import { SITE_CONTAINER_CLASS } from "@/lib/site-shell"

type NavbarProps = {
  isLoggedIn?: boolean
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentProducts, setRecentProducts] = useState<RecentProductMenuItem[]>([])
  const [brandMenuItems, setBrandMenuItems] = useState<BrandMenuItem[]>([])
  const [suggestionProducts, setSuggestionProducts] = useState<SearchSuggestionProduct[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [topSearches, setTopSearches] = useState<TopSearchChip[]>([])
  const [bestSellers, setBestSellers] = useState<SearchSuggestionProduct[]>([])
  const [emptyStateLoading, setEmptyStateLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const overlayGuardRef = useRef(false)
  const {
    itemCount,
    isCartOpen,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
  } = useCart()

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

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const update = () =>
      document.documentElement.style.setProperty("--navbar-actual-h", `${header.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isCartOpen) {
      setDrawerOpen(false)
      setMobileSearchOpen(false)
    }
  }, [isCartOpen])

  const tiendaMenuCategories = useMemo(
    () =>
      withBrandsCategory(
        withRecentProductsCategory(tiendaCategories, recentProducts),
        brandMenuItems
      ),
    [recentProducts, brandMenuItems]
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
          }
        }
        if (!isMounted) return
        setSuggestionProducts(Array.isArray(json.data?.products) ? json.data!.products! : [])
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

  const navRow = (
    <>
      <button
        type="button"
        onClick={() => { closeCart(); setMobileSearchOpen(false); setDrawerOpen((o) => !o) }}
        className="relative shrink-0 inline-flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-[#C6A75E]"
        aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <span
          className={`absolute flex h-7 w-7 flex-col items-center justify-center gap-[6px] transition-all duration-200 ${
            drawerOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
          }`}
          aria-hidden="true"
        >
          <span className="block h-[2px] w-6 rounded-full bg-current" />
          <span className="block h-[2px] w-6 rounded-full bg-current" />
        </span>
        <X
          className={`absolute h-7 w-7 transition-all duration-200 ${
            drawerOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
          }`}
        />
      </button>

      <div className="flex flex-1 items-center justify-center">
        <Link
          href="/"
          className="shrink-0 no-underline transition-opacity hover:opacity-90"
          aria-label="Ir al inicio"
        >
          <Image
            src="/images/logo.png"
            alt="Liz Cabriales"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={toggleMobileSearch}
          className="inline-flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-[#C6A75E]"
          aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Buscar"}
        >
          <Search className="h-6 w-6" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center text-black transition-colors hover:text-[#C6A75E]"
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
            <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C6A75E] text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <header
        id="site-navbar"
        ref={headerRef}
        className="relative z-50 w-full sticky top-0 overflow-visible bg-white text-neutral-800"
      >

        <div
          className={`${SITE_CONTAINER_CLASS} relative z-10 flex h-[var(--navbar-h)] items-center`}
        >
          {navRow}
        </div>

        <CartMenu />
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
        suggestionsLoading={suggestionsLoading}
        topSearches={topSearches}
        bestSellers={bestSellers}
        emptyLoading={emptyStateLoading}
      />

      {/* Overlay de blur global (carrito) */}
      <div
        className={`fixed inset-0 top-[var(--navbar-actual-h)] backdrop-blur-md bg-black/10 z-[45] transition-opacity duration-300 md:top-0 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          closeCart()
          setDrawerOpen(false)
        }}
        onClick={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          if (overlayGuardRef.current) return
          closeCart()
          setDrawerOpen(false)
        }}
      />
    </>
  )
}
