/* =========================
   IMPORTACIONES GLOBALES
   ========================= */

import "./globals.css";
import { Suspense } from "react";
import { CartProvider } from "./components/cart/CartContext";
import { WishlistProvider } from "./components/wishlist/WishlistContext";
import SiteNavbar from "./components/SiteNavbar";
import SiteNavbarAuth from "./components/SiteNavbarAuth";
import SiteCurtainLayout from "./components/footer/SiteCurtainLayout";
import AnnouncementBar from "./components/AnnouncementBar";
import SiteChromeMetrics from "./components/SiteChromeMetrics";

/* =========================
   IMPORTACIÓN DE FUENTES
   (Puedes cambiar aquí las tipografías después)
   ========================= */

import {
  Playfair_Display,
  Inter,
  Parisienne,
  Outfit,
  Cormorant_Garamond,
} from "next/font/google";
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

const inter = Inter({
  subsets: ["latin"],
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-cormorant-garamond",
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
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${outfit.className} ${cormorantGaramond.variable} ${playfairDisplay.variable} flex min-h-screen flex-col`}
      >
        <CartProvider>
          <WishlistProvider>
            <SiteChromeMetrics />
            <Suspense fallback={null}>
              <AnnouncementBar />
            </Suspense>
            <Suspense fallback={<SiteNavbar />}>
              <SiteNavbarAuth />
            </Suspense>
            <SiteCurtainLayout>{children}</SiteCurtainLayout>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}