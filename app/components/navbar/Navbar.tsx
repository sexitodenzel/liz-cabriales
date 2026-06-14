"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, User, ShoppingBag, ChevronDown, X } from "lucide-react"
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { tiendaCategories, cursosCategories, serviciosCategories } from "./menuData"
import TiendaMegaMenu from "./dropdowns/TiendaMegaMenu"
import CartMenu from "./dropdowns/CartMenu"
import {
  DesktopCategoriesDropdown,
  DesktopSearchSuggestions,
  MobileCategoriesDropdown,
  MobileSearchSuggestions,
  type NavbarCategory,
  type SearchSuggestionCategory,
  type SearchSuggestionProduct,
} from "./SearchBarPanels"
import { useCart } from "../cart/CartContext"
import { getSearchDestination } from "@/lib/search-navigation"

export type MenuType =
  | "Tienda"
  | "Academia"
  | "Servicios"
  | "cart"
  | "user"
  | null

function TiendaMobileAccordion({
  openCategory,
  setOpenCategory,
  onClose,
  categories,
  sectionHref,
  sectionLabel,
}: {
  openCategory: string | null
  setOpenCategory: (slug: string | null) => void
  onClose: () => void
  categories: typeof tiendaCategories
  sectionHref: string
  sectionLabel: string
}) {
  return (
    <div>
      <Link
        href={sectionHref}
        onClick={onClose}
        className="block pb-3 text-[12px] font-semibold tracking-[0.05em] text-[#C6A75E]"
      >
        Ver {sectionLabel} →
      </Link>
      {categories.map((cat) => {
        const isCatOpen = openCategory === cat.slug
        return (
          <div key={cat.slug} className="border-b border-white/5 last:border-0">
            <button
              type="button"
              onClick={() => setOpenCategory(isCatOpen ? null : cat.slug)}
              className={`flex w-full items-center justify-between py-2.5 text-[14px] transition-colors ${
                isCatOpen ? "text-[#C6A75E]" : "text-neutral-300"
              }`}
            >
              <span>{cat.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                  isCatOpen ? "rotate-180 text-[#C6A75E]" : "text-neutral-500"
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
                isCatOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className="pb-2 pl-3">
                  <Link
                    href={cat.href}
                    onClick={onClose}
                    className="block py-1.5 text-[12px] font-medium text-[#C6A75E]/70 hover:text-[#C6A75E] transition-colors"
                  >
                    Ver todo en {cat.label}
                  </Link>
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={onClose}
                      className="block py-1.5 text-[13px] text-neutral-400 transition-colors hover:text-[#C6A75E]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type NavbarProps = {
  isLoggedIn?: boolean
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const router = useRouter()

  const [activeMenu, setActiveMenu] = useState<MenuType>(null)
  const [mobileSearchCategoriesOpen, setMobileSearchCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<NavbarCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [suggestionProducts, setSuggestionProducts] = useState<SearchSuggestionProduct[]>([])
  const [suggestionCategories, setSuggestionCategories] = useState<SearchSuggestionCategory[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionTab, setSuggestionTab] = useState<"productos" | "colecciones">("productos")
  const [mobileSuggestionTab, setMobileSuggestionTab] = useState<"productos" | "colecciones">("productos")
  const [mobileNavOpen, setMobileNavOpen] = useState<"Tienda" | "Cursos" | "Servicios" | null>(null)
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null)
  const lastScrollY = useRef(0)
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

  const categoriesLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCategoriesLeaveTimer = useCallback(() => {
    if (categoriesLeaveTimerRef.current) {
      clearTimeout(categoriesLeaveTimerRef.current)
      categoriesLeaveTimerRef.current = null
    }
  }, [])

  const closeSearchPanels = useCallback(() => {
    setSuggestionsOpen(false)
    setMobileSuggestionsOpen(false)
    setMobileSearchCategoriesOpen(false)
    setAllCategoriesOpen(false)
    clearCategoriesLeaveTimer()
  }, [clearCategoriesLeaveTimer])

  const finishSearchNavigation = useCallback(() => {
    setSearchQuery("")
    closeSearchPanels()
  }, [closeSearchPanels])

  const clearSearchQuery = useCallback(() => {
    setSearchQuery("")
    setSuggestionsOpen(false)
    setMobileSuggestionsOpen(false)
  }, [])

  const scheduleCloseCategories = useCallback(() => {
    clearCategoriesLeaveTimer()
    categoriesLeaveTimerRef.current = setTimeout(() => {
      setAllCategoriesOpen(false)
    }, 120)
  }, [clearCategoriesLeaveTimer])

  const openCategoriesMenu = useCallback(() => {
    clearCategoriesLeaveTimer()
    setActiveMenu(null)
    setSuggestionsOpen(false)
    setAllCategoriesOpen(true)
  }, [clearCategoriesLeaveTimer])

  const openNavMenu = useCallback(
    (menu: MenuType) => {
      closeSearchPanels()
      setActiveMenu(menu)
    },
    [closeSearchPanels]
  )

  useEffect(() => {
    function handleMouseLeavePage(e: MouseEvent) {
      if (e.clientY <= 0 || e.clientX <= 0) {
        setActiveMenu(null)
        closeSearchPanels()
        closeCart()
      }
    }
    document.addEventListener("mouseleave", handleMouseLeavePage)
    return () => document.removeEventListener("mouseleave", handleMouseLeavePage)
  }, [closeCart, closeSearchPanels])

  useEffect(() => {
    if (activeMenu !== null) closeCart()
  }, [activeMenu, closeCart])

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current) {
        setMobileNavOpen(null)
        setMobileSuggestionsOpen(false)
        setMobileSearchCategoriesOpen(false)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  // Cierra sugerencias al tocar fuera de la barra de búsqueda
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-mobile-search]")) {
        setMobileSearchCategoriesOpen(false)
        setMobileSuggestionsOpen(false)
      }
      if (!target.closest("[data-mobile-nav]")) {
        setMobileNavOpen(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isCartOpen) setMobileNavOpen(null)
  }, [isCartOpen])


  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
      try {
        const response = await fetch("/api/products/categories")
        if (!response.ok) return
        const json = (await response.json()) as { data?: NavbarCategory[] }
        if (!isMounted || !Array.isArray(json.data)) return
        setCategories(json.data)
      } finally {
        if (isMounted) setCategoriesLoading(false)
      }
    }
    void loadCategories()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSuggestionProducts([])
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
            categories?: SearchSuggestionCategory[]
          }
        }
        if (!isMounted) return
        setSuggestionProducts(Array.isArray(json.data?.products) ? json.data!.products! : [])
        setSuggestionCategories(
          Array.isArray(json.data?.categories) ? json.data!.categories! : []
        )
      } finally {
        if (isMounted) setSuggestionsLoading(false)
      }
    }, 180)
    return () => { isMounted = false; clearTimeout(timeout) }
  }, [searchQuery])

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(getSearchDestination(searchQuery))
    finishSearchNavigation()
    setActiveMenu(null)
    closeCart()
  }

  return (
    <>
      <header ref={headerRef} className={`relative z-50 w-full sticky top-0 overflow-visible border-b ${isCartOpen ? "border-transparent" : "border-white/10"} bg-[#0a0a0a] px-4 text-neutral-300 md:px-6`}>

        {/* Video de fondo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20 pointer-events-none select-none"
          style={{ zIndex: 0 }}
        >
          <source src="/videos/navbar-bg.mp4" type="video/mp4" />
        </video>

        {/* ===== MOBILE: Fila 1 – Logo izquierda | Search | User + Cart ===== */}
        <div className="relative z-10 md:hidden flex items-center gap-2 h-[var(--navbar-h)]" data-mobile-search>

          <Link
            href="/"
            className="shrink-0 no-underline transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
          >
            <Image
              src="/images/logo.png"
              alt="Liz Cabriales"
              width={72}
              height={72}
              className="mix-blend-screen object-contain"
              priority
            />
          </Link>

          <div className="relative flex-1 min-w-0">
            <form
              onSubmit={handleSearchSubmit}
              className={`relative z-[71] flex items-center border border-white/10 bg-[#141414] px-2 py-1 transition-[border-radius,border-bottom-color] duration-200 ${
                mobileSearchCategoriesOpen || (mobileSuggestionsOpen && searchQuery.trim().length >= 2)
                  ? "rounded-t-full border-b-[#141414]"
                  : "rounded-full"
              }`}
            >
              <div className="relative shrink-0" data-all-categories>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-neutral-400 transition-colors hover:text-[#C6A75E]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMobileSearchCategoriesOpen((open) => !open)
                    setMobileSuggestionsOpen(false)
                  }}
                  aria-label="Abrir categorías"
                  aria-expanded={mobileSearchCategoriesOpen}
                  aria-haspopup="menu"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileSearchCategoriesOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              <div className="mx-1.5 h-5 w-px shrink-0 bg-white/15" aria-hidden="true" />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  setMobileSearchCategoriesOpen(false)
                  setMobileSuggestionsOpen(value.trim().length >= 2)
                  if (value.trim().length >= 2) setMobileSuggestionTab("productos")
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setMobileSuggestionsOpen(true)
                }}
                placeholder="¿Qué estás buscando?"
                className="navbar-search-input min-w-0 flex-1 bg-transparent px-2 text-base text-neutral-200 placeholder:text-neutral-500 outline-none md:text-sm"
                aria-label="Buscar productos"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchQuery}
                  className="gold-clear-btn inline-flex shrink-0 items-center justify-center rounded-full p-1.5"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-neutral-400 transition-colors hover:text-[#C6A75E]"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            <MobileCategoriesDropdown
              open={mobileSearchCategoriesOpen}
              categories={categories}
              loading={categoriesLoading}
              onClose={finishSearchNavigation}
            />
            <MobileSearchSuggestions
              open={mobileSuggestionsOpen && !mobileSearchCategoriesOpen}
              query={searchQuery}
              products={suggestionProducts}
              categories={suggestionCategories}
              loading={suggestionsLoading}
              activeTab={mobileSuggestionTab}
              onTabChange={setMobileSuggestionTab}
              onClose={finishSearchNavigation}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={isLoggedIn ? "/perfil" : "/login"}
              className="inline-flex items-center text-neutral-300 transition-colors hover:text-[#C6A75E]"
              aria-label={isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
            >
              <User className="w-5 h-5 shrink-0" />
            </Link>
            <button
              type="button"
              className="relative inline-flex items-center text-neutral-300 transition-colors hover:text-[#C6A75E]"
              onClick={() => {
                if (isCartOpen) {
                  closeCart()
                } else {
                  closeSearchPanels()
                  setActiveMenu(null)
                  openCart()
                }
              }}
              aria-label="Carrito"
            >
              <span className="relative shrink-0">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#C6A75E] text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* ===== MOBILE: Fila 2 – Nav con dropdowns ===== */}
        <div className="relative z-10 md:hidden" data-mobile-nav>
              {/* Botones de navegación */}
              <div className="flex">
                {(["Tienda", "Cursos", "Servicios"] as const).map((key) => {
                  const href = key === "Tienda" ? "/tienda" : key === "Cursos" ? "/academia" : "/citas"
                  const isOpen = mobileNavOpen === key
                  return (
                    <div key={key} className="flex flex-1 items-center">
                      <Link
                        href={href}
                        onClick={() => setMobileNavOpen(null)}
                        className={`flex-1 text-center py-2 text-[13px] font-semibold tracking-[0.05em] transition-colors ${
                          isOpen ? "text-[#C6A75E]" : "text-neutral-400 hover:text-[#C6A75E]"
                        }`}
                      >
                        {key}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          closeSearchPanels()
                          if (mobileNavOpen !== key) setOpenMobileCategory(null)
                          if (!isOpen) {
                            overlayGuardRef.current = true
                            requestAnimationFrame(() => { overlayGuardRef.current = false })
                          }
                          setMobileNavOpen(isOpen ? null : key)
                        }}
                        className={`px-2 py-2 transition-colors ${
                          isOpen ? "text-[#C6A75E]" : "text-neutral-500 hover:text-[#C6A75E]"
                        }`}
                        aria-label={`Abrir submenú ${key}`}
                      >
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  )
                })}
              </div>


        </div>

        {/* ===== DESKTOP: Fila principal ===== */}
        <div className="relative z-10 hidden md:flex mx-auto h-[var(--navbar-h)] max-w-[1400px] items-center gap-6">

          <Link
            href="/"
            className="shrink-0 no-underline transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
          >
            <Image
              src="/images/logo.png"
              alt="Liz Cabriales"
              width={110}
              height={110}
              className="mix-blend-screen object-contain"
              priority
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-4 overflow-visible">

            <nav className="hidden lg:flex gap-7 text-[15px] tracking-[0.04em] capitalize font-medium">
              <Link
                href="/tienda"
                onMouseEnter={() => openNavMenu("Tienda")}
                onFocus={() => openNavMenu("Tienda")}
                className="relative group cursor-pointer border-none bg-transparent text-[16px] tracking-[0.05em] text-neutral-300"
              >
                <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                  Tienda
                </span>
                <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
              </Link>

              <Link
                href="/academia"
                onMouseEnter={() => openNavMenu("Academia")}
                onFocus={() => openNavMenu("Academia")}
                className="relative group cursor-pointer border-none bg-transparent text-[16px] tracking-[0.05em] text-neutral-300"
              >
                <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                  Academia
                </span>
                <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
              </Link>

              <Link
                href="/servicios"
                onMouseEnter={() => openNavMenu("Servicios")}
                onFocus={() => openNavMenu("Servicios")}
                className="relative group text-[16px] tracking-[0.05em] text-neutral-300"
              >
                <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                  Servicios
                </span>
                <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
              </Link>

              <TiendaMegaMenu
                isOpen={activeMenu === "Tienda"}
                onClose={() => setActiveMenu(null)}
                categories={tiendaCategories}
                sectionHref="/tienda"
              />
              <TiendaMegaMenu
                isOpen={activeMenu === "Academia"}
                onClose={() => setActiveMenu(null)}
                categories={cursosCategories}
                sectionHref="/academia"
              />
              <TiendaMegaMenu
                isOpen={activeMenu === "Servicios"}
                onClose={() => setActiveMenu(null)}
                categories={serviciosCategories}
                sectionHref="/servicios"
              />
            </nav>

            <div className="relative min-w-0 flex-1" data-search-autocomplete>
              <form
                onSubmit={handleSearchSubmit}
                className={`relative flex w-full items-center border border-white/10 bg-[#141414] px-1.5 py-1 transition-[border-radius,border-bottom-color] duration-200 ${
                  suggestionsOpen && !allCategoriesOpen && searchQuery.trim().length >= 2
                    ? "rounded-t-full border-b-[#141414]"
                    : "rounded-full"
                }`}
              >
                <div
                  className="relative shrink-0"
                  data-all-categories
                  onMouseEnter={openCategoriesMenu}
                  onMouseLeave={scheduleCloseCategories}
                >
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-neutral-400 transition-colors hover:text-[#C6A75E]"
                    aria-label="Abrir categorías"
                    aria-expanded={allCategoriesOpen}
                    aria-haspopup="menu"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        allCategoriesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <DesktopCategoriesDropdown
                    open={allCategoriesOpen}
                    categories={categories}
                    loading={categoriesLoading}
                    onClose={finishSearchNavigation}
                    onMouseEnter={clearCategoriesLeaveTimer}
                    onMouseLeave={scheduleCloseCategories}
                  />
                </div>
                <div className="mx-1 h-5 w-px shrink-0 bg-white/15" aria-hidden="true" />
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    setAllCategoriesOpen(false)
                    clearCategoriesLeaveTimer()
                    if (value.trim().length >= 2) {
                      setActiveMenu(null)
                      setSuggestionsOpen(true)
                      setSuggestionTab("productos")
                    } else {
                      setSuggestionsOpen(false)
                    }
                  }}
                  onFocus={() => {
                    setActiveMenu(null)
                    clearCategoriesLeaveTimer()
                    setAllCategoriesOpen(false)
                    if (searchQuery.trim().length >= 2) setSuggestionsOpen(true)
                  }}
                  placeholder="¿Qué estás buscando?"
                  className="navbar-search-input min-w-0 flex-1 bg-transparent px-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none"
                  aria-label="Buscar productos"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSearchQuery}
                    className="gold-clear-btn inline-flex shrink-0 items-center justify-center rounded-full p-1.5"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-neutral-400 transition-colors hover:text-[#C6A75E]"
                  aria-label="Buscar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              <DesktopSearchSuggestions
                open={suggestionsOpen && !allCategoriesOpen && searchQuery.trim().length >= 2}
                query={searchQuery}
                products={suggestionProducts}
                categories={suggestionCategories}
                loading={suggestionsLoading}
                activeTab={suggestionTab}
                onTabChange={setSuggestionTab}
                onClose={finishSearchNavigation}
              />
            </div>
          </div>

          <div className="flex items-center gap-10">
            <Link
              href={isLoggedIn ? "/perfil" : "/login"}
              className="group inline-flex items-center text-[16px] tracking-[0.05em] text-neutral-300 transition-colors hover:text-[#C6A75E]"
              aria-label={isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
            >
              <User className="w-7 h-7 shrink-0" />
              <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr] group-hover:ml-2">
                <span className="overflow-hidden whitespace-nowrap">
                  {isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="group relative inline-flex items-center text-[16px] tracking-[0.05em] text-neutral-300 transition-colors hover:text-[#C6A75E]"
              onClick={() => {
                if (isCartOpen) {
                  closeCart()
                } else {
                  closeSearchPanels()
                  setActiveMenu(null)
                  openCart()
                }
              }}
              aria-label="Carrito"
            >
              <span className="relative shrink-0">
                <ShoppingBag className="w-7 h-7" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#C6A75E] text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr] group-hover:ml-2">
                <span className="overflow-hidden whitespace-nowrap">Carrito</span>
              </span>
            </button>
          </div>
        </div>

        <CartMenu />
      </header>

      {/* ===== MOBILE: Panel dropdown nav (fixed, bajo el navbar completo) ===== */}
      <div
        data-mobile-nav
        className={`fixed left-0 top-[var(--navbar-mobile-h)] w-full border-b border-white/10 bg-[#0a0a0a] z-40 md:hidden transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          mobileNavOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        {mobileNavOpen === "Tienda" && (
          <div className="px-5 py-4">
            <TiendaMobileAccordion
              openCategory={openMobileCategory}
              setOpenCategory={setOpenMobileCategory}
              onClose={() => setMobileNavOpen(null)}
              categories={tiendaCategories}
              sectionHref="/tienda"
              sectionLabel="toda la tienda"
            />
          </div>
        )}
        {mobileNavOpen === "Cursos" && (
          <div className="px-5 py-4">
            <TiendaMobileAccordion
              openCategory={openMobileCategory}
              setOpenCategory={setOpenMobileCategory}
              onClose={() => setMobileNavOpen(null)}
              categories={cursosCategories}
              sectionHref="/academia"
              sectionLabel="cursos"
            />
          </div>
        )}
        {mobileNavOpen === "Servicios" && (
          <div className="px-5 py-4">
            <TiendaMobileAccordion
              openCategory={openMobileCategory}
              setOpenCategory={setOpenMobileCategory}
              onClose={() => setMobileNavOpen(null)}
              categories={serviciosCategories}
              sectionHref="/servicios"
              sectionLabel="servicios"
            />
          </div>
        )}
      </div>

      {/* ===== Overlay de blur global ===== */}
      <div
        className={`fixed inset-0 top-[var(--navbar-actual-h)] backdrop-blur-md bg-black/10 z-30 transition-opacity duration-300 ${
          activeMenu || isCartOpen || allCategoriesOpen || suggestionsOpen || mobileSearchCategoriesOpen || mobileSuggestionsOpen || mobileNavOpen !== null
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          closeCart()
          setAllCategoriesOpen(false)
          setSuggestionsOpen(false)
          setMobileSearchCategoriesOpen(false)
          setMobileSuggestionsOpen(false)
          setActiveMenu(null)
          setMobileNavOpen(null)
        }}
        onClick={() => {
          if (isProgrammatic()) { clearProgrammatic(); return }
          if (overlayGuardRef.current) return
          closeCart()
          setAllCategoriesOpen(false)
          setSuggestionsOpen(false)
          setMobileSearchCategoriesOpen(false)
          setMobileSuggestionsOpen(false)
          setActiveMenu(null)
          setMobileNavOpen(null)
        }}
      />
    </>
  )
}
