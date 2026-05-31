/* =========================
   IMPORTACIONES GLOBALES
   ========================= */

import "./globals.css";
import { CartProvider } from "./components/cart/CartContext";
import Navbar from "./components/navbar/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import { createClient } from "@/lib/supabase/server";

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
  weight: ["400", "500"],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es">
      <body
        className={`${inter.className} ${cormorantGaramond.variable} ${playfairDisplay.variable}`}
      >
        <CartProvider>
          <Navbar isLoggedIn={Boolean(user)} />
          {children}
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}