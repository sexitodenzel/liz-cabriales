export type OrderInfoProps = {
  hasCourseToday?: boolean
  courseSlot?: { start_time: string; end_time: string } | null
}

export default function OrderInfo({ hasCourseToday, courseSlot }: OrderInfoProps) {
  const pickupHours = hasCourseToday && courseSlot
    ? `Solo ${courseSlot.start_time.slice(0, 5)}–${courseSlot.end_time.slice(0, 5)} (día de curso)`
    : "Lu–Sá 10:00–19:00 · Dom 10:00–14:00 (días de curso)"

  return (
    <div className="space-y-8 text-sm leading-7 text-neutral-700">
      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          ¿Cuáles son los plazos de entrega?
        </h4>
        <p className="mt-3">
          Hacemos envíos a toda la República Mexicana con{" "}
          <span className="font-medium text-[#0a0a0a]">Estafeta</span> y{" "}
          <span className="font-medium text-[#0a0a0a]">DHL</span>. El costo del envío
          se calcula al momento del checkout según el destino y el peso del pedido.
          Te enviamos el link de pago por correo y WhatsApp una vez confirmada la
          orden.
        </p>
        <p className="mt-2">
          El tiempo de entrega estándar es de 2 a 5 días hábiles tras el pago. Los
          tiempos pueden variar por temporada alta o por restricciones de la
          paquetería en tu zona.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          Recoger en tienda
        </h4>
        <p className="mt-3">
          <span className="font-medium text-[#0a0a0a]">{pickupHours}</span> · Nayarit
          #204-B, Cd. Madero, Tamaulipas. Una vez listo tu pedido, te avisamos por
          WhatsApp para que pases a recogerlo.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          Envío a domicilio local
        </h4>
        <p className="mt-3">
          Si estás en{" "}
          <span className="font-medium text-[#0a0a0a]">
            Tampico, Cd. Madero o Altamira
          </span>
          , llevamos tu pedido a domicilio con repartidor. Te compartimos su número
          por WhatsApp y el costo del envío lo pagas directamente al repartidor al
          recibir tu pedido.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          ¿Cómo puedo solicitar un cambio o devolución?
        </h4>
        <p className="mt-3">
          Aceptamos cambios y devoluciones dentro de los 5 días hábiles posteriores a
          la recepción del producto, siempre que el artículo esté sin uso, en su
          empaque original y con su comprobante de compra. Por higiene no aplican
          cambios en esmaltes y productos abiertos.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          Opciones de pago
        </h4>
        <ul className="mt-3 space-y-1.5">
          <li className="flex gap-2">
            <span className="text-[#a8862f]">•</span>
            <span>Tarjeta de crédito y débito (Visa, MasterCard, American Express)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#a8862f]">•</span>
            <span>Transferencia / SPEI</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#a8862f]">•</span>
            <span>Pago en tienda al recoger</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Pago seguro. La información se procesa a través de pasarelas con cifrado
          SSL.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
          ¿Necesitas asesoría?
        </h4>
        <p className="mt-3">
          Escríbenos por WhatsApp y con gusto te ayudamos a elegir el producto
          correcto para tu técnica o tu nivel.
        </p>
      </section>
    </div>
  )
}
