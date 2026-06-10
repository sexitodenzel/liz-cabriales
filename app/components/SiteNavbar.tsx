"use client"

import { usePathname } from "next/navigation"

import Navbar from "./navbar/Navbar"

type SiteNavbarProps = {
  isLoggedIn?: boolean
}

export default function SiteNavbar({ isLoggedIn = false }: SiteNavbarProps) {
  const pathname = usePathname()

  if (pathname.startsWith("/admin")) {
    return null
  }

  return <Navbar isLoggedIn={isLoggedIn} />
}
