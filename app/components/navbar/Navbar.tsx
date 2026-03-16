"use client"

/* =========================================
   IMPORTS ESTA MAMADA CONTROLA MENUS 
   ========================================= */

import Link from "next/link"
import { Search, Heart, User, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"
import { menuData } from "./menuData"
import MegaMenu from "./dropdowns/MegaMenu"
import SearchMenu from "./dropdowns/SearchMenu"
import CartMenu from "./dropdowns/CartMenu"
import DropdownContainer from "./dropdowns/DropdownContainer"

/* =========================================
   TYPES
   ========================================= */

   export type MenuType =
   | "Tienda"
   | "Cursos"
   | "Servicios"
   | "search"
   | "cart"
   | "user"
   | "favorites"
   | null

export default function Navbar() {


/* =========================================
   STATE (Menu Controller)
   ========================================= */

  // Controlador central de todos los menús del navbar.
  // Solo un menú puede estar activo a la vez.
  // Ejemplos de valores:
  // "Tienda", "Cursos", "Servicios", "search", "cart", etc.

  const [activeMenu, setActiveMenu] = useState<MenuType>(null)

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
      }
    }

    document.addEventListener("mouseleave", handleMouseLeavePage)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeavePage)
    }
  }, [])



/* =========================================
   RENDER
   ========================================= */

return (

<>


{/* =========================================
   HEADER
   ========================================= */}

<header className="w-full sticky top-0 bg-white z-50 px-6">

<div className="max-w-[1400px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center py-4.5">  


{/* =========================================
   LEFT SIDE
   NAVIGATION LINKS
   ========================================= */}

<div className="flex items-center gap-8 justify-start">

<nav className="hidden md:flex gap-13 text-[16px] tracking-[0.06em] capitalize font-medium">

{/* Render dinámico de links del navbar */}
{(Object.keys(menuData) as (keyof typeof menuData)[]).map((item)=>(
<div
 key={item}
 onMouseEnter={()=>setActiveMenu(item)}
>

<button className="relative group text-[13px] tracking-[0.05em] text-[var(--foreground)] cursor-pointer bg-transparent border-none">

<span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
{item}
</span>

<span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full"></span>

</button>

</div>

))}


{/* MegaMenu Component */}
<MegaMenu activeMenu={activeMenu} currentMenu={currentMenu} />

<DropdownContainer activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
  <DropdownContainer.Panel menu="search">
    {({ isOpen }) => <SearchMenu isOpen={isOpen} />}
  </DropdownContainer.Panel>

  <DropdownContainer.Panel menu="cart">
    {({ isOpen, close }) => <CartMenu isOpen={isOpen} close={close} />}
  </DropdownContainer.Panel>
</DropdownContainer>
</nav>

</div>



{/* =========================================
   CENTER
   BRAND LOGO
   ========================================= */}

<div className="flex flex-col items-center font-serif leading-tight w-fit mx-auto">

<div className="self-start text-[28px] tracking-[0.12em]">
  Liz Cabriales
</div>

<div className="self-end text-[12px] tracking-[0.30em] uppercase text-[#C6A75E]">
  STUDIO
</div>

</div>



{/* =========================================
   RIGHT SIDE
   NAVBAR ICONS
   ========================================= */}

<div className="flex items-center justify-end gap-10">


{/* SEARCH ICON */}

<div className="relative flex items-center">

<Search
className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors"
onClick={() =>
setActiveMenu(activeMenu === "search" ? null : "search")
}
/>

</div>



{/* USER ICON */}

<Link href="/login" className="inline-flex">
  <User className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors" />
</Link>



{/* FAVORITES ICON */}

<Heart className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors" />



{/* CART ICON */}

<div
className="relative cursor-pointer"
onClick={() =>
setActiveMenu(activeMenu === "cart" ? null : "cart")
}
>

<ShoppingBag className="w-5 h-5 hover:text-[#C6A75E] transition-colors" />

<span className="absolute -top-2 -right-2 bg-[#C6A75E] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
0
</span>

</div>


</div>

</div>

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
className={`fixed inset-0 top-[60px] backdrop-blur-md bg-black/10 z-30 transition-opacity duration-300 ${
activeMenu ? "opacity-100" : "opacity-0 pointer-events-none"
}`}
onMouseEnter={() => setActiveMenu(null)}
></div>



</>

)

}