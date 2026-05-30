# Pendiente: WhatsApp Business API (Meta Cloud API)

**Bloquea:** OTP de registro por teléfono, notificaciones de pago a Liz y al cliente, flujo de envío  
**Responsable:** Liz (Meta Business Manager) + Dev (env vars, plantillas, SQL)

---

## Contexto

El sistema usa WhatsApp Business API para:
- Enviar OTP al registrarse con número de teléfono.
- Notificar a Liz cuando llega un pedido nuevo.
- Notificar al cliente cuando su pedido es confirmado.
- Enviar link de cobro de envío (segundo pago por MercadoPago).
- Confirmar pago de envío a Liz.
- Avisar al cliente que su paquete fue enviado (con tracking).
- Avisar que el paquete fue entregado.

---

## Qué necesita hacer Liz

1. Tener (o crear) una **cuenta Meta Business Manager** activa.
2. Crear una **app en Meta for Developers** con el producto "WhatsApp".
3. Registrar y verificar un **número de teléfono de WhatsApp Business** (debe ser un número dedicado, no la cuenta personal de WhatsApp).
4. En Meta Business Manager → **Plantillas de mensajes**, crear y enviar a aprobación las 7 plantillas:

   | Nombre | Uso |
   |---|---|
   | `phone_verify_otp` | OTP de registro |
   | `admin_new_order` | Notificación a Liz: nuevo pedido |
   | `order_products_confirmed` | Notificación a cliente: pedido confirmado |
   | `shipping_payment_request` | Cobro de envío al cliente |
   | `shipping_paid_admin` | Notificación a Liz: envío pagado |
   | `order_shipped` | Cliente: pedido enviado (con tracking) |
   | `order_delivered` | Cliente: pedido entregado |

   > Las plantillas deben estar **aprobadas** por Meta antes del lanzamiento.

5. Obtener y compartir con el Dev de forma segura:
   - `WHATSAPP_ACCESS_TOKEN` — token de sistema permanente (no el temporal del dashboard).
   - `WHATSAPP_PHONE_NUMBER_ID` — ID del número registrado.
   - `WHATSAPP_BUSINESS_ACCOUNT_ID` — ID de la cuenta de negocio.
6. Confirmar el número de Liz para notificaciones admin en formato E.164 (ej. `5218331234567`).

---

## Qué hace el Dev

1. En **Vercel → Environment Variables**, agregar:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `ADMIN_WHATSAPP_PHONE` (número de Liz en E.164)
2. Ejecutar en Supabase el SQL pendiente:
   - `docs/delivery/sql-sprint-whatsapp.sql` (agrega campo teléfono en users, campos TUA en orders, tabla notification_log)
3. Hacer redeploy en Vercel.

---

## Prueba de aceptación

- [ ] Registro con número de teléfono → OTP llega por WhatsApp.
- [ ] Pago aprobado → WhatsApp llega a Liz con datos del pedido.
- [ ] Pago aprobado → WhatsApp llega al cliente con confirmación.
- [ ] Admin registra guía de envío → cliente recibe link de cobro de envío por WhatsApp.
- [ ] Cliente paga envío → WhatsApp llega a Liz.
- [ ] Admin marca enviado → cliente recibe WhatsApp con número de tracking.

---

## Referencias

- RACI sección (WhatsApp/Meta está implícito en infraestructura y operación)
- Owner Checklist sección A (WhatsApp Business, Meta/Instagram), B y C.4
- Checklist pre-lanzamiento → WhatsApp Business API
- delivery-launch-plan.md §5.9
