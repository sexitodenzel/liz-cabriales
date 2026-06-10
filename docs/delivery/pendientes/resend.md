# Pendiente: Resend (Emails transaccionales + Auth)

**Bloquea:** confirmaciones de compra, alertas al admin, recordatorios de cita, correos de auth con dominio propio  
**Responsable:** Dev (owner de la cuenta Resend) + Liz (acceso como team member)

> **Cuenta Resend:** la administra el Dev. Liz está agregada como team member con `academializcabriales@gmail.com`.

---

## 1. Dominio custom en Resend (emails de la app)

### Qué hace el Dev (owner de la cuenta)

1. En Resend → **Domains**, agregar el dominio del salón (ej. `lizcabriales.com`).
2. Resend mostrará los registros DNS a agregar.
3. En el proveedor del dominio (GoDaddy, Namecheap, etc.), agregar los registros DNS:
   - `TXT` SPF: `v=spf1 include:amazonses.com ~all`
   - `CNAME` DKIM: el que Resend indique (ej. `resend._domainkey.lizcabriales.com`)
   - `TXT` DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@[dominio]`
4. Esperar propagación DNS (puede tardar hasta 48 h; Resend muestra estado "Verified").
5. En **Resend → API Keys**, generar key de producción.
6. En **Vercel → Environment Variables**, agregar:
   - `RESEND_API_KEY` = la key de producción
   - `ADMIN_EMAIL` = dirección de Liz que recibirá alertas de admin
7. En `lib/email/templates/_shared.ts:26`, cambiar el remitente:
   ```
   "Academia Liz Cabriales <onboarding@resend.dev>"
   → "Academia Liz Cabriales <notificaciones@[dominio-real]>"
   ```
8. Hacer redeploy en Vercel.

---

## 2. Supabase Auth → SMTP con Resend (emails de auth con dominio propio)

Por defecto Supabase envía los emails de auth (`confirmar cuenta`, `reset de contraseña`, `magic link`) desde `noreply@mail.supabase.io`. Para que salgan desde el dominio de Liz:

> **Requisito previo:** el dominio debe estar verificado en Resend (sección 1 completada).

### Qué hace el Dev

1. En **Supabase → Project Settings → Auth → SMTP Provider**, activar "Custom SMTP" con:
   ```
   Host:     smtp.resend.com
   Port:     465
   Username: resend
   Password: [RESEND_API_KEY]   ← la misma key de producción
   From:     noreply@[dominio-real]
   Sender name: Academia Liz Cabriales
   ```
2. Guardar y enviar un email de prueba desde el formulario de Supabase.
3. Confirmar que el email llega y no cae en spam.
4. Opcional: personalizar las plantillas en **Supabase → Auth → Email Templates**:
   - Confirm signup
   - Reset password
   - Magic link
   (Hoy usan los textos genéricos de Supabase en inglés)

---

## Prueba de aceptación

- [ ] Realizar una compra de prueba → email de confirmación llega al cliente.
- [ ] El admin recibe alerta de nueva orden en `ADMIN_EMAIL`.
- [ ] Email muestra remitente del dominio de marca (no `onboarding@resend.dev`).
- [ ] Email no cae en spam.
- [ ] Reset de contraseña → email llega desde el dominio real (no `mail.supabase.io`).
- [ ] Correo de auth no cae en spam.

---

## Referencias

- Sprint 3: `docs/delivery/sprints/sprint-3.md` — detalles técnicos completos
- Checklist pre-lanzamiento → sección Técnico (líneas Resend + Supabase Auth SMTP)
- Owner Checklist sección B (`RESEND_API_KEY`, `ADMIN_EMAIL`)
