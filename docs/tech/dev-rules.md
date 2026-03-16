# dev-rules.md

## Stack
- Next.js (App Router)
- TypeScript — obligatorio, no se permite JavaScript
- Supabase SDK directo (no ORM)
- Tailwind CSS para estilos
- Shadcn/ui para componentes base

---

## Estructura de carpetas
```
liz-cabriales-app/
├── app/
│   ├── (public)/          — rutas públicas (landing, shop, cursos, booking)
│   ├── (auth)/            — login, registro
│   ├── (private)/         — rutas que requieren sesión (perfil, checkout)
│   ├── admin/             — panel de administrador
│   └── api/               — API Routes de Next.js
│
├── components/
│   ├── ui/                — componentes base (Shadcn)
│   ├── shared/            — componentes reutilizables globales
│   ├── booking/           — componentes específicos de citas
│   ├── courses/           — componentes específicos de cursos
│   ├── shop/              — componentes específicos de tienda
│   └── admin/             — componentes específicos del admin
│
├── lib/
│   ├── supabase/          — cliente de Supabase (server y client)
│   ├── validations/       — schemas de Zod por módulo
│   └── utils.ts           — utilidades generales
│
├── hooks/                 — custom hooks
├── types/                 — tipos TypeScript globales
├── constants/             — constantes del proyecto
└── public/                — assets estáticos
```

---

## Naming conventions

### Archivos y carpetas
- Componentes: PascalCase — `ProductCard.tsx`
- Hooks: camelCase con prefijo use — `useCart.ts`
- Utils y lib: camelCase — `formatPrice.ts`
- Carpetas: kebab-case — `product-card/`
- API routes: kebab-case — `course-registrations/`

### TypeScript
- Tipos e interfaces: PascalCase — `type OrderStatus`
- Variables y funciones: camelCase — `const getUserOrders`
- Constantes globales: UPPER_SNAKE_CASE — `MAX_APPOINTMENT_PER_USER`
- Enums: PascalCase — `enum PaymentStatus`

---

## Tipos base (types/index.ts)

Todos los tipos del dominio se generan desde el schema de Supabase y se extienden aquí si es necesario. No se definen tipos duplicados.
```typescript
export type UserRole = 'client' | 'admin'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type AppointmentStatus = 'pending' | 'paid' | 'completed' | 'cancelled'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'open'
export type RegistrationStatus = 'pending' | 'paid' | 'cancelled'
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded'
export type PaymentProvider = 'mercadopago' | 'stripe'
export type EntityType = 'order' | 'appointment' | 'course'
export type DeliveryType = 'shipping' | 'pickup'
export type AppointmentType = 'individual' | 'group'
```

---

## Supabase

- Cliente server: `lib/supabase/server.ts` — para Server Components y API Routes
- Cliente client: `lib/supabase/client.ts` — para Client Components
- Nunca usar el cliente server en componentes client ni viceversa
- Todas las queries van en funciones nombradas, no inline en componentes
```typescript
// ✅ correcto
const products = await getProducts()

// ❌ incorrecto
const { data } = await supabase.from('products').select('*')  // directo en componente
```

---

## API Routes

- Todas las rutas viven en `app/api/`
- Siempre retornan `NextResponse.json()`
- Siempre validan con Zod antes de procesar
- Siempre verifican auth cuando la ruta lo requiere
- Estructura de respuesta consistente:
```typescript
// éxito
{ data: T, error: null }

// error
{ data: null, error: { message: string, code?: string } }
```

---

## Validaciones

- Zod para todo — forms, API inputs, respuestas externas
- Un archivo de schema por módulo en `lib/validations/`
- Ejemplo: `lib/validations/booking.ts`, `lib/validations/products.ts`

---

## Autenticación y roles

- Middleware de Next.js protege rutas privadas y de admin
- Rutas `/admin/*` solo accesibles con `role = 'admin'`
- Rutas `/(private)/*` solo accesibles con sesión activa
- El rol se lee desde `users.role` en Supabase, no desde el token

---

## Estilos

- Tailwind CSS — no se escriben estilos en archivos `.css` salvo `globals.css`
- Colores de marca configurados en `tailwind.config.ts`:
  - `brand-gold` — dorado principal
  - `brand-black` — negro principal
- No se usan estilos inline
- Componentes de Shadcn se extienden, no se modifican directamente

---

## Reglas generales

- No se hace `console.log` en producción — usar un logger o eliminarlo
- No se hardcodean precios, textos clave ni URLs — van en `constants/`
- Todo el texto visible al usuario en español
- Imágenes de productos y cursos se almacenan en Supabase Storage
- Variables de entorno en `.env.local`, nunca en el código
- Siempre manejar estados de loading y error en el cliente