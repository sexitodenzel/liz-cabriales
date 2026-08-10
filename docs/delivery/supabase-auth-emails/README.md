# Correos de Supabase Auth — plantillas de marca

Los correos de **auth** (código de registro, restablecer contraseña) NO salen de
`lib/email/templates/*`: los manda Supabase con sus propias plantillas, editables
solo desde el panel. Por eso viven aquí, versionadas — si alguien las borra o
Supabase resetea el proyecto, se vuelven a pegar desde estos archivos.

Usan el mismo sistema visual que `lib/email/templates/_shared.ts`:

| Token | Valor |
|---|---|
| Fondo de página | `#f5f5f5` |
| Tarjeta | `#ffffff`, borde `#ececec`, radio 18px, máx. 560px |
| Dorado (cejilla y enlaces) | `#c6a75e` |
| Negro (píldora y botón) | `#0a0a0a` |
| Texto / suave / apagado | `#1a1a1a` / `#6b6b6b` / `#9a9a9a` |
| Tipografía | stack de sistema Apple (San Francisco → Segoe UI → Arial) |

## Dónde se pega cada uno

Panel: **Authentication → Emails → (plantilla) → pestaña `Source`**

Son las **6** plantillas de la sección Authentication. Están todas para que ninguna
pueda llegarle a un cliente en HTML pelón.

| Archivo | Plantilla en Supabase | ¿Lo usa el sitio? |
|---|---|---|
| `magic-link-or-otp.html` | Magic link or OTP | **Sí** — `/registrar`, el código de 6 dígitos |
| `reset-password.html` | Reset password | **Sí** — `/forgot-password`, y los clientes que crea el admin (entran por "olvidé mi contraseña") |
| `reauthentication.html` | Reauthentication | Solo si "Secure password change" está activo en Supabase |
| `confirm-signup.html` | Confirm sign up | Solo si se activa la confirmación por correo |
| `change-email.html` | Change email address | Al cambiar el correo desde la cuenta |
| `invite-user.html` | Invite user | El código no invita a nadie; solo si se invita a mano desde el panel |

La sección **Security** del panel (Password changed, Email address changed, MFA…)
se deja **apagada**: el sitio ya manda su propio correo de contraseña cambiada
desde `lib/email/templates/password-reset-success.ts`. Prenderlas duplicaría.

Pegar en **Source** (no en Preview) y darle **Save changes**.

## Reglas al editar

- `magic-link-or-otp.html` **tiene que** conservar `{{ .Token }}`. Si se cambia por
  `{{ .ConfirmationURL }}`, el usuario recibe un enlace y `/registrar` queda roto:
  el formulario pide teclear 6 dígitos.
- Los demás usan `{{ .ConfirmationURL }}`.
- Todo el CSS va **en línea**. Nada de `<style>`, hojas externas ni imágenes
  remotas: Gmail y Outlook las tiran.
- Al cambiar un color aquí, cambiarlo también en `lib/email/templates/_shared.ts`
  para que los dos mundos no se separen otra vez.
