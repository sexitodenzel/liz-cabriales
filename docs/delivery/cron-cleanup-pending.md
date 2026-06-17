# Cron de limpieza: órdenes, citas e inscripciones abandonadas

## Qué hace

Cancela automáticamente cualquier entidad que lleve demasiado tiempo en
estado `pending` (usuario abrió MercadoPago pero nunca completó el pago):

- **Órdenes** abandonadas por más de `CLEANUP_ORDERS_HOURS` horas (default 2)
- **Citas** abandonadas por más de `CLEANUP_APPOINTMENTS_HOURS` horas (default 1)
- **Inscripciones** abandonadas por más de `CLEANUP_REGISTRATIONS_HOURS` horas (default 2)

Las citas usan un ventana más corta porque reservan slots de tiempo y
queremos liberarlos rápido para que otros usuarios puedan reservar.

## Endpoint

```
GET /api/cron/cleanup-pending
```

Requiere autenticación con header `Authorization: Bearer <CRON_SECRET>` o
query param `?secret=<CRON_SECRET>`.

Respuesta:
```json
{
  "ok": true,
  "cancelled": {
    "orders": 3,
    "appointments": 1,
    "registrations": 0
  },
  "thresholds": {
    "orders_hours": 2,
    "appointments_hours": 1,
    "registrations_hours": 2
  },
  "errors": [],
  "ran_at": "2026-06-17T15:30:00.000Z"
}
```

## Configuración en Vercel (recomendado)

Ya está agregado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-pending",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Esto corre cada 30 minutos. Vercel agrega automáticamente el header
`Authorization: Bearer <CRON_SECRET>` si la variable está definida en el
proyecto. Configura `CRON_SECRET` en **Project Settings → Environment Variables**.

## Configuración con cron-job.org u otro servicio externo

1. Crea un cron-job que llame a:
   ```
   https://tu-sitio.com/api/cron/cleanup-pending?secret=TU_SECRET
   ```
2. Frecuencia recomendada: cada 30 minutos
3. Tipo de request: GET

## Configuración con pg_cron en Supabase (alternativa)

Si prefieres no usar un cron externo, puedes hacerlo directo en Supabase:

```sql
-- Habilitar extensión (una sola vez)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cancelar órdenes pendientes > 2 horas (cada 30 min)
SELECT cron.schedule(
  'cleanup-pending-orders',
  '*/30 * * * *',
  $$
    UPDATE orders
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '2 hours';
  $$
);

-- Cancelar citas pendientes > 1 hora
SELECT cron.schedule(
  'cleanup-pending-appointments',
  '*/30 * * * *',
  $$
    UPDATE appointments
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '1 hour';
  $$
);

-- Cancelar inscripciones pendientes > 2 horas
SELECT cron.schedule(
  'cleanup-pending-registrations',
  '*/30 * * * *',
  $$
    UPDATE course_registrations
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '2 hours';
  $$
);

-- Para ver los jobs activos:
SELECT * FROM cron.job;

-- Para desactivar un job:
SELECT cron.unschedule('cleanup-pending-orders');
```

## Variables de entorno

Agregar a `.env.local` y a las variables de producción:

```bash
# Obligatorio en producción
CRON_SECRET=<genera un string aleatorio largo>

# Opcionales (defaults: 2 / 1 / 2 horas)
CLEANUP_ORDERS_HOURS=2
CLEANUP_APPOINTMENTS_HOURS=1
CLEANUP_REGISTRATIONS_HOURS=2
```

Para generar un secret seguro:
```bash
openssl rand -base64 32
```

## Test manual

En dev (sin CRON_SECRET configurado, permite la llamada):
```bash
curl http://localhost:3000/api/cron/cleanup-pending
```

En prod o con secret:
```bash
curl https://tu-sitio.com/api/cron/cleanup-pending \
  -H "Authorization: Bearer TU_SECRET"
```

## Interacción con el trigger de stock

El trigger `restore_stock_on_cancel` (ver `sql-restore-stock-on-cancel.sql`)
solo restaura stock cuando la orden transiciona de `paid`/`shipped`/etc a
`cancelled`. Cancelar una orden `pending` desde el cron **no** afecta el
stock porque nunca fue descontado (el descuento solo pasa en el webhook
al confirmar pago aprobado).
