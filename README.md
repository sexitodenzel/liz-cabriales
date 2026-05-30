# Liz Cabriales — Plataforma de Servicios

Plataforma e-commerce + reservas + academia para salón de cosmetología. Construida con Next.js 16, React 19, Supabase y Mercado Pago.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4
- **Base de datos / Auth:** Supabase
- **Pagos:** Mercado Pago
- **Email:** Resend
- **Notificaciones:** WhatsApp (Meta Cloud API)

## Módulos

| Módulo | Rutas |
|---|---|
| Tienda | `/tienda`, `/tienda/[slug]`, `/carrito`, `/checkout`, `/orden/[id]` |
| Citas | `/citas`, `/cita/[id]` |
| Academia | `/academia`, `/academia/[id]`, `/cursos`, `/cursos/[id]` |
| Perfil | `/perfil` |
| Admin | `/admin` |

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Llenar variables en .env.local
npm run dev
```

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run lint       # ESLint
npm run lint:fix   # ESLint con auto-fix
npm run typecheck  # TypeScript check
```

## Documentación

Ver `docs/` para contexto de negocio, delivery y decisiones técnicas.
- `docs/ai-context.md` — contexto fundacional y stack
- `docs/ai-workflow-kit.md` — flujo operativo
- `docs/tech/` — arquitectura, API, seguridad, base de datos
- `DEPLOY.md` — guía de deployment en Vercel
