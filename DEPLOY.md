# Liz Cabriales — Deploy en Vercel

## Resumen
Proyecto Next.js 14 + TypeScript + Supabase + MercadoPago + Resend

## Prerequisitos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub/GitLab/Bitbucket conectado a Vercel
- Credenciales de Supabase, MercadoPago y Resend

## Pasos para Deploy

### 1. Conectar repositorio a Vercel
1. Ve a [vercel.com/new](https://vercel.com/new)
2. Selecciona tu repositorio (GitHub/GitLab/Bitbucket)
3. Vercel detectará automáticamente que es un proyecto Next.js
4. Haz clic en "Deploy"

### 2. Configurar variables de entorno
Después del deployment inicial (que fallará porque faltan las variables):

1. Ve a tu proyecto en Vercel → Settings → Environment Variables
2. Agrega todas las variables del archivo `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-from-supabase]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-from-supabase]
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx (sandbox) o PROD-xxxx (producción)
MERCADOPAGO_WEBHOOK_SECRET=Tu_webhook_secret_de_MP
NEXT_PUBLIC_APP_URL=https://[tu-proyecto].vercel.app
RESEND_API_KEY=re_xxxxx
```

3. Guarda los cambios

### 3. Redeploy
1. Ve a Deployments
2. Haz clic en el último deployment fallido
3. Haz clic en "Redeploy" o simplemente realiza un push a tu rama main

### 4. Configurar webhook de MercadoPago
Una vez que tengas una URL pública en Vercel:

1. Ve a [panel.mercadopago.com/settings/applications](https://panel.mercadopago.com/settings/applications)
2. En "Notificaciones" → "Agregar URL de notificación"
3. URL: `https://[tu-proyecto].vercel.app/api/webhooks/mercadopago`
4. Tipo: "Datos de pago recibido"
5. Guarda

### 5. Verificar Resend
Si usas el dominio `onboarding@resend.dev`:
- Funciona solo para testing
- Al verificar un dominio propio en Resend, cambia la variable `from` en `lib/email/resend.ts`

### 6. Configurar Google Login (Supabase OAuth)
1. Ve a Supabase → **Authentication** → **Providers** → **Google** y habilítalo.
2. Crea credenciales OAuth en Google Cloud (tipo Web application).
3. En Google Cloud, agrega como Authorized redirect URI:
   - `https://[project-id].supabase.co/auth/v1/callback`
4. Copia el **Client ID** y **Client Secret** en el provider de Google en Supabase.
5. En Supabase → Authentication → URL Configuration:
   - Site URL: `https://[tu-proyecto].vercel.app`
   - Additional Redirect URLs:
     - `https://[tu-proyecto].vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (desarrollo)
6. Ejecuta el SQL actualizado en `docs/delivery/sql-sprint5-supabase.sql` para asegurar creación de perfil `public.users` para OAuth (rol default `client`).

## Variables de Entorno — Referencia Completa

| Variable | Público | Descripción | Donde obtener |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL de tu proyecto Supabase | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave anónima de Supabase | Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Clave service role (backend) | Supabase Settings → API |
| `MERCADOPAGO_ACCESS_TOKEN` | ❌ | Token de acceso a MP | MercadoPago Developers → Credentials |
| `MERCADOPAGO_WEBHOOK_SECRET` | ❌ | Secret para validar webhooks | MercadoPago Developers → Webhooks |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL base de la app | Tu dominio Vercel o propio |
| `RESEND_API_KEY` | ❌ | API key de Resend | Resend → API Keys |
| `GOOGLE_CLIENT_ID`* | ❌ | Client ID OAuth de Google | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`* | ❌ | Client Secret OAuth de Google | Google Cloud Console |

\* Si usas Supabase Cloud estándar, estas credenciales se configuran en el dashboard de Supabase (provider Google) y no son necesarias como variables de entorno en Vercel.

## Verificación Pre-Deploy

```bash
# Build local
npm run build

# Si el build pasa, estás listo ✓
```

## Troubleshooting

### Error: "Build failed"
- Verifica que `npm run build` funciona en local
- Revisa los logs en Vercel → Deployments → [id] → Logs

### Error: "WebhookError from MercadoPago"
- Confirma que `MERCADOPAGO_WEBHOOK_SECRET` es correcto
- La URL debe ser pública (no localhost)

### Error: "Email not sent"
- Verifica que `RESEND_API_KEY` es válido
- Si usas `onboarding@resend.dev`, verifica que el email de destino está en tu lista blanca de Resend

## Soporte
- Documentación oficial: [vercel.com/docs](https://vercel.com/docs)
- Next.js: [nextjs.org](https://nextjs.org)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
