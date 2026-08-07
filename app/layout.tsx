/* =========================
   IMPORTACIONES GLOBALES
   ========================= */

import "./globals.css";
import { Suspense } from "react";
import { headers } from "next/headers";
import { CartProvider } from "./components/cart/CartContext";
import { WishlistProvider } from "./components/wishlist/WishlistContext";
import { NailArtFavoritesProvider } from "./components/wishlist/NailArtFavoritesContext";
import SiteNavbar from "./components/SiteNavbar";
import SiteNavbarAuth from "./components/SiteNavbarAuth";
import SiteCurtainLayout from "./components/footer/SiteCurtainLayout";
import AnnouncementBar from "./components/AnnouncementBar";
import SiteChromeMetrics from "./components/SiteChromeMetrics";
import { Analytics } from "@vercel/analytics/next";

/* =========================
   IMPORTACIÓN DE FUENTES
   (Puedes cambiar aquí las tipografías después)
   ========================= */

import { Inter_Tight } from "next/font/google";
import type { Viewport } from "next";

/* Nunca bloquear el zoom (maximumScale/userScalable): WCAG 1.4.4 —
   usuarios con baja visión dependen del pellizco para leer. */
export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1,
};

/* =========================
   CONFIGURACIÓN DE FUENTES
   ========================= */

/* OPI usa UNA sola grotesca para todo (Sharp Grotesk). Réplica gratuita:
   Inter Tight — misma sensación editorial, con peso 300 real para display. */
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter-tight",
});

/* =========================
   LAYOUT PRINCIPAL
   (NO TOCAR estructura base)
   ========================= */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Overlay home desde el HTML del servidor (proxy → x-lc-pathname):
  // evita el flash ivory al refrescar /.
  const pathname = (await headers()).get("x-lc-pathname") ?? ""
  const homeOverlay = pathname === "/"
  // El panel /admin tiene su propio sidebar: no debe llevar el chrome público
  // (barra de anuncios + navbar con auto-hide). Sin esto, el navbar público se
  // colapsa al scrollear y "arrastra" visualmente el panel.
  const isAdmin = pathname.startsWith("/admin")
  const htmlClass = homeOverlay
    ? "lc-nav-guard-free lc-home-overlay"
    : "lc-nav-guard-free"

  return (
    /* lc-nav-guard-free de inicio: el escudo ::before de las barras
       [data-nav-collapse-guard] (globals.css) queda apagado hasta que
       Navbar.tsx mida si la barra está pegada al navbar — así no tapa
       breadcrumbs/hero antes de hidratar. */
    <html lang="es" className={htmlClass} suppressHydrationWarning>
      <head>
        {/* Cinturón de seguridad: si el HTML llega sin la clase (prefetch,
            scroll restaurado, etc.), marcar antes de pintar el body. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname!=="/"){document.documentElement.classList.remove("lc-home-overlay");return}var max=Math.round(window.innerHeight*0.22)+120;if(window.scrollY<=max)document.documentElement.classList.add("lc-home-overlay")}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${interTight.className} ${interTight.variable} flex min-h-screen flex-col`}
      >
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        <CartProvider>
          <WishlistProvider>
            <NailArtFavoritesProvider>
            {!isAdmin && (
              <>
                <SiteChromeMetrics />
                {/* La barra de anuncios se inyecta DENTRO del header sticky
                    (Navbar.tsx): es la única pieza del chrome que se comprime
                    al scrollear. Comparte el Suspense de auth para que el
                    chrome entre de una sola pieza y no en dos saltos. */}
                <Suspense fallback={<SiteNavbar />}>
                  <SiteNavbarAuth announcement={<AnnouncementBar />} />
                </Suspense>
              </>
            )}
            <SiteCurtainLayout>{children}</SiteCurtainLayout>
            </NailArtFavoritesProvider>
          </WishlistProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
