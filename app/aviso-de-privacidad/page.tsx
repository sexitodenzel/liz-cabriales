import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumb from "@/components/shared/Breadcrumb"

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Liz Cabriales Studio",
  description: "Aviso de privacidad de Academia Liz Cabriales Studio.",
}

export default function AvisoDePrivacidadPage() {
  return (
    <main className="min-h-screen bg-white site-container pt-5 pb-24 text-[#111]">
      <div className="mx-auto max-w-3xl">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Aviso de privacidad" }]} />
        <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,4vw,44px)] font-medium leading-tight tracking-[-0.02em]">
          Aviso de Privacidad
        </h1>
        <p className="mt-3 text-sm text-[#8a8a8a]">Última actualización: junio 2025</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-[#444]">
          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              1. Responsable del tratamiento de datos
            </h2>
            <p>
              Academia Liz Cabriales Studio, con domicilio en Nayarit #204-B, C. Durango Esquina,
              Unidad Nacional, 89410 Cd Madero, Tamaulipas, México, es responsable del uso y
              protección de sus datos personales.
            </p>
            <p className="mt-2">
              Contacto:{" "}
              <a
                href="mailto:academializcabriales@gmail.com"
                className="text-[#a8862f] underline underline-offset-2"
              >
                academializcabriales@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              2. Datos personales que recabamos
            </h2>
            <p>Para las finalidades señaladas en este aviso, podemos recabar los siguientes datos:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de envío</li>
              <li>Datos de pago (procesados de forma segura por terceros)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              3. Finalidades del tratamiento
            </h2>
            <p>Sus datos personales serán utilizados para:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Procesar y gestionar sus pedidos y pagos</li>
              <li>Enviar confirmaciones y actualizaciones de sus órdenes</li>
              <li>Gestionar citas y reservaciones de servicios</li>
              <li>Inscripciones a cursos y talleres de la academia</li>
              <li>Atención al cliente y resolución de dudas</li>
              <li>Envío de información promocional (con su consentimiento)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              4. Transferencia de datos
            </h2>
            <p>
              No compartimos sus datos personales con terceros sin su consentimiento, salvo cuando
              sea necesario para cumplir con la prestación del servicio contratado (por ejemplo,
              empresas de mensajería para la entrega de pedidos) o cuando lo exija la ley.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              5. Derechos ARCO
            </h2>
            <p>
              Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus
              datos personales (derechos ARCO). Para ejercerlos, envíe su solicitud a{" "}
              <a
                href="mailto:academializcabriales@gmail.com"
                className="text-[#a8862f] underline underline-offset-2"
              >
                academializcabriales@gmail.com
              </a>{" "}
              indicando su nombre completo y el derecho que desea ejercer.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              6. Cambios al aviso de privacidad
            </h2>
            <p>
              Nos reservamos el derecho de modificar este aviso en cualquier momento. Los cambios
              serán publicados en esta página con la fecha de última actualización.
            </p>
          </section>
        </div>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#c9a84c] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8862f] transition-colors hover:bg-[#a8862f]/10"
          >
            Ir al inicio
          </Link>
          <Link
            href="/terminos-y-condiciones"
            className="inline-flex items-center justify-center bg-[#111] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
          >
            Términos y condiciones
          </Link>
        </div>
      </div>
    </main>
  )
}
