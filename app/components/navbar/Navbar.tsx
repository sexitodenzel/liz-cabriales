"use client"

/* =========================================
   IMPORTS ESTA MAMADA CONTROLA MENUS 
   ========================================= */

import Link from "next/link"
import { Search, User, ShoppingBag, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { menuData } from "./menuData"
import MegaMenu from "./dropdowns/MegaMenu"
import SearchMenu from "./dropdowns/SearchMenu"
import DropdownContainer from "./dropdowns/DropdownContainer"
import CartMenu from "./dropdowns/CartMenu"
import { useCart } from "../cart/CartContext"

/* =========================================
   TYPES
   ========================================= */

   export type MenuType =
   | "Tienda"
   | "Academia"
   | "search"
   | "cart"
   | "user"
   | null

type NavbarProps = {
  isLoggedIn?: boolean
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {


/* =========================================
   STATE (Menu Controller)
   ========================================= */

  // Controlador central de todos los menús del navbar.
  // Solo un menú puede estar activo a la vez.
  // Ejemplos de valores:
  // "Tienda", "Academia", "search", "cart", etc.

  const [activeMenu, setActiveMenu] = useState<MenuType>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const {
    itemCount,
    isCartOpen,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
  } = useCart()

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
        closeCart()
      }
    }

    document.addEventListener("mouseleave", handleMouseLeavePage)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeavePage)
    }
  }, [closeCart])

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
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [mobileNavOpen])



/* =========================================
   RENDER
   ========================================= */

return (

<>


{/* =========================================
   HEADER
   ========================================= */}

<header className="w-full sticky top-0 z-50 bg-white px-6">

<div className="max-w-[1400px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center h-[var(--navbar-h)]">  


{/* =========================================
   LEFT SIDE
   NAVIGATION LINKS
   ========================================= */}

<div className="flex items-center gap-8 justify-start">

<div className="relative md:hidden" data-mobile-nav>
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation()
      setMobileNavOpen((open) => !open)
      setActiveMenu(null)
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

<nav className="hidden md:flex gap-13 text-[16px] tracking-[0.06em] capitalize font-medium">

{/* Render dinámico de links del navbar */}
{(Object.keys(menuData) as (keyof typeof menuData)[]).map((item) => {
  const href = item === "Tienda" ? "/tienda" : "/academia"

  return (
    <Link
      key={item}
      href={href}
      onMouseEnter={() => setActiveMenu(item)}
      onFocus={() => setActiveMenu(item)}
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
  onMouseEnter={() => setActiveMenu(null)}
  onFocus={() => setActiveMenu(null)}
  className="relative group text-[16px] tracking-[0.05em] text-[var(--foreground)]"
>
  <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
    Citas
  </span>
  <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full"></span>
</Link>


{/* MegaMenu Component */}
<MegaMenu activeMenu={activeMenu} currentMenu={currentMenu} />

<DropdownContainer activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
  <DropdownContainer.Panel menu="search">
    {({ isOpen }) => <SearchMenu isOpen={isOpen} />}
  </DropdownContainer.Panel>
</DropdownContainer>
</nav>

</div>



{/* =========================================
   CENTER
   BRAND LOGO
   ========================================= */}

<Link
  href="/"
  className="flex flex-col items-center font-serif leading-tight w-fit mx-auto text-inherit no-underline hover:opacity-90 transition-opacity"
  aria-label="Ir al inicio"
>
<div className="self-start text-[20px] md:text-[34px] tracking-[0.10em] md:tracking-[0.12em]">
  Liz Cabriales
</div>

<div className="self-end text-[9px] md:text-[14px] tracking-[0.30em] uppercase text-[#C6A75E]">
  STUDIO
</div>

</Link>



{/* =========================================
   RIGHT SIDE
   NAVBAR ICONS
   ========================================= */}

<div className="flex items-center justify-end gap-3 md:gap-10">


{/* SEARCH ICON */}

<button
  type="button"
  className="group inline-flex items-center text-[16px] tracking-[0.05em] text-[var(--foreground)] transition-colors hover:text-[#C6A75E]"
  onClick={() => {
    setMobileNavOpen(false)
    setActiveMenu(activeMenu === "search" ? null : "search")
  }}
  aria-label="Buscar"
>
  <Search className="w-5 h-5 md:w-7 md:h-7 shrink-0" />
  <span className="hidden md:grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr] group-hover:ml-2">
    <span className="overflow-hidden whitespace-nowrap">Buscar</span>
  </span>
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
activeMenu || isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
}`}
onMouseEnter={() => {
  if (isProgrammatic()) {
    clearProgrammatic()
    return
  }
  closeCart()
  setActiveMenu(null)
}}
></div>



</>

)

}