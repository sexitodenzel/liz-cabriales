# Checklist pre-lanzamiento

> **Fuente única de verdad:** [`docs/delivery/delivery-launch-plan.md`](delivery-launch-plan.md)  
> Ahí están el resumen para Liz, la **matriz RACI**, el gate Go-Live, riesgos y el anexo técnico (OAuth, MP, Resend, Instagram, crons).

Usa **este archivo** como lista rápida el día del lanzamiento.  
Para responsables, evidencias y pasos detallados → secciones **2**, **3** y **5** de `delivery-launch-plan.md`.

---

## Técnico

- [ ] Variables de Vercel completas (ver `.env.example` y sección 1 de `delivery finalll.md`)
- [ ] `CRON_SECRET` en Vercel
- [ ] `NEXT_PUBLIC_APP_URL` = dominio real + redeploy
- [ ] `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` (PROD)
- [ ] Webhook MP: `https://[dominio]/api/webhooks/mercadopago`
- [x] Resend: dominio `lizcabriales.com` verificado (Vercel auto-configure, Jun 09 2026)
- [x] `EMAIL_FROM` actualizado a `notificaciones@lizcabriales.com` en `lib/email/templates/_shared.ts`
- [ ] `RESEND_API_KEY` en Vercel
- [ ] `ADMIN_EMAIL` en Vercel (dirección que recibe alertas de admin)
- [ ] Supabase Auth → SMTP custom configurado con Resend (ver `docs/delivery/pendientes/resend.md` §SMTP)
- [ ] Email templates de Supabase Auth revisados (no los genéricos del placeholder)
- [ ] SQL ejecutado: `docs/delivery/sql-sprint5-supabase.sql` (recepcionista, CFDI, `handle_new_user`)
- [x] SQL ejecutado: `docs/delivery/sql-course-display-settings.sql` (toggles públicos de cursos)
- [ ] SQL ejecutado: `docs/delivery/sql-sprint-whatsapp.sql` (teléfono en users, campos TUA en orders, notification_log)
- [ ] Google OAuth: provider en Supabase + app publicada en Google Cloud (no testing)
- [ ] Supabase Auth URLs: Site URL + `https://[dominio]/auth/callback` (+ localhost)
- [ ] Instagram: token inicial + cron de renovación operativo
- [ ] Bucket Supabase `images` — upload desde admin OK
- [ ] `SALON_ADDRESS` y contacto real en `lib/email/templates/_shared.ts`
- [ ] Secretos rotados si hubo exposición fuera de Vercel
- [ ] `npm run build` sin errores
- [ ] `tsc --noEmit` limpio

**Detalle OAuth / MP / Instagram / WhatsApp:** `delivery finalll.md` → sección **5**.

### WhatsApp Business API (Meta)

- [ ] `WHATSAPP_ACCESS_TOKEN` en Vercel (token permanente de sistema — no el temporal del dashboard)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` en Vercel
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` en Vercel
- [ ] `ADMIN_WHATSAPP_PHONE` en Vercel (número de Liz en E.164, ej. `5218332183399`)
- [ ] 7 plantillas aprobadas en Meta Business Manager (ver §5.9 de `delivery finalll.md`): `phone_verify_otp`, `admin_new_order`, `order_products_confirmed`, `shipping_payment_request`, `shipping_paid_admin`, `order_shipped`, `order_delivered`
- [ ] Número de WhatsApp Business registrado y verificado en Meta
- [ ] Prueba: registro con teléfono → OTP recibido por WhatsApp
- [ ] Prueba: pago aprobado → WhatsApp llega a Liz y al cliente

---

## Contenido

- [ ] Productos reales importados
- [ ] Fotos reales de productos
- [ ] Textos reales en landing (sin placeholders tipo picsum)
- [ ] Al menos 1 curso publicado
- [ ] Cada curso revisado en admin: WhatsApp vs pago en línea, precio público y disponibilidad real/manual
- [ ] Servicios con precios reales

---

## Operativo

- [ ] Liz con acceso **admin** en producción
- [ ] Cuenta recepcionista creada (si aplica)
- [ ] Liz aprobó diseño en staging / producción
- [ ] % CFDI confirmado con contadora
- [ ] Video tutorial entregado
- [ ] Manual PDF entregado

---

## Gate final (copia de `delivery finalll.md` §3)

- [ ] Dominio real + SSL
- [ ] Login Google con cuenta externa
- [ ] Pago MP → webhook → estado pagado
- [ ] Email transaccional al cliente recibido (desde dominio real, no `resend.dev`)
- [ ] Email de alerta al admin recibido tras pago aprobado
- [ ] Reset de contraseña → email llega desde dominio real (Supabase SMTP via Resend)
- [ ] Feed Instagram visible
- [ ] WhatsApp OTP recibido al registrarse con teléfono
- [ ] Pago de productos → WhatsApp a Liz + al cliente
- [ ] Admin registra guía → cliente recibe cobro de envío por WhatsApp + link MP
- [ ] Segundo pago MP → estado `shipping_paid` + WhatsApp a Liz
- [ ] Admin marca enviado → WhatsApp + email al cliente con tracking
- [ ] Cliente cancela cita → email de confirmación al cliente + alerta al admin
- [ ] Firmas DEV + LIZ en plan maestro
