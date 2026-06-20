import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumb from "@/components/shared/Breadcrumb"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Liz Cabriales Studio",
  description: "Términos y condiciones de uso de Academia Liz Cabriales Studio.",
}

export default function TerminosYCondicionesPage() {
  return (
    <main className="min-h-screen bg-white site-container pt-5 pb-24 text-[#111]">
      <div className="mx-auto max-w-3xl">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Términos y condiciones" }]} />
        <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,4vw,44px)] font-medium leading-tight tracking-[-0.02em]">
          Términos y Condiciones
        </h1>
        <p className="mt-3 text-sm text-[#8a8a8a]">Última actualización: junio 2025</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-[#444]">
          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar el sitio web y los servicios de Academia Liz Cabriales Studio,
              usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo
              con alguno de ellos, le pedimos que no utilice nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              2. Productos y servicios
            </h2>
            <p>
              Todos los productos y cursos publicados en nuestro sitio están sujetos a disponibilidad.
              Nos reservamos el derecho de modificar precios, descripciones y disponibilidad sin
              previo aviso. Las imágenes de los productos son de carácter ilustrativo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              3. Pedidos y pagos
            </h2>
            <p>
              Al realizar un pedido, usted garantiza que la información proporcionada es veraz y
              completa. El pago deberá realizarse en su totalidad al momento de la compra. Nos
              reservamos el derecho de cancelar pedidos que presenten irregularidades o información
              incorrecta.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              4. Envíos
            </h2>
            <p>
              Los tiempos de entrega son estimados y pueden variar según la ubicación y la
              disponibilidad del servicio de paquetería. No nos hacemos responsables por demoras
              ocasionadas por la empresa de mensajería o situaciones de fuerza mayor. El costo de
              envío se calcula al momento del checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              5. Devoluciones y cambios
            </h2>
            <p>
              Aceptamos devoluciones dentro de los 7 días naturales posteriores a la recepción del
              producto, siempre que éste se encuentre en su estado original, sin uso y en su
              empaque original. Los productos de consumo (pigmentos, acrílicos, geles) no son
              elegibles para devolución una vez abiertos por razones de higiene.
            </p>
            <p className="mt-2">
              Para iniciar una devolución, contáctenos a{" "}
              <a
                href="mailto:academializcabriales@gmail.com"
                className="text-[#a8862f] underline underline-offset-2"
              >
                academializcabriales@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              6. Cursos y talleres
            </h2>
            <p>
              Las inscripciones a cursos son personales e intransferibles. En caso de no poder
              asistir, el alumno deberá notificarlo con al menos 48 horas de anticipación para
              reagendar sin costo. No se realizan reembolsos por inasistencias no notificadas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              7. Propiedad intelectual
            </h2>
            <p>
              Todo el contenido del sitio (imágenes, textos, logotipos, diseños) es propiedad de
              Academia Liz Cabriales Studio y está protegido por las leyes de propiedad intelectual.
              Queda prohibida su reproducción sin autorización previa y por escrito.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              8. Limitación de responsabilidad
            </h2>
            <p>
              Academia Liz Cabriales Studio no será responsable por daños directos, indirectos,
              incidentales o consecuentes derivados del uso o imposibilidad de uso de nuestros
              productos o servicios.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#111]">
              9. Contacto
            </h2>
            <p>
              Si tiene alguna duda sobre estos términos, puede contactarnos en{" "}
              <a
                href="mailto:academializcabriales@gmail.com"
                className="text-[#a8862f] underline underline-offset-2"
              >
                academializcabriales@gmail.com
              </a>{" "}
              o por WhatsApp al{" "}
              <a
                href="https://wa.me/528332183399"
                target="_blank"
                className="text-[#a8862f] underline underline-offset-2"
              >
                833 218 3399
              </a>
              .
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
            href="/aviso-de-privacidad"
            className="inline-flex items-center justify-center bg-[#111] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
          >
            Aviso de privacidad
          </Link>
        </div>
      </div>
    </main>
  )
}
