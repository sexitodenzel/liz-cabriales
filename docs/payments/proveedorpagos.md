# payments/proveedorpagos.md

## Decisión — 16 marzo 2026

**Proveedor elegido: MercadoPago**

---

## Por qué MercadoPago

- Acepta OXXO, SPEI (transferencia), tarjetas de débito y crédito mexicanas
- 6 meses sin intereses nativo con bancos mexicanos
- Depósito directo a cuenta bancaria mexicana en MXN sin fricciones
- El público objetivo (mujeres en México) ya lo conoce y usa
- Documentación en español, amplia comunidad en México
- No interfiere con el sistema de facturación de la contadora de Liz — son sistemas separados

---

## Comisiones (las paga Liz, no el equipo de desarrollo)

- ~3.49% + IVA por transacción con tarjeta
- En una venta de $1,000 MXN, Liz recibe ~$965 MXN
- 6 meses sin intereses: comisión mayor, varía según plazo
- SPEI/transferencia: comisión menor
- MercadoPago descuenta la comisión automáticamente antes de depositar

---

## Qué cubre la integración

- Ecommerce — pago al finalizar compra
- Cursos — pago al inscribirse (tipo apartado/reserva de lugar)
- Citas — pago adelantado al reservar

---

## Política de pagos confirmada (reunión 16 marzo)

### Productos
- No existen reembolsos — no sale dinero bajo ninguna circunstancia
- Cambio por otro producto: solo si menos de 3 días y producto sin usar
- Productos usados: sin cambio ni devolución

### Cursos
- Pago confirma el lugar
- Sin reembolsos — el dinero no regresa
- Si el cliente no puede asistir, se evalúa caso por caso pero no hay garantía de devolución

### Citas
- Pago adelantado obligatorio al reservar
- Sin reembolsos por cancelación

---

## Facturación (CFDI)

- La mayoría de clientes no factura
- Clientes que solicitan CFDI: opción en checkout (checkbox opcional)
- Se captura RFC + razón social al momento de la compra
- Se aplica % adicional sobre el total — porcentaje exacto definido por la contadora de Liz
- El CFDI lo emite la contadora — el sistema solo registra la solicitud y el % aplicado
- Esto es legal y común en México

---

## Implementación técnica

- No implementar hasta confirmar que Liz tiene cuenta MercadoPago activa
- Usar SDK oficial de MercadoPago para Node.js
- Webhooks para confirmar pagos de forma asíncrona
- La elección afecta: `tech/api.md` y `commerce/order-flow.md`
- Variables de entorno: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` — nunca en el código

---

## Pendientes

- [ ] Confirmar que Liz tiene cuenta MercadoPago activa o crearla
- [ ] Obtener Access Token y Public Key de su cuenta
- [ ] Confirmar % exacto del cargo por facturación con su contadora
- [ ] Confirmar si quieren OXXO como método o solo tarjeta/SPEI