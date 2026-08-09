# Pendiente: MercadoPago (Cobros en producción)

**Bloquea:** pagos reales, checkout funcional, webhook activo  
**Responsable:** Liz (cuenta y credenciales) + Dev (configuración técnica)

---

## Estado al 2026-08-08

La aplicación productiva vive en la cuenta de MercadoPago de **Lizeth Berenice
Peña / Distribuidora Liz Cabriales**, que es la que recibe el dinero:

- App: `liz-cabriales-tienda`, id `5692132340382692`, **Checkout Pro**.
- Webhook registrado en modo productivo:
  `https://lizcabriales.com/api/webhooks/mercadopago`, evento **"Pagos
  (legacy)"** — es el que manda `type: "payment"`, el único que procesa
  `app/api/webhooks/mercadopago/route.ts`. "Order (Mercado Pago)" NO sirve.
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_APP_URL`, `TURNSTILE_SECRET_KEY`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `ADMIN_EMAIL` cargadas en Vercel
  (Production) con redeploy.

Pendiente: la prueba E2E y **rotar access token y webhook secret** al terminar.

### Acceso del dev a la cuenta de Liz

Denzel entra como **colaborador**. Un rol personalizado con los permisos de
"Configuración de Integraciones" alcanza para *listar* aplicaciones, pero **no
para ver credenciales**: esa sección exige **Administrador de la cuenta**.
Además, **guardar la configuración de webhooks pide confirmación 2FA del dueño
de la cuenta**, así que ese paso lo tiene que hacer Liz aunque el dev sea
administrador.

Truco de navegación: el panel de developers hereda la cuenta activa. Hay que
cambiar de cuenta primero en `mercadopago.com.mx/home` (el saldo se ve tapado
`$ ***` cuando el contexto es el correcto) y **en esa misma pestaña** abrir
`/developers/panel/app`. Al revés muestra la cuenta propia.

---

## Qué necesita hacer Liz

1. Confirmar que su **cuenta MercadoPago de negocio** está activa y validada.
2. Entrar a **MercadoPago Developers → Mis aplicaciones → Credenciales de producción** y copiar:
   - `Access Token` de producción (empieza con `APP_USR-...`)
   - `Webhook Secret` (se genera al registrar el webhook)
3. Enviar esas dos credenciales al Dev de forma segura (no por chat abierto).

---

## Qué hace el Dev (con las credenciales de Liz)

1. En **Vercel → Settings → Environment Variables**, agregar/actualizar:
   - `MERCADOPAGO_ACCESS_TOKEN` = access token PROD
   - `MERCADOPAGO_WEBHOOK_SECRET` = webhook secret PROD
2. En el panel de MercadoPago, registrar el webhook:
   - URL: `https://[dominio-real]/api/webhooks/mercadopago`
   - Eventos: `payment` (pagos)
3. Hacer redeploy en Vercel para que las vars entren en efecto.

---

## ⚠️ Credenciales de prueba vs. producción (fix 2026-08-07)

La URL de checkout ahora se elige por el **tipo de access token**, no por qué
campo devolvió MercadoPago (`lib/mercadopago.ts` → `resolveCheckoutUrl`). La API
de preferencias devuelve `init_point` **y** `sandbox_init_point` en las dos
modalidades, así que el criterio anterior (`sandbox_init_point ?? init_point`)
habría mandado a los clientes al sandbox al cambiar a credenciales reales.

- Token que empieza con `TEST-` → sandbox.
- Token que empieza con `APP_USR-` → checkout real.

Consecuencia práctica: **basta con cambiar `MERCADOPAGO_ACCESS_TOKEN` en Vercel**
para pasar de pruebas a cobros reales; no hay que tocar código.

---

## 🛟 Red de seguridad si el webhook falla (2026-08-07)

El webhook siempre responde 200 (MercadoPago no reintenta), así que un fallo
puntual podría dejar una compra cobrada sin acreditar. Tres defensas:

1. **El cron de limpieza ya no cancela órdenes con pago aprobado.** Antes,
   `/api/cron/cleanup-pending` cancelaba cualquier orden `pending` de más de 2 h;
   ahora consulta `payments` y respeta las que tienen un pago `approved`. El
   campo `kept_with_approved_payment` de la respuesta del cron es el indicador:
   si sube, hay pagos que el webhook no está acreditando.
2. **Botón "Verificar pago en MercadoPago"** en `/admin/orders/[id]`, visible
   cuando la orden está `pending` o `cancelled`. Le pregunta a MercadoPago por
   `external_reference` = id de la orden y, si hay un pago aprobado, acredita
   por el mismo camino que el webhook (stock, carrito, correos y alertas). No
   permite marcar como pagada a mano: el dinero lo confirma MercadoPago.
3. **La tienda falla cerrado**: si no se puede registrar la fila en `payments`,
   `/api/payments/mercadopago` responde error y no manda al cliente a pagar
   (antes solo lo loggeaba y el pago quedaba sin forma de acreditarse).

---

## ⚠️ Cambio de seguridad (auditoría 2026-07-05)

Desde la auditoría, **el webhook exige la firma en producción**: si
`MERCADOPAGO_WEBHOOK_SECRET` NO está configurada en Vercel (producción), el
webhook responde 200 pero **no procesa el pago** (loggea un error), para no
acreditar cobros sin verificar firma. Consecuencia práctica: **si falta esa var,
los pagos no se marcan como `paid` automáticamente.**

- [ ] **Verificar que `MERCADOPAGO_WEBHOOK_SECRET` exista en Vercel → producción.**
  Es el primer paso a revisar si un pago se aprueba en MP pero la orden queda `pending`.

Ver `docs/tech/security-audit-2026-07-05.md` (hallazgo #3).

---

## Prueba de aceptación (E2E)

Hacerla **el mismo día** que se configuran las credenciales, con un producto de
monto bajo y comprando desde una cuenta de cliente real (no la de Liz: en
MercadoPago no puedes pagarte a ti mismo).

- [ ] `NEXT_PUBLIC_APP_URL` = dominio real en Vercel **y redeploy hecho**
      (de ahí salen `notification_url` y `back_urls`; es `NEXT_PUBLIC_*`, se
      inyecta en build).
- [ ] Llaves reales de Turnstile en Vercel: sin ellas el checkout ni siquiera
      llega a MercadoPago. Ver `pendientes/turnstile.md`.
- [ ] Realizar la compra desde el checkout y confirmar que la URL de pago es
      `www.mercadopago.com.mx` y **no** `sandbox.mercadopago.com.mx`.
- [ ] Verificar que la orden pasa a `paid` sola (webhook) en menos de 1 min.
- [ ] Confirmar el correo de confirmación al cliente y la alerta al admin.
- [ ] Confirmar en el panel de MercadoPago que el evento del webhook aparece
      como entregado con 200.
- [ ] Si la orden se quedó en `pending`: revisar `MERCADOPAGO_WEBHOOK_SECRET`
      (tiene que ser el de **modo productivo**) y usar el botón
      "Verificar pago en MercadoPago" del panel para recuperarla.

---

## Referencias

- RACI sección 4 — MercadoPago
- Owner Checklist sección B y C.2
- Checklist pre-lanzamiento → Técnico (líneas MP)
