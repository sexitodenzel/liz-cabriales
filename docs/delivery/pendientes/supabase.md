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

### 1. SQL — YA CORRIDOS (verificado en la BD 2026-08-12)

Todos los scripts pendientes ya se corrieron; sus columnas/tablas existen en Supabase.
Ver el índice completo en `docs/delivery/sql/README.md`. En particular:

- `sql-sprint5-supabase.sql` — CFDI + `handle_new_user`. ✓ (`orders.requires_invoice`, `orders.rfc`)
- `sql-sprint-whatsapp.sql` — teléfono en `users`, TUA en `orders`, `notification_log`. ✓
- `sql-local-delivery.sql`, `sql-instructor-title.sql`, `sql-course-instructors.sql`,
  `sql-course-highlights.sql`, `sql-course-event-type.sql`, `sql-course-short-description.sql`. ✓

> SQL sin correr: `sql-nail-art-view-cleanup.sql` (cierra una alerta de seguridad, sin prisa) y
> `sql-before-after.sql` (sección "Antes y Después" del home, junto a Nail Art — tablas
> `before_after_items` y `before_after_settings`; sin correr, la sección no aparece porque no
> hay items). Panel de carga en `/admin/antes-despues`. Liz aún no tiene fotos reales de
> antes/después de quiropodia — solo 2 fotos genéricas en el Drive del estudio, sin par
> antes/después — así que la sección queda vacía hasta que suba pares reales.

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
