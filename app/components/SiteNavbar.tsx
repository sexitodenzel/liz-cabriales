import type { ReactNode } from "react"

import Navbar from "./navbar/Navbar"

type SiteNavbarProps = {
  isLoggedIn?: boolean
  /** Barra de anuncios: vive DENTRO del header sticky (es lo que se comprime). */
  announcement?: ReactNode
}

export default function SiteNavbar({
  isLoggedIn = false,
  announcement = null,
}: SiteNavbarProps) {
  return <Navbar isLoggedIn={isLoggedIn} announcement={announcement} />
}
