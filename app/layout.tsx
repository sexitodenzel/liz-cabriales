/* =========================
   IMPORTACIONES GLOBALES
   ========================= */

import "./globals.css";
import { CartProvider } from "./components/cart/CartContext";
import Navbar from "./components/navbar/Navbar";
import { createClient } from "@/lib/supabase/server";

/* =========================
   IMPORTACIÓN DE FUENTES
   (Puedes cambiar aquí las tipografías después)
   ========================= */

import { Playfair_Display, Inter, Parisienne, Outfit } from "next/font/google";

/* =========================
   CONFIGURACIÓN DE FUENTES
   ========================= */

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
      <body className={inter.className}>
        <CartProvider>
          <Navbar isLoggedIn={Boolean(user)} />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}