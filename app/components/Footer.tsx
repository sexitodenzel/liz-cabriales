import Link from "next/link"
import { Instagram, MessageCircle, Facebook } from "lucide-react"

const linkClass =
  "text-neutral-300 transition-colors hover:text-[#C6A75E]"

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-neutral-300">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="text-center md:text-left">
            <div className="mx-auto flex w-fit flex-col font-serif leading-none md:mx-0">
              <div className="self-start text-[24px] tracking-[0.12em] text-white">
                Liz Cabriales
              </div>
              <div className="self-end text-[11px] tracking-[0.30em] uppercase text-[#C6A75E]">
                STUDIO
              </div>
            </div>
            <p className="mt-5 text-sm text-neutral-400">
              Academia y distribuidora profesional de productos para uñas.
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Tampico, Tamaulipas, México.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#C6A75E]">Explorar</h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/tienda" className={linkClass}>
                Tienda
              </Link>
              <Link href="/academia" className={linkClass}>
                Academia
              </Link>
              <Link href="/citas" className={linkClass}>
                Servicios
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#C6A75E]">Contacto</h3>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                WhatsApp:{" "}
                <Link
                  href="https://wa.me/528332183399"
                  target="_blank"
                  className={linkClass}
                >
                  833 218 3399
                </Link>
              </p>
              <p>
                Instagram:{" "}
                <Link
                  href="https://instagram.com/liz_cabriales"
                  target="_blank"
                  className={linkClass}
                >
                  @liz_cabriales
                </Link>
              </p>
              <p>
                Facebook:{" "}
                <Link
                  href="https://www.facebook.com/profile.php?id=100008326095757"
                  target="_blank"
                  className={linkClass}
                >
                  Liz Cabriales
                </Link>
              </p>
              <p className="pt-2 text-neutral-400">
                Lunes a Sábado · Tampico, Tamaulipas
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-neutral-500 md:flex-row">
            <p>
              © 2025 Academia Liz Cabriales. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://instagram.com/liz_cabriales"
                target="_blank"
                className="text-neutral-400 transition-colors hover:text-[#C6A75E]"
                aria-label="Instagram de Liz Cabriales"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://wa.me/528332183399"
                target="_blank"
                className="text-neutral-400 transition-colors hover:text-[#C6A75E]"
                aria-label="WhatsApp de Liz Cabriales"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=100008326095757"
                target="_blank"
                className="text-neutral-400 transition-colors hover:text-[#C6A75E]"
                aria-label="Facebook de Liz Cabriales"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
