# Pendiente: MercadoPago (Cobros en producción)

**Bloquea:** pagos reales, checkout funcional, webhook activo  
**Responsable:** Liz (cuenta y credenciales) + Dev (configuración técnica)

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

## Prueba de aceptación (E2E)

- [ ] Realizar un pago real o de QA desde el checkout.
- [ ] Verificar que el webhook llega y actualiza el estado de la orden/cita a `paid`.
- [ ] Confirmar que el email de confirmación se envía después del pago.

---

## Referencias

- RACI sección 4 — MercadoPago
- Owner Checklist sección B y C.2
- Checklist pre-lanzamiento → Técnico (líneas MP)
