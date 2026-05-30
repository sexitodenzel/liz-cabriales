# Matriz RACI — Go-Live Liz Cabriales
Fecha objetivo de salida: ____ / ____ / 2026

## Roles
- **LIZ** = Dueña del negocio / propietaria de cuentas
- **DEV** = Tú / equipo técnico implementador
- **OPS** = Soporte operativo (si aplica: contadora, marketing, asistente)

> R = Responsible (ejecuta)  
> A = Accountable (aprueba / dueño final)  
> C = Consulted (consultado)  
> I = Informed (informado)

---

## 1) Infraestructura, dominio y despliegue

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Pago/plan de Vercel activo | A/R | I | I | Billing activo |
| Proyecto Vercel con Liz como owner/admin | A/R | C | I | Captura members/roles |
| Compra/renovación del dominio | A/R | I | C | Factura/renovación vigente |
| Configuración DNS dominio → Vercel | A | R | C | Dominio "Valid" en Vercel |
| `NEXT_PUBLIC_APP_URL` al dominio real | A | R | I | Env var actualizada + redeploy |
| Verificación final de URL producción | A | R | I | Sitio en dominio real |

---

## 2) Supabase (DB/Auth/Storage)

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Plan y facturación Supabase | A/R | I | I | Billing activo |
| Acceso owner/admin de Liz | A/R | C | I | Roles en proyecto |
| Ejecutar SQL manual `sql-sprint5-supabase.sql` | A | R | I | Script ejecutado sin error |
| Configurar Auth Site URL/Redirect URLs | A | R | I | Pantalla URL Configuration |
| Confirmar bucket `images` + políticas de acceso | A | R | I | Upload exitoso en admin |

---

## 3) Google OAuth (login con Google)

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Proyecto Google Cloud bajo control de Liz | A/R | C | I | Acceso de Liz confirmado |
| Agregar dominio real a orígenes autorizados | A | R | I | Config guardada |
| Agregar redirect frontend `/auth/callback` | A | R | I | URI autorizada |
| Completar branding/consent screen | A/R | C | I | Campos completos |
| Publicar app OAuth (no testing) | A/R | C | I | Estado "In production" |
| Prueba login Google con cuenta externa | A | R | I | Evidencia de login ok |

---

## 4) MercadoPago (cobros)

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Cuenta MP negocio activa/validada | A/R | I | I | Cuenta activa |
| Entregar token PROD + webhook secret | A/R | C | I | Credenciales cargadas |
| Cargar `MERCADOPAGO_ACCESS_TOKEN` PROD | A | R | I | Env var en Vercel |
| Cargar `MERCADOPAGO_WEBHOOK_SECRET` | A | R | I | Env var en Vercel |
| Registrar webhook en panel MP | A | R | I | URL guardada |
| Prueba E2E pago + webhook + estado pagado | A | R | I | Orden/cita en paid |

---

## 5) Resend (emails transaccionales)

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Cuenta/plan de Resend de Liz | A/R | I | I | Billing activo |
| Verificar dominio de envío | A/R | C | I | Dominio "Verified" |
| Configurar SPF/DKIM/DMARC en DNS | A | R | C | DNS propagado |
| Cargar `RESEND_API_KEY` en Vercel | A | R | I | Env var activa |
| Cambiar remitente sandbox a dominio real | A | R | I | Email "From" de marca |
| Prueba de entrega de correos | A | R | I | Correo recibido |

---

## 6) Instagram / Meta

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Acceso de Liz a Instagram/Meta Developers | A/R | C | I | Acceso confirmado |
| Obtener token long-lived inicial | A/R | C | I | Token válido |
| Cargar fallback `INSTAGRAM_ACCESS_TOKEN` (si aplica) | A | R | I | Env var lista |
| Validar cron de renovación token | A | R | I | Cron responde OK |
| Ver feed real en home | A | R | I | Publicaciones visibles |

---

## 7) Operación y contenido

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Definir datos finales (dirección, WhatsApp, redes) | A/R | C | I | Datos publicados |
| Confirmar políticas comerciales (cambios/reembolsos) | A/R | C | C | Documento validado |
| Confirmar porcentaje CFDI con contadora | A | C | R | % definido |
| Cargar catálogo/fotos reales | A | R | C | Catálogo final |
| Aprobar diseño final en staging/producción | A/R | C | I | Aprobación firmada |

---

## 8) Seguridad y continuidad

| Actividad | LIZ | DEV | OPS | Evidencia de cierre |
|---|---|---|---|---|
| Rotación de secretos expuestos | A | R | I | Nuevas keys activas |
| Inventario de secretos por plataforma | A | R | I | Checklist firmado |
| Respaldo de accesos owner (2FA y recovery) | A/R | C | I | 2FA activo |
| Entrega de manual operativo y video | A | R | I | Entregables recibidos |

---

## Gate final de lanzamiento (obligatorio)

- [ ] Dominio real funcionando con SSL
- [ ] Login Google operativo para usuarias externas
- [ ] Pago real/QA en MercadoPago confirmado
- [ ] Webhook actualiza estados correctamente
- [ ] Emails transaccionales entregando correctamente
- [ ] Feed de Instagram visible y estable
- [ ] Liz puede operar sin apoyo técnico continuo

**Firma DEV:** ______________________   **Fecha:** __________  
**Firma LIZ:** ______________________   **Fecha:** __________
