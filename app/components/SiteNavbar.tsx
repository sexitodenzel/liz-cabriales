import Navbar from "./navbar/Navbar"

type SiteNavbarProps = {
  isLoggedIn?: boolean
}

export default function SiteNavbar({ isLoggedIn = false }: SiteNavbarProps) {
  return <Navbar isLoggedIn={isLoggedIn} />
}
