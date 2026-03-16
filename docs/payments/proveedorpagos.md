
## Contexto previo

El sitio necesita procesar pagos online para los tres pilares del negocio: productos (ecommerce), cursos (inscripción tipo concierto) y citas (reserva de servicios). El flujo de pagos reemplaza la gestión anterior por WhatsApp y comprobantes manuales.

El negocio opera en México y su mercado principal es nacional. Esto hace que los proveedores más relevantes sean aquellos con soporte nativo para MXN y métodos de pago locales (tarjeta, OXXO, transferencia SPEI).

No se ha definido aún el proveedor. Las opciones en consideración son:

- **MercadoPago** — más usado en ecommerce mexicano, acepta tarjeta, OXXO y SPEI, integración relativamente simple con Next.js/Node.
- **Stripe** — documentación excelente, muy usado globalmente, soporte para MXN, pero OXXO y SPEI requieren configuración adicional.
- **Openpay (de BBVA)** — solución local, menos documentación y comunidad.
- **PayPal** — poco relevante para el público objetivo (México, género femenino, compras locales).

Política de pagos conocida: sin devoluciones en citas. Para cursos y productos aún no se ha definido.

---

## To-do (pendiente confirmar con Liz)

- [ ] ¿Qué proveedor de pagos prefiere o ya usa en otro canal?
- [ ] ¿Necesita aceptar pagos en OXXO o solo tarjeta/transferencia?
- [ ] ¿Tiene cuenta de MercadoPago o Stripe activa?
- [ ] ¿Quiere facturación electrónica (CFDI) para sus clientes?
- [ ] ¿Maneja meses sin intereses?
- [ ] ¿Política de reembolso para productos y cursos?

---

## Preguntas para la reunión con Liz

1. ¿Ya usas algún sistema de cobro digital actualmente (MercadoPago, transferencia, otro)?
2. ¿Tus clientes te piden pagar en OXXO o principalmente usan tarjeta y transferencia?
3. ¿Necesitas emitir facturas (CFDI) para tus clientes?
4. ¿Te interesa ofrecer meses sin intereses?
5. Para productos enviados, si llega dañado o equivocado, ¿aceptas devolución o cambio?
6. Para cursos, si alguien no puede asistir, ¿el pago es definitivo o hay condiciones de reembolso?

---

## Decisión pendiente

La elección del proveedor de pagos afecta directamente la arquitectura del backend y los webhooks. No se puede avanzar en `tech/api.md` ni en `commerce/order-flow.md` sin tener esto definido. **Resolver en reunión del lunes.**

### Recomendación preliminar

MercadoPago es la opción más pragmática para este negocio: mercado mexicano, OXXO nativo, amplia documentación en español, y muy familiar para el público objetivo. Si Liz ya tiene cuenta activa, reduce tiempo de integración significativamente.
