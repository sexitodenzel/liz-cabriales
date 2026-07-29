/* =========================
   IMPORTACIONES GLOBALES
   ========================= */

import "./globals.css";
import { Suspense } from "react";
import { CartProvider } from "./components/cart/CartContext";
import { WishlistProvider } from "./components/wishlist/WishlistContext";
import { NailArtFavoritesProvider } from "./components/wishlist/NailArtFavoritesContext";
import SiteNavbar from "./components/SiteNavbar";
import SiteCurtainLayout from "./components/footer/SiteCurtainLayout";
import AnnouncementBar from "./components/AnnouncementBar";
import SiteChromeMetrics from "./components/SiteChromeMetrics";

/* =========================
   IMPORTACIÓN DE FUENTES
   (Puedes cambiar aquí las tipografías después)
   ========================= */

import { Playfair_Display, Outfit } from "next/font/google";
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

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

/* =========================
   LAYOUT PRINCIPAL
   (NO TOCAR estructura base)
   ========================= */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La clase lc-home-overlay la aplica el script inline de <head> antes de
  // pintar (según location.pathname + scrollY), así que el layout ya NO lee
  // headers(). Leer headers() aquí opta a TODA la app a render dinámico
  // (no-store) y anula el cache ISR de las páginas; sin él, home/tienda/blog
  // se sirven cacheadas y cargan mucho más rápido.
  const htmlClass = "lc-nav-guard-free"

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
        className={`${outfit.className} ${playfairDisplay.variable} flex min-h-screen flex-col`}
      >
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        <CartProvider>
          <WishlistProvider>
            <NailArtFavoritesProvider>
            <SiteChromeMetrics />
            <Suspense fallback={null}>
              <AnnouncementBar />
            </Suspense>
            <SiteNavbar />
            <SiteCurtainLayout>{children}</SiteCurtainLayout>
            </NailArtFavoritesProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
