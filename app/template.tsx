"use client"

/* template.tsx (a diferencia de layout.tsx) se re-monta en cada navegación,
   así que su animación de entrada corre en cada cambio de ruta. Envuelve solo
   el contenido de la página; el #site-footer-stage fixed vive fuera de este
   wrapper (SiteCurtainLayout), por lo que la animación no lo afecta.

   La clase .lc-page-enter (globals.css) hace un fade + subida de 6px y se
   auto-limpia al terminar para no dejar un containing block que rompa sticky. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="lc-page-enter flex flex-1 flex-col">{children}</div>
}
