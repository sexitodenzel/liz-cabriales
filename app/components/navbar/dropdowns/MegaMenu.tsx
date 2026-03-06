"use client"

/* =========================================
   UI DEL MEGA MENU 
   ========================================= */
   
type MenuColumn = {
  title: string
  items: string[]
}

type MegaMenuProps = {
  activeMenu: string | null
  currentMenu: {
    col1: MenuColumn
    col2: MenuColumn
    col3: MenuColumn
  } | null
}

export default function MegaMenu({ activeMenu, currentMenu }: MegaMenuProps) {
  return (
    <div
      className={`
      absolute left-0 top-full w-full z-40
      bg-white
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${
        activeMenu
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }
    `}
    >
      <div
        key={activeMenu}
        className="max-w-[1400px] mx-auto px-6 py-14 grid grid-cols-3 gap-20 transition-all duration-300 ease-out"
      >
        {/* COLUMN 1 */}
        <div
          className={`transition-all duration-500 ease-out ${
            activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-gray-400 text-sm mb-6">{currentMenu?.col1.title}</p>

          <ul className="space-y-3 text-[18px]">
            {currentMenu?.col1?.items?.map((item) => (
              <li key={item} className="hover:text-[#C6A75E] cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 2 */}
        <div
          className={`transition-all duration-500 delay-150 ease-out ${
            activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-gray-400 text-sm mb-6">{currentMenu?.col2.title}</p>

          <ul className="space-y-3 text-[18px]">
            {currentMenu?.col2?.items?.map((item) => (
              <li key={item} className="hover:text-[#C6A75E] cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 3 */}
        <div
          className={`transition-all duration-500 delay-300 ease-out ${
            activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-gray-400 text-sm mb-6">{currentMenu?.col3.title}</p>

          <ul className="space-y-3 text-[18px]">
            {currentMenu?.col3?.items?.map((item) => (
              <li key={item} className="hover:text-[#C6A75E] cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}