## Estado actual
- Último estado confirmado: Sprint 4 cerrado (citas + cursos completos), typecheck limpio
- Sprint actual: Sprint 5
- Estado de continuidad: Cerrado

## Última tarea cerrada
- Sprint 2 cerrado: enlace `/admin/orders` en dashboard admin ✅
- Sprint 3 cerrado: módulo de citas completo (API, páginas, admin, emails, cron, DB) ✅
- Sprint 4 cerrado: módulo de cursos completo (API, páginas, admin, email, DB) ✅
- Webhook MercadoPago extendido para prefijos `appointment:` y `course:` ✅
- `tsc --noEmit` limpio en todo el proyecto ✅

## Semáforo
- Verde

## Próxima tarea recomendada
- Arrancar Sprint 5: rol recepcionista (`users.role` + middleware)
- Implementar vistas limitadas para recepcionista (solo `/admin/appointments`)
- Construir `/perfil` cliente con historial de pedidos, citas y cursos
- Integrar CFDI en checkout (checkbox, RFC, razón social, % adicional)
- Actualizar nav público, QA móvil general y checklist pre-lanzamiento

## Bloqueadores vigentes
- Credenciales MercadoPago producción — pendiente de Liz
- `CRON_SECRET` en variables de entorno de Vercel (generar con `openssl rand -hex 32`)
- Dirección real del salón pendiente para `SALON_ADDRESS` en `lib/email/templates/_shared.ts`
- Dominio de Resend pendiente de verificación