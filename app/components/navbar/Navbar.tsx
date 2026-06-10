"use client"

/* =========================================
   IMPORTS ESTA MAMADA CONTROLA MENUS 
   ========================================= */

import Link from "next/link"
import { Search, User, ShoppingBag, ChevronDown } from "lucide-react"
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

/* =========================================
   TYPES
   ========================================= */

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


/* =========================================
   STATE (Menu Controller)
   ========================================= */

  // Controlador central de todos los menús del navbar.
  // Solo un menú puede estar activo a la vez.
  // Ejemplos de valores:
  // "Tienda", "Academia", "search", "cart", etc.

  const [activeMenu, setActiveMenu] = useState<MenuType>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
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
    setMobileSearchOpen(false)
    setMobileSearchCategoriesOpen(false)
    setAllCategoriesOpen(false)
    clearCategoriesLeaveTimer()
  }, [clearCategoriesLeaveTimer])

  const finishSearchNavigation = useCallback(() => {
    setSearchQuery("")
    closeSearchPanels()
  }, [closeSearchPanels])

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

/* =========================================
   DERIVED STATE
   ========================================= */

  // Obtiene el contenido del mega menu dependiendo
  // del item activo del navbar.

  const currentMenu =
  activeMenu && activeMenu in menuData
    ? menuData[activeMenu as keyof typeof menuData]
    : null


/* =========================================
   EFFECTS
   ========================================= */

  // Si el mouse sale completamente de la ventana del navegador
  // se cierra cualquier menú abierto.
  // Esto evita menús "pegados" si el usuario sale de la página.

  useEffect(() => {
    function handleMouseLeavePage(e: MouseEvent) {
      if (e.clientY <= 0 || e.clientX <= 0) {
        setActiveMenu(null)
        closeSearchPanels()
        closeCart()
      }
    }

    document.addEventListener("mouseleave", handleMouseLeavePage)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeavePage)
    }
  }, [closeCart, closeSearchPanels])

  // Cualquier menú del navbar abierto cierra el carrito
  useEffect(() => {
    if (activeMenu !== null) {
      closeCart()
    }
  }, [activeMenu, closeCart])

  useEffect(() => {
    if (!mobileNavOpen) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-mobile-nav]")) {
        setMobileNavOpen(false)
        setMobileCategoriesOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileSearchOpen) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-mobile-search]")) {
        setMobileSearchOpen(false)
        setMobileSearchCategoriesOpen(false)
        setMobileSuggestionsOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [mobileSearchOpen])

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
        if (isMounted) {
          setCategoriesLoading(false)
        }
      }
    }

    void loadCategories()
    return () => {
      isMounted = false
    }
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
        if (isMounted) {
          setSuggestionsLoading(false)
        }
      }
    }, 180)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
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


{/* =========================================
   HEADER
   ========================================= */}

<header className="relative z-50 w-full sticky top-0 overflow-visible border-b border-black/5 bg-white px-4 md:px-6">

<div className="mx-auto flex h-[var(--navbar-h)] max-w-[1400px] items-center gap-3 md:gap-6">

{/* =========================================
   LEFT SIDE
   BRAND LOGO
   ========================================= */}

<Link
  href="/"
  className="flex shrink-0 flex-col font-serif leading-tight text-inherit no-underline transition-opacity hover:opacity-90"
  aria-label="Ir al inicio"
>
  <div className="self-start text-[19px] md:text-[30px] tracking-[0.10em] md:tracking-[0.12em]">
    Liz Cabriales
  </div>

  <div className="self-end text-[8px] md:text-[12px] tracking-[0.30em] uppercase text-[#C6A75E]">
    STUDIO
  </div>
</Link>


{/* =========================================
   CENTER
   NAV LINKS + SEARCH BAR
   ========================================= */}

<div className="flex min-w-0 flex-1 items-center gap-3 overflow-visible md:gap-4">

<div className="relative md:hidden" data-mobile-nav>
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation()
      setMobileNavOpen((open) => !open)
      setMobileCategoriesOpen(false)
      setActiveMenu(null)
      setAllCategoriesOpen(false)
      closeCart()
    }}
    className="inline-flex items-center gap-1 text-[13px] font-semibold tracking-[0.05em] text-[var(--foreground)]"
    aria-expanded={mobileNavOpen}
    aria-haspopup="true"
    aria-label="Menú de módulos"
  >
    Tienda
    <ChevronDown
      className={`h-3.5 w-3.5 transition-transform duration-200 ${
        mobileNavOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  <div
    className={`absolute left-0 top-full z-50 mt-2 min-w-[160px] origin-top transition-all duration-300 ease-out ${
      mobileNavOpen
        ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
        : "pointer-events-none -translate-y-2 scale-95 opacity-0"
    }`}
    aria-hidden={!mobileNavOpen}
  >
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-lg">
      <div className="px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={() => setMobileCategoriesOpen((open) => !open)}
          className="flex w-full items-center justify-between py-2.5 text-left text-[13px] font-semibold tracking-[0.05em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
        >
          <span>Todos</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              mobileCategoriesOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            mobileCategoriesOpen ? "max-h-[280px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <Link
            href="/tienda"
            onClick={() => {
              setMobileNavOpen(false)
              setMobileCategoriesOpen(false)
            }}
            tabIndex={mobileNavOpen ? 0 : -1}
            className="block py-2 pl-3 text-[12px] font-medium tracking-[0.04em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
          >
            Ver todo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tienda?categoria=${category.slug}`}
              onClick={() => {
                setMobileNavOpen(false)
                setMobileCategoriesOpen(false)
              }}
              tabIndex={mobileNavOpen ? 0 : -1}
              className="block py-2 pl-3 text-[12px] font-medium tracking-[0.04em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
            >
              {category.name}
            </Link>
          ))}
        </div>
        <div
          className="w-[80%] border-b-2 border-[#C6A75E]"
          aria-hidden="true"
        />

        {[
          { label: "Tienda", href: "/tienda" },
          { label: "Cursos", href: "/academia" },
          { label: "Citas", href: "/citas" },
        ].map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              tabIndex={mobileNavOpen ? 0 : -1}
              className="block py-2.5 text-[13px] font-semibold tracking-[0.05em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
            >
              {item.label}
            </Link>
            <div
              className="w-[80%] border-b-2 border-[#C6A75E]"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

<nav className="hidden lg:flex gap-7 text-[15px] tracking-[0.04em] capitalize font-medium">

{/* Render dinámico de links del navbar */}
{(Object.keys(menuData) as (keyof typeof menuData)[]).map((item) => {
  const href = item === "Tienda" ? "/tienda" : "/academia"

  return (
    <Link
      key={item}
      href={href}
      onMouseEnter={() => openNavMenu(item)}
      onFocus={() => openNavMenu(item)}
      className="relative group text-[16px] tracking-[0.05em] text-[var(--foreground)] cursor-pointer bg-transparent border-none"
    >
      <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
        {item}
      </span>
      <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full"></span>
    </Link>
  )
})}

<Link
  href="/citas"
  onMouseEnter={() => {
    closeSearchPanels()
    setActiveMenu(null)
  }}
  onFocus={() => {
    closeSearchPanels()
    setActiveMenu(null)
  }}
  className="relative group text-[16px] tracking-[0.05em] text-[var(--foreground)]"
>
  <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
    Citas
  </span>
  <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full"></span>
</Link>


{/* MegaMenu Component */}
<MegaMenu activeMenu={activeMenu} currentMenu={currentMenu} />
</nav>

<div
  className="relative hidden min-w-0 flex-1 md:block"
  data-search-autocomplete
>
  <form
    onSubmit={handleSearchSubmit}
    className="relative flex w-full items-center rounded-full border border-black/10 bg-white px-1.5 py-1"
  >
    <div
      className="relative shrink-0"
      data-all-categories
      onMouseEnter={openCategoriesMenu}
      onMouseLeave={scheduleCloseCategories}
    >
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
        aria-label="Abrir categorías"
        aria-expanded={allCategoriesOpen}
        aria-haspopup="menu"
      >
        Todos
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
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
    <div className="mx-1.5 h-5 w-px shrink-0 bg-black/10" aria-hidden="true" />
    <input
      type="search"
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
        if (searchQuery.trim().length >= 2) {
          setSuggestionsOpen(true)
        }
      }}
      placeholder="¿Qué estás buscando?"
      className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[var(--foreground)] placeholder:text-neutral-400 outline-none"
      aria-label="Buscar productos"
    />
    <button
      type="submit"
      className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
      aria-label="Buscar"
    >
      <Search className="h-4 w-4" />
    </button>
  </form>

  <DesktopSearchSuggestions
    open={
      suggestionsOpen && !allCategoriesOpen && searchQuery.trim().length >= 2
    }
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



{/* =========================================
   RIGHT SIDE
   NAVBAR ICONS
   ========================================= */}

<div className="flex items-center justify-end gap-3 md:gap-10">


<button
  type="button"
  onClick={() => {
    setMobileSearchOpen((open) => !open)
    setMobileSearchCategoriesOpen(false)
    setMobileSuggestionsOpen(false)
    setMobileNavOpen(false)
    setMobileCategoriesOpen(false)
    setAllCategoriesOpen(false)
    setActiveMenu(null)
  }}
  className="inline-flex md:hidden items-center text-[var(--foreground)]"
  aria-label="Abrir búsqueda"
>
  <Search className="w-5 h-5 shrink-0" />
</button>



{/* USER ICON */}

<Link
  href={isLoggedIn ? "/perfil" : "/login"}
  className="group inline-flex items-center text-[16px] tracking-[0.05em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
  aria-label={isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
>
  <User className="w-5 h-5 md:w-7 md:h-7 shrink-0" />
  <span className="hidden md:grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr] group-hover:ml-2">
    <span className="overflow-hidden whitespace-nowrap">
      {isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
    </span>
  </span>
</Link>
{/* CART ICON */}

<button
  type="button"
  className="group relative inline-flex items-center text-[16px] tracking-[0.05em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
  onClick={() => {
    setMobileNavOpen(false)
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
    <ShoppingBag className="w-5 h-5 md:w-7 md:h-7" />
    {itemCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-[#C6A75E] text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
        {itemCount}
      </span>
    )}
  </span>
  <span className="hidden md:grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr] group-hover:ml-2">
    <span className="overflow-hidden whitespace-nowrap">Carrito</span>
  </span>
</button>


</div>

</div>

<div
  className={`relative pb-3 md:hidden ${mobileSearchOpen ? "block" : "hidden"}`}
  data-mobile-search
>
  <form
    onSubmit={handleSearchSubmit}
    className="relative z-[71] flex items-center rounded-full border border-black/10 bg-white px-2 py-1"
  >
    <div className="relative shrink-0" data-all-categories>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold tracking-[0.04em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
        onClick={(e) => {
          e.stopPropagation()
          setMobileSearchCategoriesOpen((open) => !open)
          setMobileSuggestionsOpen(false)
        }}
        aria-label="Abrir categorías"
        aria-expanded={mobileSearchCategoriesOpen}
        aria-haspopup="menu"
      >
        Todos
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            mobileSearchCategoriesOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <MobileCategoriesDropdown
        open={mobileSearchCategoriesOpen}
        categories={categories}
        loading={categoriesLoading}
        onClose={finishSearchNavigation}
      />
    </div>
    <div className="mx-2 h-5 w-px bg-black/10" />
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => {
        const value = e.target.value
        setSearchQuery(value)
        setMobileSearchCategoriesOpen(false)
        setMobileSuggestionsOpen(value.trim().length >= 2)
        if (value.trim().length >= 2) {
          setMobileSuggestionTab("productos")
        }
      }}
      onFocus={() => {
        if (searchQuery.trim().length >= 2) {
          setMobileSuggestionsOpen(true)
        }
      }}
      placeholder="¿Qué estás buscando?"
      className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[var(--foreground)] placeholder:text-neutral-400 outline-none"
      aria-label="Buscar productos"
    />
    <button
      type="submit"
      className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
      aria-label="Buscar"
    >
      <Search className="h-4 w-4" />
    </button>
  </form>

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

<CartMenu />

</header>



{/* =========================================
   GLOBAL BLUR OVERLAY
   ========================================= */}

{/* 
   Este overlay se activa cuando cualquier menú está abierto.
   Aplica blur al fondo y permite cerrar el menú al entrar
   el mouse en el área.
*/}

<div
className={`fixed inset-0 top-[var(--navbar-h)] backdrop-blur-md bg-black/10 z-30 transition-opacity duration-300 ${
activeMenu || isCartOpen || allCategoriesOpen || suggestionsOpen || mobileSearchCategoriesOpen || mobileSuggestionsOpen
  ? "opacity-100"
  : "opacity-0 pointer-events-none"
}`}
onMouseEnter={() => {
  if (isProgrammatic()) {
    clearProgrammatic()
    return
  }
  closeCart()
  setAllCategoriesOpen(false)
  setSuggestionsOpen(false)
  setMobileSearchCategoriesOpen(false)
  setMobileSuggestionsOpen(false)
  setActiveMenu(null)
}}
></div>



</>

)

}