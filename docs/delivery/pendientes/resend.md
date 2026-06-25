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

Por defecto Supabase envía los emails de auth (`confirmar cuenta`, `reset de contraseña`, `magic link`) desde `noreply@mail.supabase.io` con **rate limit ~2 emails/hora** (no apto para prod). Para que salgan desde el dominio de Liz y sin rate limit:

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
4. **Obligatorio para el registro `/registrar`:** personalizar el template **Magic Link** en **Supabase → Auth → Email Templates**.

   El flujo de registro (`app/(auth)/registrar/page.tsx`) llama `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` y espera que el usuario tipee un **código de 6 dígitos** en el form. Supabase por default manda un **link**, no un código — hay que editar el template **Magic Link** para que use `{{ .Token }}`:

   ```html
   <h2>Tu código de verificación</h2>
   <p>Hola,</p>
   <p>Para completar tu registro en Liz Cabriales, ingresa este código en la página:</p>
   <p style="font-size:24px;letter-spacing:0.3em;font-weight:600;">{{ .Token }}</p>
   <p>El código expira en 1 hora.</p>
   ```

   Sin este cambio, `/registrar` queda roto (el usuario recibe un link inútil y nunca puede teclear el código).
5. Opcional: personalizar también:
   - **Confirm signup** — `{{ .ConfirmationURL }}` queda como link de confirmación tradicional.
   - **Reset password** — idem.

### Prueba de aceptación específica del registro

- [ ] Custom SMTP guardado y verificado con el botón de Supabase.
- [ ] Template **Magic Link** contiene literalmente la cadena `{{ .Token }}` (no `{{ .ConfirmationURL }}`).
- [ ] Flujo end-to-end: ir a `/registrar`, meter email, click "ENVIAR EL CÓDIGO", recibir email con 6 dígitos visibles en el body, teclearlos en el form, completar registro → redirect a `/`.
- [ ] El correo llega desde `noreply@[dominio-real]`, no `mail.supabase.io`.

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
