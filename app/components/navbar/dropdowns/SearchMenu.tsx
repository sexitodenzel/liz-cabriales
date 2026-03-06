"use client"

/* =========================================
   SEARCH MENU
   ========================================= */

import { Search } from "lucide-react"
import { useEffect } from "react"
import type { MenuType } from "../Navbar"

type SearchMenuProps = {
    activeMenu: MenuType
    setActiveMenu: React.Dispatch<React.SetStateAction<MenuType>>
  }

export default function SearchMenu({ activeMenu, setActiveMenu }: SearchMenuProps) {

  const isOpen = activeMenu === "search"

  /* =========================================
     ESC KEY CLOSE
     ========================================= */

  useEffect(() => {

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveMenu(null)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }

  }, [setActiveMenu])


  return (

    <div
      className={`
      absolute left-0 top-full w-full z-40 bg-white
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >

<div className="max-w-[1400px] mx-auto px-6 pt-2 pb-10">
<div className="max-w-[650px] ml-[2px] pt-2">
          {/* SEARCH INPUT */}

          <div
  className={`
  flex items-center gap-2
  transition-all duration-500 ease-out
  ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
  `}
>

            <Search className="w-5 h-5 text-gray-400"/>

            <input
  type="text"
  placeholder="Buscar productos..."
  className="w-full outline-none text-base bg-transparent placeholder-gray-500"
/>

          </div>


          {/* QUICK LINKS */}

          <div
            className={`
            mt-9 transition-all duration-500 delay-150 ease-out
            ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >

            <p className="text-gray-400 text-sm mb-6">
              Popular
            </p>

            <ul className="space-y-4 text-[16px]">

            <li className="flex items-center gap-3 text-gray-700 cursor-pointer hover:text-[#C6A75E] transition-colors duration-200">
  <span>→</span>
  Builder Gel
</li>

<li className="flex items-center gap-3 text-gray-700 cursor-pointer hover:text-[#C6A75E] transition-colors duration-200">
  <span>→</span>
  Kit profesional
</li>

<li className="flex items-center gap-3 text-gray-700 cursor-pointer hover:text-[#C6A75E] transition-colors duration-200">
  <span>→</span>
  Curso básico
</li>

            </ul>

          </div>

        </div>

      </div>

    </div>

  )

}