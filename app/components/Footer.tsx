import Link from "next/link"
import Image from "next/image"
import { Instagram, MessageCircle, Facebook, Mail, MapPin, Clock } from "lucide-react"

const linkClass =
  "text-neutral-300 transition-colors hover:text-[#c9a84c]"

export default function Footer({ expanded = false }: { expanded?: boolean }) {
  return (
    <footer
      className={`flex flex-col justify-between bg-[#0a0a0a] text-neutral-300 ${
        expanded ? "min-h-[100dvh]" : ""
      }`}
    >
      {/* Wordmark de marca que rellena el espacio superior de la cortina */}
      {expanded && (
        <div className="site-container flex flex-1 flex-col justify-center overflow-hidden pt-24 md:pt-32">
          <span
            aria-hidden="true"
            className="block select-none font-[family-name:var(--font-playfair),serif] text-[clamp(3.5rem,15vw,13rem)] font-medium leading-[0.85] tracking-[-0.03em] text-white/[0.07]"
          >
            Liz Cabriales
          </span>
          <span
            aria-hidden="true"
            className="mt-3 select-none self-end pr-1 font-display text-[clamp(0.85rem,2.2vw,1.6rem)] uppercase tracking-[0.5em] text-white/[0.12]"
          >
            Studio
          </span>
        </div>
      )}

      <div className={`site-container pb-10 md:pb-12 ${expanded ? "" : "pt-10 md:pt-16"}`}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {/* Logo */}
          <div className="flex justify-center sm:justify-start lg:justify-start">
            <Link href="/" aria-label="Ir al inicio" className="inline-block transition-opacity hover:opacity-90">
              <Image
                src="/images/logo.png"
                alt="Liz Cabriales"
                width={140}
                height={140}
                className="mix-blend-screen object-contain md:w-[180px] md:h-[180px]"
              />
            </Link>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="text-sm font-semibold text-[#c9a84c]">Explorar</h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/tienda" className={linkClass}>Tienda</Link>
              <Link href="/academia" className={linkClass}>Academia</Link>
              <Link href="/servicios" className={linkClass}>Servicios</Link>
            </nav>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-semibold text-[#c9a84c]">Contacto</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link
                href="https://wa.me/528332183399"
                target="_blank"
                className="flex items-center gap-2 text-neutral-300 transition-colors hover:text-[#c9a84c]"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                833 218 3399
              </Link>
              <Link
                href="https://instagram.com/liz_cabriales"
                target="_blank"
                className="flex items-center gap-2 text-neutral-300 transition-colors hover:text-[#c9a84c]"
              >
                <Instagram className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                @liz_cabriales
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=100008326095757"
                target="_blank"
                className="flex items-center gap-2 text-neutral-300 transition-colors hover:text-[#c9a84c]"
              >
                <Facebook className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                Liz Cabriales
              </Link>
              <Link
                href="mailto:academializcabriales@gmail.com"
                className="flex items-center gap-2 text-neutral-300 transition-colors hover:text-[#c9a84c]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                academializcabriales@gmail.com
              </Link>
            </div>
          </div>

          {/* Ubicación y horarios */}
          <div>
            <h3 className="text-sm font-semibold text-[#c9a84c]">Visítanos</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-start gap-2 text-neutral-300">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                <span>Nayarit #204-B, C. Durango Esquina, Unidad Nacional, 89410 Cd Madero, Tamps.</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-300">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                <span>
                  Lunes a Sábado, 10:00 a.m. – 7:00 p.m.
                  <span className="mt-0.5 block">
                    Domingo, 10:00 a.m. – 2:00 p.m. (días de curso)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-neutral-400">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
            <Link href="/aviso-de-privacidad" className="transition-colors hover:text-[#c9a84c]">
              Aviso de privacidad
            </Link>
            <span className="hidden text-white/20 sm:inline">·</span>
            <Link href="/terminos-y-condiciones" className="transition-colors hover:text-[#c9a84c]">
              Términos y condiciones
            </Link>
          </div>
          <p className="mt-3 text-neutral-400">
            © {new Date().getFullYear()} Liz Cabriales Studio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
