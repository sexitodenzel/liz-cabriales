# Sprint 3 — Email completo: notificaciones admin, cancelaciones y dominio propio

**Rama:** `master`  
**Fecha:** 2026-06-09  
**Objetivo:** Completar el sistema de notificaciones por email — el admin nunca recibía emails, la cancelación de citas no enviaba nada, y todos los emails salían del dominio sandbox de Resend (`onboarding@resend.dev`) en lugar del dominio real de la academia.

---

## Contexto

La infraestructura de Resend ya existía (~80% completa): 7 templates de cliente funcionando, Resend SDK instalado, `_shared.ts` con el singleton y helpers. Lo que faltaba:

1. El admin no recibe ningún email (solo WhatsApp para órdenes, nada para citas y cursos)
2. La cancelación de citas no envía ningún email ni al cliente ni al admin
3. `EMAIL_FROM = "onboarding@resend.dev"` — dominio sandbox; los clientes reales no reciben nada en producción hasta que se configure el dominio custom

---

## Cambios en código (Dev)

### Archivos nuevos

| Archivo | Función |
|---------|---------|
| `lib/email/admin.ts` | Todas las notificaciones de admin: nueva orden, nueva cita, nueva inscripción, cancelación de cita por cliente |
| `lib/email/templates/appointment-cancelled.ts` | Email al cliente cuando se cancela su cita (por él mismo o por el salón) |
| `lib/email/templates/payment-failed.ts` | Email al cliente cuando MP rechaza el pago de una cita o curso |
| `lib/email/templates/order-shipped.ts` | Email al cliente cuando el admin marca la orden como enviada |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/email/resend.ts` | Eliminar instancias duplicadas de `new Resend()` y `createClient()`; usar `getResend()` y `getSupabaseAdmin()` de `_shared.ts` |
| `lib/email/templates/_shared.ts` | Exportar `ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""` |
| `app/api/webhooks/mercadopago/route.ts` | Agregar email admin tras cada pago aprobado; agregar email de pago fallido al cliente en ramas `rejected/cancelled` |
| `app/api/appointments/[id]/cancel/route.ts` | Enviar `sendAppointmentCancelledByClientEmail` tras cancelación exitosa |
| `app/api/admin/appointments/[id]/cancel/route.ts` | Enviar `sendAppointmentCancelledByAdminEmail` tras cancelación exitosa |
| `app/api/admin/orders/[id]/status/route.ts` | Enviar `sendOrderShippedEmail` cuando estado cambia a `shipped` (además del WhatsApp existente) |
| `.env.example` | Agregar `ADMIN_EMAIL` |

---

## Eventos cubiertos

### Solicitados

| Evento | Cliente | Admin |
|--------|---------|-------|
| Orden confirmada (MP aprobado) | ✅ ya existía | ✅ nuevo |
| Cita reservada (MP aprobado) | ✅ ya existía | ✅ nuevo |
| Inscripción a curso (MP aprobado) | ✅ ya existía | ✅ nuevo |
| Cita cancelada por cliente | ✅ nuevo | ✅ nuevo |
| Cita cancelada por admin | ✅ nuevo | n/a |

### Adicionales agregados

| Evento | Justificación |
|--------|--------------|
| Pago rechazado/cancelado (cita o curso) | El cliente quedaba sin feedback cuando MP rechazaba el pago |
| Orden enviada → email al cliente | Solo se enviaba WhatsApp; el email es comprobante permanente |

---

## Pendientes operativos — ejecutar antes de go-live

Estos ítems **no son código** — son configuración que debe hacerse en los dashboards de Resend y Supabase.

### Resend: dominio custom

- [ ] Liz: agregar el dominio real en **Resend → Domains** (ej. `lizcabriales.com`)
- [ ] Resend mostrará registros DNS (SPF, DKIM, DMARC) — pasarlos a Dev
- [ ] Dev: agregar registros DNS en el proveedor del dominio (GoDaddy / Namecheap / etc.):
  - `TXT` SPF: `v=spf1 include:amazonses.com ~all`
  - `CNAME` DKIM: el que Resend indique
  - `TXT` DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@[dominio]`
- [ ] Esperar propagación DNS (hasta 48 h) — Resend mostrará estado "Verified"
- [ ] Dev: actualizar `EMAIL_FROM` en `lib/email/templates/_shared.ts:26`:
  ```
  "Academia Liz Cabriales <onboarding@resend.dev>"
  → "Academia Liz Cabriales <notificaciones@[dominio-real]>"
  ```
- [ ] Hacer redeploy en Vercel

### Resend → Supabase Auth (emails de auth con dominio propio)

Por defecto Supabase envía los emails de `confirmar cuenta`, `reset de contraseña` y `magic link` desde `noreply@mail.supabase.io`. Para que salgan desde el dominio de Liz:

- [ ] Dev: en **Supabase → Project Settings → Auth → SMTP Provider**, activar "Custom SMTP" con:
  ```
  Host:     smtp.resend.com
  Port:     465
  Username: resend
  Password: [RESEND_API_KEY]
  From:     noreply@[dominio-real]
  ```
  > Requiere que el dominio ya esté verificado en Resend
- [ ] Confirmar que los emails de auth llegan y no caen en spam
- [ ] Opcional: personalizar templates en **Supabase → Auth → Email Templates** (confirmar cuenta, reset contraseña)

---

## Variables de entorno de este sprint

```
# Email — admin
ADMIN_EMAIL=liz@[dominio-real]   # Dirección que recibe alertas de admin
```

> `RESEND_API_KEY` ya estaba documentado desde Sprint 1.

---

## Pruebas de aceptación

- [ ] Pago aprobado (orden) → cliente recibe confirmación + admin recibe alerta
- [ ] Pago aprobado (cita) → cliente recibe confirmación + admin recibe alerta
- [ ] Pago aprobado (inscripción) → cliente recibe confirmación + admin recibe alerta
- [ ] Pago rechazado (cita o curso) → cliente recibe email de "pago no procesado"
- [ ] Cliente cancela cita → cliente recibe confirmación + admin recibe alerta
- [ ] Admin cancela cita → cliente recibe aviso
- [ ] Admin marca orden como "enviada" → cliente recibe email además del WhatsApp
- [ ] Todos los emails salen desde `@[dominio-real]`, no desde `onboarding@resend.dev`
- [ ] Email de reset de contraseña (Supabase) sale desde dominio real
- [ ] Ningún email cae en spam

---

## Archivos tocados en este sprint

### Nuevos
```
docs/delivery/sprints/sprint-3.md
lib/email/admin.ts
lib/email/templates/appointment-cancelled.ts
lib/email/templates/payment-failed.ts
lib/email/templates/order-shipped.ts
```

### Modificados
```
lib/email/resend.ts
lib/email/templates/_shared.ts
app/api/webhooks/mercadopago/route.ts
app/api/appointments/[id]/cancel/route.ts
app/api/admin/appointments/[id]/cancel/route.ts
app/api/admin/orders/[id]/status/route.ts
.env.example
docs/delivery/checklist-prelanzamiento.md
docs/delivery/pendientes/resend.md
docs/delivery/pendientes/supabase.md
```
