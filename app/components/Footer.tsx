import Link from "next/link"
import { Instagram, MessageCircle } from "lucide-react"

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-black text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex flex-col font-serif leading-tight">
              <div className="self-start text-[24px] tracking-[0.12em]">
                Liz Cabriales
              </div>
              <div className="self-end text-[11px] tracking-[0.30em] uppercase text-brand-gold">
                STUDIO
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-300">
              Academia y distribuidora profesional de productos para uñas.
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              Tampico, Tamaulipas, México.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explorar</h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-neutral-300">
              <Link
                href="/tienda"
                className="transition-colors hover:text-brand-gold"
              >
                Tienda
              </Link>
              <Link
                href="/cursos"
                className="transition-colors hover:text-brand-gold"
              >
                Cursos
              </Link>
              <Link
                href="/servicios"
                className="transition-colors hover:text-brand-gold"
              >
                Servicios
              </Link>
              <Link
                href="/inspiracion"
                className="transition-colors hover:text-brand-gold"
              >
                Inspiración
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Contacto</h3>
            <div className="mt-4 space-y-1 text-sm text-neutral-300">
              <p>
                WhatsApp:{" "}
                <Link
                  href="https://wa.me/528332183399"
                  target="_blank"
                  className="text-brand-gold hover:text-white"
                >
                  833 218 3399
                </Link>
              </p>
              <p>
                Instagram:{" "}
                <Link
                  href="https://instagram.com/liz_cabriales"
                  target="_blank"
                  className="text-brand-gold hover:text-white"
                >
                  @liz_cabriales
                </Link>
              </p>
              <p>
                Facebook:{" "}
                <Link
                  href="https://facebook.com/lizcabriales"
                  target="_blank"
                  className="text-brand-gold hover:text-white"
                >
                  Liz Cabriales
                </Link>
              </p>
              <p className="pt-2">Lunes a Sábado · Tampico, Tamaulipas</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-neutral-400 md:flex-row">
            <p>
              © 2025 Academia Liz Cabriales. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://instagram.com/liz_cabriales"
                target="_blank"
                className="text-brand-gold transition-colors hover:text-white"
                aria-label="Instagram de Liz Cabriales"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://wa.me/528332183399"
                target="_blank"
                className="text-brand-gold transition-colors hover:text-white"
                aria-label="WhatsApp de Liz Cabriales"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

