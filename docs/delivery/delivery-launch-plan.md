# Plan Maestro de Lanzamiento — Liz Cabriales

**Fecha objetivo de salida:** ____ / ____ / 2026  
**Versión:** 2.0  
**Documento operativo único** — reemplaza notas dispersas de handoff, RACI y OAuth.

---

## 0) Cómo usar este documento

| Sección | Para qué sirve | Quién la usa |
|---------|----------------|--------------|
| **1) Resumen ejecutivo** | Alinear con Liz qué depende de ella | Liz + DEV |
| **2) Matriz RACI** | Ejecutar y dar seguimiento semanal | DEV (principal) |
| **3) Checklist Go-Live** | Aprobar salida a producción | Liz + DEV |
| **4) Riesgos y seguridad** | No olvidar bloqueadores | DEV |
| **5) Anexo técnico** | Pasos detallados y referencias | DEV |

**Orden de trabajo recomendado:** Sección 2 (RACI) → Sección 3 (gate final) → Sección 5 (detalle técnico cuando haga falta).

---

## 1) Resumen ejecutivo (Owner Handoff)

### Qué debe tener Liz bajo su control (cuenta + pago)

- **Vercel** — hosting, dominio conectado, variables de entorno de producción.
- **Dominio + DNS** — compra/renovación, apuntar a Vercel, registros de email (Resend).
- **Supabase** — proyecto, facturación, Auth URLs, SQL manual pendiente.
- **Google Cloud** — OAuth para “Continuar con Google” (publicar app, no dejar en testing).
- **MercadoPago** — cuenta negocio, token PROD, webhook secret, URL de notificaciones.
- **Resend** — API key, dominio verificado, remitente de marca (no `onboarding@resend.dev`).
- **Instagram / Meta** — acceso a cuenta y token long-lived para el feed del sitio.

### Variables críticas en Vercel (producción)

| Variable | Público | Descripción |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Sí | Dominio real (checkout, emails, OAuth callback) |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Backend / webhooks / cron |
| `MERCADOPAGO_ACCESS_TOKEN` | No | Token **PROD** (no TEST) |
| `MERCADOPAGO_WEBHOOK_SECRET` | No | Firma del webhook MP |
| `RESEND_API_KEY` | No | Envío de correos transaccionales |
| `CRON_SECRET` | No | Auth de cron jobs en Vercel |
| `INSTAGRAM_ACCESS_TOKEN` | No | Fallback si no hay token en `app_settings` |
| `WHATSAPP_ACCESS_TOKEN` | No | Token de sistema Meta Cloud API (notificaciones WhatsApp) |
| `WHATSAPP_PHONE_NUMBER_ID` | No | ID del número de WhatsApp Business en Meta |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | No | ID de la cuenta de negocio Meta |
| `ADMIN_WHATSAPP_PHONE` | No | Número de Liz en E.164 — recibe alertas de nuevas órdenes y envíos pagados |

Plantilla completa: `.env.example` y `DEPLOY.md`.

### Datos de negocio que Liz debe confirmar

- [ ] Dirección del salón (emails y plantillas — hoy en `lib/email/templates/_shared.ts`)
- [ ] WhatsApp oficial (`833 218 3399` — validar)
- [ ] Instagram / Facebook oficiales (`@liz_cabriales`)
- [ ] % de cargo CFDI con su contadora
- [ ] Políticas finales de cambios / reembolsos (ver `docs/payments/proveedorpagos.md`)

### Dependencias técnicas fáciles de olvidar

- [ ] Ejecutar `docs/delivery/sql-sprint5-supabase.sql` en Supabase **antes** del go-live (trigger `handle_new_user` para Google OAuth).
- [ ] Ejecutar `docs/delivery/sql-sprint-whatsapp.sql` en Supabase (teléfono en `users`, campos TUA en `orders`, tabla `notification_log`).
- [ ] Bucket Supabase Storage `images` operativo (subida desde admin de productos).
- [ ] Cron en `vercel.json`: recordatorios de citas + renovación token Instagram.
- [ ] 7 plantillas WhatsApp aprobadas en Meta Business Manager antes del go-live.
- [ ] Rotar cualquier credencial que haya circulado fuera de Vercel/Supabase.

---

## 2) Matriz RACI (documento operativo principal)

**Roles:** **LIZ** = dueña · **DEV** = implementación · **OPS** = contadora / asistente / marketing  

**Leyenda:** R = ejecuta · A = aprueba / dueño final · C = consultado · I = informado

### 2.1 Infraestructura, dominio y despliegue

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Pago / plan Vercel activo | A/R | I | I | Billing activo |
| Liz como owner/admin en Vercel | A/R | C | I | Members & roles |
| Compra / renovación dominio | A/R | I | C | Dominio vigente |
| DNS dominio → Vercel | A | R | C | Dominio “Valid” |
| `NEXT_PUBLIC_APP_URL` = dominio real | A | R | I | Env + redeploy |
| Sitio accesible en dominio final | A | R | I | URL en navegador |

### 2.2 Supabase (DB, Auth, Storage)

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Plan / facturación Supabase | A/R | I | I | Billing activo |
| Acceso owner/admin Liz | A/R | C | I | Roles proyecto |
| Ejecutar `sql-sprint5-supabase.sql` | A | R | I | SQL sin error |
| Site URL + Redirect URLs Auth | A | R | I | URL Configuration |
| Bucket `images` + políticas | A | R | I | Upload admin OK |

### 2.3 Google OAuth

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Proyecto Google Cloud bajo Liz | A/R | C | I | Acceso Liz |
| Dominio real en orígenes JS | A | R | I | OAuth client |
| Redirect `/auth/callback` | A | R | I | URI autorizada |
| Branding / consent screen | A/R | C | I | Marca completa |
| Publicar app (no testing) | A/R | C | I | “In production” |
| Login Google con cuenta externa | A | R | I | Prueba OK |

### 2.4 MercadoPago

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Cuenta MP negocio validada | A/R | I | I | Cuenta activa |
| Token PROD + webhook secret | A/R | C | I | Credenciales en Vercel |
| Webhook `…/api/webhooks/mercadopago` | A | R | I | Panel MP |
| Prueba pago → webhook → paid | A | R | I | Orden/cita pagada |

### 2.5 Resend (emails)

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Cuenta / plan Resend | A/R | I | I | Billing activo |
| Verificar dominio de envío | A/R | C | I | “Verified” |
| SPF / DKIM / DMARC en DNS | A | R | C | DNS propagado |
| `RESEND_API_KEY` en Vercel | A | R | I | Env activa |
| Remitente real (no sandbox) | A | R | I | From de marca |
| Email de prueba entregado | A | R | I | Bandeja recibida |

### 2.6 Instagram / Meta

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Acceso Instagram / Meta Developers | A/R | C | I | Acceso confirmado |
| Token long-lived inicial | A/R | C | I | Token válido |
| `INSTAGRAM_ACCESS_TOKEN` (fallback) | A | R | I | Env si aplica |
| Cron renovación token (mensual) | A | R | I | Cron OK |
| Feed en home con posts reales | A | R | I | 4 posts visibles |

### 2.7 WhatsApp Business API (Meta)

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Cuenta Meta Business verificada | A/R | C | I | Negocio verificado |
| Número WhatsApp registrado en Meta | A/R | C | I | Número activo en WABA |
| Crear y enviar 7 plantillas a revisión | A | R | I | Plantillas en Meta BM |
| Plantillas aprobadas por Meta | A/R | I | I | Status "Approved" |
| `WHATSAPP_ACCESS_TOKEN` (sistema) + IDs en Vercel | A | R | I | Env activas |
| `ADMIN_WHATSAPP_PHONE` = número Liz E.164 | A/R | C | I | Env activa |
| SQL `sql-sprint-whatsapp.sql` ejecutado | A | R | I | Sin errores |
| Prueba OTP al registrar teléfono | A | R | I | Mensaje recibido |
| Prueba: pago → WhatsApp admin + cliente | A | R | I | Mensajes recibidos |
| Prueba: guía → cobro envío por WhatsApp | A | R | I | Mensaje + link MP OK |

### 2.8 Operación y contenido

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Datos contacto finales | A/R | C | I | Sitio + emails |
| Políticas comerciales | A/R | C | C | Validado |
| % CFDI con contadora | A | C | R | % definido |
| Catálogo / fotos reales | A | R | C | Tienda lista |
| Aprobación diseño final | A/R | C | I | Firma Liz |

### 2.10 Facturación CFDI

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| SQL `sql-invoice-fields.sql` ejecutado en Supabase | A | R | I | Sin error |
| Bucket `invoice-docs` creado en Storage (privado, 10 MB) | A | R | I | Storage OK |
| `ADMIN_EMAIL` en Vercel (recibe alerta de constancia fiscal) | A | R | I | Env activa |
| % CFDI confirmado con contadora → aplicado en checkout | A | C | R | % definido |
| Prueba comprador — checkout con factura: campos RFC + razón social + correo visibles, total muestra +16% | A | R | I | UI OK |
| Prueba comprador — subir constancia fiscal en checkout → correo de alerta llega a Liz | A | R | I | Email recibido |
| Prueba comprador — subir ticket de pago desde `/orden/[id]` → UI muestra "Ticket recibido" | A | R | I | Confirmación OK |
| Prueba admin — sección "Facturación CFDI" visible en `/admin/orders/[id]` con RFC, razón social, correo y estado "Pendiente" | A | R | I | Panel OK |
| Prueba admin — botón "Ver constancia fiscal" abre el documento (cuando la clienta ya lo subió) | A | R | I | Documento abre |
| Prueba admin — botón "Ver ticket de pago" abre el comprobante | A | R | I | Documento abre |
| Prueba admin — "Marcar factura como emitida" → estado cambia a "Emitida" + email llega a correo de factura de la clienta | A | R | I | Estado + email OK |

### 2.11 Seguridad y continuidad

| Actividad | LIZ | DEV | OPS | Evidencia |
|-----------|-----|-----|-----|-----------|
| Rotación secretos expuestos | A | R | I | Keys nuevas |
| Inventario secretos por plataforma | A | R | I | Checklist |
| 2FA en cuentas owner | A/R | C | I | 2FA activo |
| Manual / video operativo | A | R | I | Entregado |

---

## 3) Checklist Go-Live (aprobación final)

### Técnico

- [ ] Dominio real + SSL activo
- [ ] Todas las variables de `.env.example` cargadas en Vercel (valores PROD)
- [ ] `sql-sprint5-supabase.sql` ejecutado
- [ ] `sql-sprint-whatsapp.sql` ejecutado (teléfono, TUA, notification_log)
- [ ] Google OAuth publicado + probado con cuenta externa
- [ ] Webhook MercadoPago registrado y probado (primer pago + segundo pago envío)
- [ ] Resend con dominio verificado + remitente actualizado en código si aplica
- [ ] `CRON_SECRET` configurado (recordatorios + Instagram)
- [ ] Feed Instagram operativo
- [x] `sql-course-display-settings.sql` ejecutado (controles públicos de cursos)
- [ ] Variables WhatsApp en Vercel: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `ADMIN_WHATSAPP_PHONE`
- [ ] 7 plantillas Meta aprobadas: `phone_verify_otp`, `admin_new_order`, `order_products_confirmed`, `shipping_payment_request`, `shipping_paid_admin`, `order_shipped`, `order_delivered`
- [ ] Prueba E2E flujo TUA: pago → guía → cobro envío → segundo pago → enviado
- [ ] `sql-invoice-fields.sql` ejecutado en Supabase (columnas CFDI en `orders`)
- [ ] Bucket `invoice-docs` creado en Supabase Storage (privado, límite 10 MB)
- [ ] `ADMIN_EMAIL` en Vercel (alerta cuando clienta sube constancia fiscal)
- [ ] Prueba comprador — checkout con factura: RFC + razón social + correo de factura, total refleja +16%
- [ ] Prueba comprador — subir constancia fiscal en checkout → correo de alerta llega a Liz
- [ ] Prueba comprador — subir ticket de pago desde `/orden/[id]` (orden ya pagada) → UI confirma "Ticket recibido"
- [ ] Prueba admin — `/admin/orders/[id]` muestra sección "Facturación CFDI" con datos de la clienta y estado "Pendiente"
- [ ] Prueba admin — botón "Ver constancia fiscal" y "Ver ticket de pago" abren los documentos correctamente
- [ ] Prueba admin — "Marcar factura como emitida" → `invoice_status = issued` en DB + email de aviso llega al correo de factura de la clienta

### Contenido y operación

- [ ] Productos y fotos reales en tienda
- [ ] Al menos 1 curso publicado
- [ ] Toggles de cada curso revisados: WhatsApp vs pago en línea, precio público y disponibilidad real/manual
- [ ] Liz con usuario **admin**; recepcionista creada si aplica
- [ ] Liz aprobó staging / producción

### Firmas

**DEV:** ______________________  **Fecha:** __________  
**LIZ:** ______________________  **Fecha:** __________

---

## 4) Riesgos, mitigaciones y seguridad

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| OAuth en modo testing | Clientas no pueden entrar con Google | Publicar app + branding en Google Cloud |
| Webhook MP mal configurado | Pagos no confirman orden/cita/curso | URL + `MERCADOPAGO_WEBHOOK_SECRET` + prueba E2E |
| Emails desde `onboarding@resend.dev` | Spam / baja entregabilidad | Dominio verificado + SPF/DKIM |
| Token Instagram vencido | Feed vacío en home | Cron mensual + token en `app_settings` |
| SQL `handle_new_user` no ejecutado | Perfil roto tras login Google | Ejecutar `sql-sprint5-supabase.sql` |
| SQL `sql-sprint-whatsapp.sql` no ejecutado | Columnas faltantes → error en checkout/panel | Ejecutar antes del go-live |
| SQL de controles de cursos no ejecutado | Error al cargar/editar cursos por columnas faltantes | Ejecutado el 2026-05-18; re-ejecutar `sql-course-display-settings.sql` si se restaura DB |
| Variables WhatsApp no configuradas | Sin notificaciones WhatsApp (no rompe el flujo) | El código omite sin error — activar cuando Meta esté lista |
| Plantillas Meta no aprobadas | Mensajes bloqueados por Meta | Registrar y esperar aprobación (~24 h para Utility) |
| Token WhatsApp temporal (no de sistema) | Expira en horas → mensajes dejan de salir | Usar token de sistema permanente desde Meta BM |
| Secretos en chat o repo | Compromiso de cuentas | Rotar keys; solo Vercel / gestor seguro |
| `sql-invoice-fields.sql` no ejecutado | Checkout con factura rompe (columnas inexistentes en `orders`) | Ejecutar antes del go-live |
| Bucket `invoice-docs` no creado | Upload de constancia/ticket falla con error de Storage | Crear en Supabase Storage → privado → límite 10 MB |
| `ADMIN_EMAIL` no configurado | Liz no recibe alerta cuando clienta sube constancia fiscal | Agregar `ADMIN_EMAIL` en Vercel antes de salir |

**Seguridad obligatoria antes de salir:**

- [ ] Rotar credenciales que hayan salido de entornos seguros
- [ ] No commitear `.env.local` ni pegar secrets en documentos
- [ ] 2FA en Vercel, Supabase, Google Cloud, MercadoPago, Resend

---

## 5) Anexo técnico

### 5.1 Google OAuth — pasos al dominio real

Configuración actual funciona en staging (`https://liz-cabriales.vercel.app`). Al pasar al dominio final:

**Orden el día del lanzamiento**

0. Supabase → SQL Editor → ejecutar `docs/delivery/sql-sprint5-supabase.sql` (trigger `handle_new_user`)
1. Google Cloud — agregar dominio real al cliente OAuth
2. Google Cloud — completar información de la marca
3. Google Cloud — **Publicar app** (salir de modo prueba)
4. Supabase — actualizar **Site URL** al dominio real
5. Supabase — agregar Redirect URL: `https://[dominio]/auth/callback` (mantener vercel.app y localhost)
6. Vercel — `NEXT_PUBLIC_APP_URL` = dominio real → redeploy
7. Probar login con Google desde cuenta **distinta** a la de desarrollo

**Google Cloud Console**

Ir a [console.cloud.google.com](https://console.cloud.google.com/) → proyecto **LizCabrialesStudio** → Google Auth Platform → Clientes → **Liz Cabriales Studio**

- **Orígenes autorizados de JavaScript:** `https://[dominio-real-de-liz]`
- **URIs de redireccionamiento autorizados (frontend):** `https://[dominio-real-de-liz]/auth/callback`  
  (No quitar el callback de Supabase: `https://[project-id].supabase.co/auth/v1/callback`)

**Información de la marca (obligatorio)**

- Nombre: `Liz Cabriales`
- Email de soporte: correo de Liz
- Logo PNG de la academia
- Dominio autorizado: dominio real

Sin esto, Google muestra **“App no verificada”**.

**Supabase — URL Configuration**

- Site URL: `https://[dominio-real-de-liz]`
- Redirect URLs: incluir `https://[dominio-real-de-liz]/auth/callback`

**Referencias (ya configuradas — no rotar sin necesidad)**

- Client ID: `355991515654-hi6bil0isugh363eu3lo9meunbav0vdm.apps.googleusercontent.com`
- Client Secret: en dashboard Supabase → Auth → Google (no hace falta en Vercel)
- Callback Supabase: `https://qlvslouwkiemsjkggdqq.supabase.co/auth/v1/callback`
- Project ref: `qlvslouwkiemsjkggdqq`
- Proyecto Google: `LizCabrialesStudio` (ID: `lizcabrialessalon`)

### 5.2 MercadoPago

- Panel: [developers.mercadopago.com](https://www.mercadopago.com/developers/panel/credentials)
- Webhook URL: `https://[dominio]/api/webhooks/mercadopago`
- Tipo: notificación de pago
- Variables: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` alimenta `back_urls` y `notification_url` en preferencias

Comisiones las absorbe Liz (~3.49% + IVA tarjeta). Ver `docs/payments/proveedorpagos.md`.

### 5.3 Resend

- API key en Resend → Vercel `RESEND_API_KEY`
- Hoy el código usa remitente sandbox:
  - `lib/email/resend.ts` → `onboarding@resend.dev`
  - `lib/email/templates/_shared.ts` → `EMAIL_FROM` con `onboarding@resend.dev`
- Tras verificar dominio: actualizar `from` / `EMAIL_FROM` al dominio de Liz

### 5.4 Instagram

- API: `GET /api/instagram` (Graph API `me/media`)
- Token: tabla `app_settings` key `instagram_access_token` o env `INSTAGRAM_ACCESS_TOKEN`
- Renovación: cron `GET /api/cron/instagram-token` — schedule `0 9 1 * *` (día 1 de cada mes)
- Requiere `CRON_SECRET` en Vercel (mismo secret que recordatorios de citas)

### 5.5 Cron jobs (vercel.json)

| Ruta | Schedule | Función |
|------|----------|---------|
| `/api/cron/appointment-reminders` | `0 10 * * *` | Email 24 h antes de cita |
| `/api/cron/instagram-token` | `0 9 1 * *` | Renovar token Instagram |

Ambos exigen header `Authorization: Bearer <CRON_SECRET>`.

### 5.6 Supabase Storage

- Bucket: `images` (upload desde `app/admin/components/ImageUploader.tsx`)
- Confirmar políticas RLS / permisos para rol admin al subir imágenes de productos

### 5.7 SQL y DB adicionales (referencia)

- Sprint 5: `docs/delivery/sql-sprint5-supabase.sql` (rol recepcionista, CFDI, trigger OAuth)
- Sprint WhatsApp + TUA: `docs/delivery/sql-sprint-whatsapp.sql` (teléfono, envío TUA, notification_log)
- Pre-lanzamiento ampliado: `docs/delivery/checklist-prelanzamiento.md`
- Deploy general: `DEPLOY.md`
- Comentarios SQL embebidos en `app/api/webhooks/mercadopago/route.ts` (`email_sent`, `create_order_atomic`)

### 5.8 Emails transaccionales que usa el sistema

| Evento | Origen aproximado |
|--------|-------------------|
| Confirmación de pedido | Webhook MP → `sendOrderConfirmationEmail` |
| Confirmación de cita | Webhook MP |
| Inscripción a curso | Webhook MP |
| Recordatorio de cita | Cron appointment-reminders |
| Bienvenida cliente (admin crea usuario) | `POST /api/admin/users` |
| Solicitud de factura recibida (clienta subió constancia) | `POST /api/orders/[id]/invoice-upload` → `sendInvoiceReceivedAdminEmail` → **a Liz** |
| Factura emitida por Liz | `POST /api/admin/orders/[id]/invoice-issue` → `sendInvoiceIssuedClientEmail` → **a correo de factura de la clienta** |

Todos dependen de **Resend** + `NEXT_PUBLIC_APP_URL` en enlaces.

### 5.9 WhatsApp Business API (Meta Cloud API)

**Cómo funciona:**  
El código usa Meta Cloud API directa (`graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`). Si las variables de entorno no están configuradas, los mensajes se omiten sin romper el flujo (stub seguro en `lib/notifications/whatsapp-client.ts`).

**Token de sistema (no el temporal del dashboard):**  
En Meta Business Manager → tu WABA → System users → crear usuario de sistema → generar token permanente con permisos `whatsapp_business_messaging`.

**Plantillas a registrar en Meta Business Manager** (nombre exacto requerido en código):

| Nombre en código | Categoría Meta | Destinatario | Cuándo se envía |
|-----------------|----------------|--------------|-----------------|
| `phone_verify_otp` | Authentication | Cliente | Al registrarse con teléfono |
| `admin_new_order` | Utility | Liz (admin) | Pago de productos aprobado |
| `order_products_confirmed` | Utility | Cliente | Pago de productos aprobado |
| `shipping_payment_request` | Utility | Cliente | Admin registra guía + costo envío |
| `shipping_paid_admin` | Utility | Liz (admin) | Cliente paga el envío |
| `order_shipped` | Utility | Cliente | Admin marca estado `shipped` |
| `order_delivered` | Utility | Cliente | Admin marca estado `delivered` |

**Variables de cada plantilla** (en orden de `{{1}}`, `{{2}}`, …):

| Plantilla | Variables |
|-----------|-----------|
| `phone_verify_otp` | `{{1}}` código OTP |
| `admin_new_order` | `{{1}}` # orden · `{{2}}` total MXN · `{{3}}` nombre cliente · `{{4}}` tipo entrega |
| `order_products_confirmed` | `{{1}}` nombre · `{{2}}` # orden · `{{3}}` total MXN |
| `shipping_payment_request` | `{{1}}` nombre · `{{2}}` monto envío MXN · `{{3}}` # orden · `{{4}}` URL pago MP |
| `shipping_paid_admin` | `{{1}}` # orden · `{{2}}` monto envío MXN · `{{3}}` nombre cliente |
| `order_shipped` | `{{1}}` nombre · `{{2}}` # orden · `{{3}}` paquetería · `{{4}}` número de guía |
| `order_delivered` | `{{1}}` nombre · `{{2}}` # orden |

**Flujo de estados de orden con WhatsApp:**

```
pending → paid (WhatsApp admin + cliente)
paid → awaiting_shipping_payment (WhatsApp cliente: cobro envío + link MP)
awaiting_shipping_payment → shipping_paid (WhatsApp admin: envío pagado)
shipping_paid → shipped (WhatsApp cliente: tracking)
shipped → delivered (WhatsApp cliente: entregado)
```

**Archivos clave:**
- `lib/notifications/whatsapp-client.ts` — cliente HTTP a Meta
- `lib/notifications/templates.ts` — nombres y builders de componentes
- `lib/notifications/order-notifications.ts` — funciones de notificación con idempotencia
- `lib/notifications/phone-verification.ts` — OTP con hash SHA-256, TTL 10 min
- `app/api/admin/orders/[id]/shipping-quote/route.ts` — registra guía + crea preferencia MP envío
- `app/api/phone/send-code/route.ts` + `verify-code/route.ts` — OTP endpoints

**Costos estimados (México, 2026):** ~USD 5–10/mes a 80 pedidos/mes con 4 plantillas Utility por pedido. Billing en Meta Business Suite.

---

## Documentos relacionados

| Documento | Uso |
|-----------|-----|
| **`docs/delivery finalll.md`** (este) | Plan maestro, RACI, anexo técnico |
| `docs/delivery/checklist-prelanzamiento.md` | Lista rápida día del lanzamiento (apunta aquí) |
| `docs/delivery/delivery-backlog.md` | Backlog de entregas |
| `DEPLOY.md` | Pasos de deploy en Vercel |
| `.env.example` | Plantilla de variables |
