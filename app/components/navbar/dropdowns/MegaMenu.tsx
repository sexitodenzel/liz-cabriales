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
  const isOpen = Boolean(currentMenu)

  const columns: Array<{ delayMs: number; col: MenuColumn | undefined }> = [
    { delayMs: 0, col: currentMenu?.col1 },
    { delayMs: 150, col: currentMenu?.col2 },
    { delayMs: 300, col: currentMenu?.col3 },
  ]

  return (
    <div
      className={`
      absolute left-0 top-full w-full z-40
      bg-white
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }
    `}
    >
      <div
        key={activeMenu}
        className="max-w-[1400px] mx-auto px-6 py-14 grid grid-cols-3 gap-20 transition-all duration-300 ease-out"
      >
        {columns.map(({ delayMs, col }) => (
          <div
            key={delayMs}
            className={`transition-all duration-500 ease-out ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${delayMs}ms` }}
          >
            <p
              className={`text-gray-400 text-sm mb-6 transition-all duration-500 ease-out ${
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
              style={{ transitionDelay: `${delayMs}ms` }}
            >
              {col?.title}
            </p>

            <ul className="space-y-3 text-[18px]">
              {col?.items?.map((item, idx) => (
                <li
                  key={item}
                  className={`cursor-pointer transition-all duration-500 ease-out hover:text-[#C6A75E] ${
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                  style={{ transitionDelay: `${delayMs + 90 + idx * 45}ms` }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}