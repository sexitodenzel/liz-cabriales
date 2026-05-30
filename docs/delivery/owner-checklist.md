# Liz Cabriales — Responsabilidades de Propietaria (Owner Checklist)
Fecha: ____ / ____ / 2026

## Objetivo
Dejar producción operable y segura, con todas las cuentas críticas bajo control de Liz.

---

## A) Cuentas y pagos que deben estar a nombre/control de Liz

- [ ] **Vercel (hosting):** owner/admin, facturación activa, dominio conectado.
- [ ] **Dominio y DNS:** dominio pagado/renovado, DNS apuntando a Vercel.
- [ ] **Supabase:** owner/admin del proyecto, plan activo.
- [ ] **Google Cloud (OAuth):** proyecto de login con Google bajo su control.
- [ ] **MercadoPago:** cuenta negocio activa + credenciales de producción.
- [ ] **Resend:** cuenta/plan activa + dominio de envío verificado.
- [ ] **WhatsApp Business (Meta Cloud API):** cuenta Business activa, número verificado, app en Meta Developers.
- [ ] **Meta/Instagram:** acceso a cuenta y permisos para token de Graph API.

---

## B) Configuración obligatoria de producción

- [ ] `NEXT_PUBLIC_APP_URL` con dominio real
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MERCADOPAGO_ACCESS_TOKEN` (PROD)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` (PROD)
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`
- [ ] `WHATSAPP_ACCESS_TOKEN`
- [ ] `WHATSAPP_PHONE_NUMBER_ID`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID`
- [ ] `ADMIN_WHATSAPP_PHONE` (número de Liz en formato E.164, ej: `5218331234567`)
- [ ] `INSTAGRAM_ACCESS_TOKEN` (si se usa fallback)

---

## C) Pasos críticos que dependen de Liz

1. **Google Login**
   - Publicar app OAuth (no dejar en testing).
   - Completar branding/consent screen.
   - Autorizar dominio real y callback frontend.

2. **MercadoPago**
   - Registrar webhook real: `/api/webhooks/mercadopago`.
   - Entregar token/secret de producción.

3. **Resend**
   - Verificar dominio propio.
   - Cambiar remitente de `onboarding@resend.dev` a dominio de marca.

4. **WhatsApp Business**
   - Crear app en Meta Developers y conectar número de WhatsApp Business.
   - Entregar `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`.
   - Confirmar número en formato E.164 para `ADMIN_WHATSAPP_PHONE`.

5. **Instagram**
   - Dar acceso para generar token long-lived.
   - Confirmar renovación mensual del token (cron).

5. **Supabase**
   - Ejecutar SQL manual de producción (`docs/delivery/sql-sprint5-supabase.sql`).
   - Confirmar URL Configuration de Auth con dominio final.

---

## D) Datos de negocio que Liz debe confirmar/entregar

- [ ] Dirección final del salón (emails/plantillas)
- [ ] WhatsApp oficial
- [ ] Instagram/Facebook oficiales
- [ ] Política de facturación (% CFDI) con su contadora
- [ ] Política final de cancelaciones/reembolsos

---

## E) Criterio de "listo para salir"

- [ ] Compra real/QA en MercadoPago confirmada
- [ ] Webhook actualiza estado a pagado
- [ ] Email de confirmación llega correctamente
- [ ] Login con Google funciona desde dominio real
- [ ] Feed de Instagram muestra publicaciones reales

---

## F) Seguridad

- [ ] Rotar cualquier credencial expuesta fuera de secretos seguros
- [ ] No guardar API keys en docs/chats/repositorio
- [ ] Mantener secretos solo en Vercel/Supabase/gestor seguro
