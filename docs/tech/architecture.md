# architecture.md

## Arquitectura actual

### Patrón general
JAMstack — Next.js App Router con Supabase como backend.
El frontend consume Supabase directamente mediante su SDK oficial.
No hay servidor Node separado.

### Estructura de carpetas implementada
```
liz-cabriales/
├── app/
│   ├── (auth)/login/         — login y registro
│   ├── admin/                — panel administrador protegido
│   ├── inspiration/          — galería de inspiración
│   ├── components/
│   │   ├── hero/
│   │   │   └── HeroSlider.tsx
│   │   ├── navbar/
│   │   │   ├── dropdowns/
│   │   │   │   ├── CartMenu.tsx
│   │   │   │   ├── DropdownContainer.tsx
│   │   │   │   ├── MegaMenu.tsx
│   │   │   │   └── SearchMenu.tsx
│   │   │   ├── menuData.ts
│   │   │   └── Navbar.tsx
│   │   ├── AcademyBanner.tsx
│   │   ├── Benefits.tsx
│   │   ├── BrandsSlider.tsx
│   │   ├── FeaturedColors.tsx
│   │   ├── FeaturedKits.tsx
│   │   ├── Footer.tsx
│   │   ├── InspirationGallery.tsx
│   │   ├── PromoCards.tsx
│   │   └── Testimonials.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              — landing page
├── lib/
│   ├── supabase/
│   │   ├── client.ts         — createBrowserClient para Client Components
│   │   └── server.ts         — createServerClient para Server Components
│   └── users.ts              — getUserRole()
├── types/
│   └── index.ts              — tipos de dominio
├── middleware.ts              — protección de rutas por rol
└── docs/                     — vault Obsidian
```

### Supabase
- Cliente server: `lib/supabase/server.ts` — Server Components y API Routes
- Cliente client: `lib/supabase/client.ts` — Client Components
- Credenciales en `.env.local` — nunca en el código

### Autenticación
- Supabase Auth con email/password
- Trigger en DB crea perfil en `public.users` automáticamente al registrarse
- Rol se lee desde `public.users.role`, no desde el token JWT
- Middleware de Next.js protege rutas `/admin/*`, `/perfil/*`, `/checkout/*`

### Protección de rutas
- `/admin/*` — solo `role = 'admin'`, redirige a `/login`
- `/perfil/*` y `/checkout/*` — sesión activa requerida, redirige a `/login`
- Rutas públicas — sin restricción

### Panel admin
- Ruta protegida `/admin` dentro del mismo proyecto
- Verificación de sesión y rol en el cliente al montar
- Acceso solo con `role = 'admin'`

### Landing page
- Orden de secciones en `app/page.tsx`:
  1. Navbar
  2. HeroSlider
  3. BrandsSlider
  4. PromoCards
  5. InspirationGallery (preview)
  6. FeaturedKits
  7. FeaturedColors
  8. AcademyBanner
  9. Testimonials
  10. Benefits
  11. Footer
- Todas las imágenes son placeholders (picsum) — pendiente reemplazar con fotos reales post-reunión con Liz
- Copy real pendiente en todas las secciones

## Decisiones resueltas
- ✅ API Routes de Next.js — no servidor separado
- ✅ Supabase SDK directo — sin ORM
- ✅ Admin en `/admin` dentro del mismo proyecto
- ✅ Middleware de Next.js para protección de rutas
- ✅ Sin caché por ahora — revalidación pendiente de definir