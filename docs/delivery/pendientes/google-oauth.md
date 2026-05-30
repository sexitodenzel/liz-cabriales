# Pendiente: Google OAuth (Login con Google)

**Bloquea:** que usuarias externas puedan iniciar sesión con su cuenta Google  
**Responsable:** Liz (Google Cloud + consentimiento) + Dev (Supabase y redirect URIs)

---

## Contexto

El código ya está implementado (`supabase.auth.signInWithOAuth({ provider: "google" })`).  
Lo que falta es que la app OAuth en Google Cloud esté publicada para usuarios externos y apuntando al dominio real.

**Proyecto Google Cloud:** `LizCabrialesStudio` (ID: `lizcabrialessalon`)  
**Client ID:** `355991515654-hi6bil0isugh363eu3lo9meunbav0vdm.apps.googleusercontent.com`

---

## Qué necesita hacer Liz

1. Confirmar acceso al proyecto `LizCabrialesStudio` en [console.cloud.google.com](https://console.cloud.google.com).
2. En **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Completar todos los campos de branding: nombre de app, logo, email de soporte.
   - Agregar el dominio real (ej. `lizcabriales.com`) en "Dominios autorizados".
3. Cambiar el estado de la app de **"Testing"** → **"En producción"** (botón "Publicar app").
   - Esto permite que cualquier cuenta Google inicie sesión, no solo los testers.

---

## Qué hace el Dev

1. En la consola de Google Cloud → **Credenciales → ID de cliente OAuth (Web)**:
   - Agregar en "Orígenes de JavaScript autorizados": `https://[dominio-real]`
   - Agregar en "URIs de redireccionamiento autorizados": `https://[dominio-real]/auth/callback`
2. En **Supabase → Authentication → Providers → Google**:
   - Confirmar que Client ID y Client Secret están configurados.
   - Actualizar Redirect URL si cambió.
3. En **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://[dominio-real]`
   - Redirect URLs: `https://[dominio-real]/auth/callback` (y `http://localhost:3000/auth/callback` para dev)

---

## Prueba de aceptación

- [ ] Desde una cuenta Google externa (no la de Liz ni Dev), hacer clic en "Iniciar sesión con Google".
- [ ] El flujo OAuth completa sin error.
- [ ] El usuario queda autenticado y redirigido correctamente.

---

## Referencias

- RACI sección 3 — Google OAuth
- Owner Checklist sección A (Google Cloud) y C.1
- Checklist pre-lanzamiento → Técnico (líneas Google OAuth, Supabase Auth URLs)
- delivery-launch-plan.md §5 (OAuth step-by-step)
