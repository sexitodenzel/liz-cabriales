# Sprint 2 — WhatsApp + Envío TUA

**Rama:** `master`  
**Fecha:** 2026-05-18  
**Objetivo:** Integrar WhatsApp Business API para notificaciones automáticas y flujo de cobro de envío post-guía (modelo TUA: cliente paga solo productos en el primer checkout; el costo real del envío se cobra como segundo pago de MercadoPago después de que Liz genera la guía manualmente).

---

## Lo que se implementó

### Base de datos (SQL en Supabase)

- `docs/delivery/sql-sprint-whatsapp.sql` — ejecutado manualmente en Supabase SQL Editor
  - Columnas nuevas en `users`: `phone`, `phone_verified`, `whatsapp_opt_in`, `phone_verification_code_hash`, `phone_verification_expires_at`
  - Columnas nuevas en `orders`: `shipping_amount_final`, `shipping_payment_status`, `shipping_payment_preference_id`, `shipping_payment_url`, `carrier`, `tracking_number`, `guide_notes`, `guide_created_at`, `shipped_at`
  - Tabla nueva `notification_log` con índice único de idempotencia por `(entity_type, entity_id, channel, template_name)`

### Tipos TypeScript

- `types/index.ts`: nuevos estados de orden `awaiting_shipping_payment` y `shipping_paid`; nuevo tipo `ShippingPaymentStatus`

### Capa de notificaciones (`lib/notifications/`)

| Archivo | Función |
|---------|---------|
| `whatsapp-client.ts` | Llamada HTTP a Meta Cloud API. Stub seguro: si no hay `WHATSAPP_ACCESS_TOKEN`, loguea y no lanza error |
| `templates.ts` | Constantes de nombres de plantilla + builders de `components[]` para cada template |
| `order-notifications.ts` | 5 funciones públicas con idempotencia via `notification_log` |
| `phone-verification.ts` | OTP de 6 dígitos con hash SHA-256 y TTL de 10 minutos |

### API Routes nuevas

| Ruta | Método | Función |
|------|--------|---------|
| `/api/phone/send-code` | POST | Genera y envía OTP por WhatsApp al teléfono del usuario |
| `/api/phone/verify-code` | POST | Valida OTP, marca `phone_verified = true` |
| `/api/admin/orders/[id]/shipping-quote` | POST | Liz registra costo de envío → crea preferencia MP (`shipping:ORDER_ID`) → WhatsApp al cliente |

### Webhook MercadoPago extendido

- `app/api/webhooks/mercadopago/route.ts`: nuevo dispatch para `external_reference = "shipping:ORDER_ID"`
  - Idempotencia via `.eq('shipping_payment_status', 'pending')` en el update
  - Al aprobarse: estado → `shipping_paid`, WhatsApp a Liz
- Pago de productos aprobado: ahora también dispara `sendNewOrderAlerts` (WhatsApp a Liz + cliente)

### Status route extendida

- `app/api/admin/orders/[id]/status/route.ts`: dispara WhatsApp al cliente al cambiar a `shipped` o `delivered`

### Panel admin

- `app/admin/orders/[id]/page.tsx`:
  - Badges nuevos para `awaiting_shipping_payment` (naranja) y `shipping_paid` (violeta)
  - Sección "Guía y envío": formulario para ingresar monto, paquetería, tracking y notas; botón "Enviar cobro de envío al cliente"
  - Muestra info de guía y estado de pago cuando ya fue registrada

### Registro de usuario

- `app/(auth)/login/page.tsx`:
  - Campo teléfono + checkbox opt-in WhatsApp en el formulario de registro
  - Si el usuario ingresa teléfono y acepta: flujo OTP de 2 pasos post-registro (paso OTP con opción de omitir)

### Validaciones y tipos actualizados

- `lib/validations/phone.ts` — schema E.164
- `lib/validations/shippingQuote.ts` — schema del body de la guía
- `lib/validations/adminOrders.ts` — nuevos estados en filtro de query
- `lib/supabase/adminOrders.ts` — tipos y queries con columnas nuevas + función `claimShippingPayment`
- `app/admin/orders/page.tsx` + `app/perfil/page.tsx` — labels de estados nuevos
- `.env.example` — 4 variables WhatsApp documentadas

### Documentación actualizada

- `docs/delivery/checklist-prelanzamiento.md` — sección WhatsApp + items en gate final
- `docs/delivery/delivery finalll.md` — variables, RACI §2.7, go-live, riesgos, anexo §5.9

---

## Flujo de estados de orden implementado

```
pending
  ↓ webhook MP aprobado
paid
  ├─ pickup → Liz marca shipped directamente (sin TUA)
  └─ shipping → Admin registra guía en panel
       ↓ POST /api/admin/orders/[id]/shipping-quote
awaiting_shipping_payment  ← WhatsApp al cliente con link MP
  ↓ webhook MP aprobado (external_reference = "shipping:ORDER_ID")
shipping_paid  ← WhatsApp a Liz
  ↓ Admin marca shipped en panel
shipped  ← WhatsApp al cliente con tracking
  ↓ Admin marca delivered
delivered  ← WhatsApp al cliente
```

---

## Plantillas WhatsApp pendientes de crear en Meta Business Manager

Deben crearse con estos nombres exactos y aprobarse antes del go-live:

| Nombre | Categoría | Variables del body |
|--------|-----------|--------------------|
| `phone_verify_otp` | Authentication | `{{1}}` código |
| `admin_new_order` | Utility | `{{1}}` # orden · `{{2}}` total · `{{3}}` cliente · `{{4}}` tipo entrega |
| `order_products_confirmed` | Utility | `{{1}}` nombre · `{{2}}` # orden · `{{3}}` total |
| `shipping_payment_request` | Utility | `{{1}}` nombre · `{{2}}` monto envío · `{{3}}` # orden · `{{4}}` URL pago |
| `shipping_paid_admin` | Utility | `{{1}}` # orden · `{{2}}` monto envío · `{{3}}` cliente |
| `order_shipped` | Utility | `{{1}}` nombre · `{{2}}` # orden · `{{3}}` paquetería · `{{4}}` guía |
| `order_delivered` | Utility | `{{1}}` nombre · `{{2}}` # orden |

---

## Pendientes de este sprint

- [ ] Crear cuenta Meta Business + registrar número de WhatsApp Business
- [ ] Crear las 7 plantillas en Meta Business Manager y esperar aprobación (~24 h para Utility)
- [ ] Obtener token de sistema permanente (no el temporal del dashboard de Meta)
- [ ] Agregar variables al `.env.local` y a Vercel:
  ```
  WHATSAPP_ACCESS_TOKEN=
  WHATSAPP_PHONE_NUMBER_ID=
  WHATSAPP_BUSINESS_ACCOUNT_ID=
  ADMIN_WHATSAPP_PHONE=521XXXXXXXXXX
  ```
- [ ] Prueba E2E con número real: OTP → compra → guía → cobro envío → pago envío → enviado → entregado
- [ ] Verificar que el perfil del usuario muestre el estado `awaiting_shipping_payment` y `shipping_paid` correctamente en `/perfil`
- [ ] Decidir si el teléfono es obligatorio para comprar o solo opcional en el registro (hoy es opcional con opción de omitir OTP)
- [ ] Página de perfil: agregar sección para verificar / actualizar teléfono si el usuario no lo hizo al registrarse

---

## Variables de entorno de este sprint

```
# WhatsApp Business API — Meta Cloud API
WHATSAPP_ACCESS_TOKEN=          # Token de sistema permanente
WHATSAPP_PHONE_NUMBER_ID=       # ID del número en Meta WABA
WHATSAPP_BUSINESS_ACCOUNT_ID=   # ID de la cuenta de negocio
ADMIN_WHATSAPP_PHONE=           # Número de Liz en E.164 (ej. 5218332183399)
```

---

## Archivos tocados en este sprint

### Nuevos
```
docs/delivery/sql-sprint-whatsapp.sql
docs/delivery/sprints/sprint-2.md
lib/notifications/whatsapp-client.ts
lib/notifications/templates.ts
lib/notifications/order-notifications.ts
lib/notifications/phone-verification.ts
lib/validations/phone.ts
lib/validations/shippingQuote.ts
app/api/phone/send-code/route.ts
app/api/phone/verify-code/route.ts
app/api/admin/orders/[id]/shipping-quote/route.ts
```

### Modificados
```
types/index.ts
lib/validations/adminOrders.ts
lib/supabase/adminOrders.ts
app/api/webhooks/mercadopago/route.ts
app/api/admin/orders/[id]/status/route.ts
app/admin/orders/[id]/page.tsx
app/admin/orders/page.tsx
app/(auth)/login/page.tsx
app/perfil/page.tsx
.env.example
docs/delivery/checklist-prelanzamiento.md
docs/delivery/delivery finalll.md
```
