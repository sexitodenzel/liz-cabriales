# Pendiente: Supabase (Base de datos, Auth, Storage)

**Bloquea:** funcionamiento de toda la aplicación en producción  
**Responsable:** Liz (plan y ownership) + Dev (SQL, Auth URLs, Storage)

---

## Qué necesita hacer Liz

1. Confirmar que el **plan de Supabase** está activo y pagado (Free tier tiene límites que pueden afectar producción).
2. Ser **owner/admin** del proyecto Supabase (`qlvslouwkiemsjkggdqq`).
3. Dar acceso al Dev para ejecutar los SQL pendientes (o ejecutarlos ella misma si prefiere).

---

## Qué hace el Dev

### 1. SQL pendientes de ejecutar

En **Supabase → SQL Editor**, ejecutar en orden:

**A) `docs/delivery/sql-sprint5-supabase.sql`**  
Contiene: rol recepcionista, campos CFDI, función `handle_new_user`.  
> Aún no ejecutado — crítico para funcionamiento de auth y roles.

**B) `docs/delivery/sql-sprint-whatsapp.sql`**  
Contiene: campo teléfono en `users`, campos TUA en `orders`, tabla `notification_log`.  
> Aún no ejecutado — requerido para WhatsApp Business.

> `sql-course-display-settings.sql` ya fue ejecutado el 2026-05-18. ✓

### 2. Auth URL Configuration

En **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://[dominio-real]`
- **Redirect URLs** (agregar ambas):
  - `https://[dominio-real]/auth/callback`
  - `http://localhost:3000/auth/callback`

### 3. SMTP custom para emails de auth (dominio propio)

Por defecto los emails de auth salen desde `noreply@mail.supabase.io`. Para que salgan desde el dominio de Liz con Resend:

> **Requisito previo:** dominio verificado en Resend (`docs/delivery/pendientes/resend.md` §1).

En **Supabase → Project Settings → Auth → SMTP Provider**, activar "Custom SMTP":
```
Host:        smtp.resend.com
Port:        465
Username:    resend
Password:    [RESEND_API_KEY]
From:        noreply@[dominio-real]
Sender name: Academia Liz Cabriales
```

Ver instrucciones detalladas y prueba de aceptación en `docs/delivery/pendientes/resend.md` §2.

### 3. Storage — bucket `images`

En **Supabase → Storage**:
- Confirmar que el bucket `images` existe.
- Verificar políticas de acceso: lectura pública, escritura solo para usuarios autenticados con rol admin.
- Hacer un upload de prueba desde el panel de admin del sitio.

---

## Prueba de aceptación

- [ ] Login con Google completa sin error de redirect.
- [ ] SQL ejecutado sin errores (confirmar en SQL Editor).
- [ ] Upload de imagen de producto desde admin funciona.
- [ ] Usuarios nuevos se crean correctamente en la tabla `users` (función `handle_new_user` activa).
- [ ] Email de reset de contraseña llega desde dominio real (no `mail.supabase.io`) — requiere SMTP configurado.

---

## Referencias

- RACI sección 2 — Supabase
- Owner Checklist sección A (Supabase), B (`SUPABASE_SERVICE_ROLE_KEY`) y C.5
- Checklist pre-lanzamiento → Técnico (SQL ejecutado, Supabase Auth URLs, bucket `images`)
