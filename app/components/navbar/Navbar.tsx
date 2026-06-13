"use client"

import Link from "next/link"
import { Search, User, ShoppingBag, ChevronDown, X } from "lucide-react"
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { menuData } from "./menuData"
import MegaMenu from "./dropdowns/MegaMenu"
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
  | "cart"
  | "user"
  | null

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
  const lastScrollY = useRef(0)
  const headerRef = useRef<HTMLElement>(null)
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

  const currentMenu =
    activeMenu && activeMenu in menuData
      ? menuData[activeMenu as keyof typeof menuData]
      : null

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
      <header ref={headerRef} className="relative z-50 w-full sticky top-0 overflow-visible border-b border-white/10 bg-[#0a0a0a] px-4 text-neutral-300 md:px-6">

        {/* ===== MOBILE: Fila 1 – Logo centrado | User + Cart ===== */}
        <div className="md:hidden grid grid-cols-[1fr_auto_1fr] items-center h-[var(--navbar-h)]">

          <div />

          <Link
            href="/"
            className="flex flex-col items-center font-serif leading-tight text-inherit no-underline transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
          >
            <div className="text-[19px] text-white tracking-[0.10em]">Liz Cabriales</div>
            <div className="text-[8px] tracking-[0.30em] uppercase text-[#C6A75E]">STUDIO</div>
          </Link>

          <div className="flex items-center gap-3 justify-end">
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
        <div className="md:hidden" data-mobile-nav>
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

              {/* Dropdown anidado — se lleva consigo al colapsar por scroll */}
              <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${mobileNavOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden min-h-0">
                  <div className="border-t border-white/5 bg-[#0a0a0a] px-5 py-4">
                    {mobileNavOpen === "Tienda" && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Categorías</p>
                          {[
                            { label: "Kits", href: "/tienda?categoria=kits" },
                            { label: "Acrílicos", href: "/tienda?categoria=acrilicos" },
                            { label: "Gel UV", href: "/tienda?categoria=gel-uv" },
                            { label: "Ver todo", href: "/tienda" },
                          ].map((l) => (
                            <Link key={l.href} href={l.href} onClick={() => setMobileNavOpen(null)}
                              className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Explorar</p>
                          {[
                            { label: "Nuevos productos", href: "/tienda" },
                            { label: "Más vendidos", href: "/tienda" },
                            { label: "Ofertas", href: "/tienda" },
                          ].map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                              className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {mobileNavOpen === "Cursos" && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Cursos</p>
                          {[
                            { label: "Todos los cursos", href: "/academia" },
                            { label: "Curso básico", href: "/academia" },
                            { label: "Masterclass", href: "/academia" },
                          ].map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                              className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Academia</p>
                          {[
                            { label: "Próximos eventos", href: "/academia" },
                            { label: "Cómo inscribirme", href: "/academia#como-inscribirme" },
                          ].map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                              className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {mobileNavOpen === "Servicios" && (
                      <div className="grid grid-cols-2 gap-x-4">
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Servicios</p>
                          {[
                            { label: "Agendar cita", href: "/citas" },
                            { label: "Ver disponibilidad", href: "/citas" },
                          ].map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                              className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

        </div>

        {/* ===== MOBILE: Barra de búsqueda permanente ===== */}
        <div className="md:hidden relative" data-mobile-search>
          <div className="pt-1 pb-2">
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
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      mobileSearchCategoriesOpen ? "rotate-180" : ""
                    }`}
                  />
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
          </div>
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

        {/* ===== DESKTOP: Fila única ===== */}
        <div className="hidden md:flex mx-auto h-[var(--navbar-h)] max-w-[1400px] items-center gap-6">

          <Link
            href="/"
            className="flex shrink-0 flex-col font-serif leading-tight text-inherit no-underline transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
          >
            <div className="self-start text-[30px] text-white tracking-[0.12em]">
              Liz Cabriales
            </div>
            <div className="self-end text-[12px] tracking-[0.30em] uppercase text-[#C6A75E]">
              STUDIO
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-4 overflow-visible">

            <nav className="hidden lg:flex gap-7 text-[15px] tracking-[0.04em] capitalize font-medium">
              {(Object.keys(menuData) as (keyof typeof menuData)[]).map((item) => {
                const href = item === "Tienda" ? "/tienda" : "/academia"
                return (
                  <Link
                    key={item}
                    href={href}
                    onMouseEnter={() => openNavMenu(item)}
                    onFocus={() => openNavMenu(item)}
                    className="relative group cursor-pointer border-none bg-transparent text-[16px] tracking-[0.05em] text-neutral-300"
                  >
                    <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                      {item}
                    </span>
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
                  </Link>
                )
              })}

              <Link
                href="/servicios"
                onMouseEnter={() => { closeSearchPanels(); setActiveMenu(null) }}
                onFocus={() => { closeSearchPanels(); setActiveMenu(null) }}
                className="relative group text-[16px] tracking-[0.05em] text-neutral-300"
              >
                <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
                  Servicios
                </span>
                <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
              </Link>

              <MegaMenu activeMenu={activeMenu} currentMenu={currentMenu} />
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 py-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Categorías</p>
              {[
                { label: "Kits", href: "/tienda?categoria=kits" },
                { label: "Acrílicos", href: "/tienda?categoria=acrilicos" },
                { label: "Gel UV", href: "/tienda?categoria=gel-uv" },
                { label: "Ver todo", href: "/tienda" },
              ].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileNavOpen(null)}
                  className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Explorar</p>
              {[
                { label: "Nuevos productos", href: "/tienda" },
                { label: "Más vendidos", href: "/tienda" },
                { label: "Ofertas", href: "/tienda" },
              ].map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                  className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        {mobileNavOpen === "Cursos" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 py-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Cursos</p>
              {[
                { label: "Todos los cursos", href: "/academia" },
                { label: "Curso básico", href: "/academia" },
                { label: "Masterclass", href: "/academia" },
              ].map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                  className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Academia</p>
              {[
                { label: "Próximos eventos", href: "/academia" },
                { label: "Cómo inscribirme", href: "/academia#como-inscribirme" },
              ].map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                  className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        {mobileNavOpen === "Servicios" && (
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">Servicios</p>
            <div className="grid grid-cols-2 gap-x-4">
              {[
                { label: "Agendar cita", href: "/servicios" },
                { label: "Ver disponibilidad", href: "/servicios" },
              ].map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMobileNavOpen(null)}
                  className="block py-1.5 text-[14px] text-neutral-300 transition-colors hover:text-[#C6A75E]">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== Overlay de blur global ===== */}
      <div
        className={`fixed inset-0 top-[var(--navbar-h)] backdrop-blur-md bg-black/10 z-30 transition-opacity duration-300 ${
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
