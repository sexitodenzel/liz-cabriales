# Liz Cabriales · Design System

Reglas técnicas vivas del frontend. Para notas de branding (logo, fotos, paleta intencional) ver [`docs/ux/design-notes.md`](./ux/design-notes.md).

---

## 1. Tokens base

### Colores

Definidos como CSS vars en `app/globals.css`:

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#faf8f5` | Fondo del sitio público (marfil cálido, no blanco óptico) |
| `--foreground` | `#111111` | Texto principal |
| `--surface` | `#ffffff` | Cards / superficies que resaltan sobre el marfil |
| `--gold` | `#c6a75e` | Acento principal (sitio público) |

**Superficie sutil (panel/card gris sobre fondo blanco):** usar `bg-neutral-100` (Tailwind `#f5f5f5`). Es el gris establecido del sitio — aparece en la card de dirección principal de `/perfil/direcciones` y en el card de "MI CUENTA" del login. **No** usar tonos cálidos beige (`#f8f6f1`, `#f4f1ec`, `#ece8e1`) para este rol: el sitio usa neutral puro, no marfil, en superficies de cuenta.

**Dorado en admin:** las páginas `/admin/**` usan el dorado más saturado `#c9a84c` con hover `#a8893a` (inline en tsx). Mantener este par dentro del panel para coherencia con lo ya construido. No mezclar `--gold` y `#c9a84c` en el mismo componente.

**Neutrales:** Tailwind `neutral-*` scale. Texto secundario suele ser `text-neutral-500/600`, bordes `border-neutral-100/200`.

**Negro chrome:** `#0a0a0a` para barras de admin / footer (`bg-[#0a0a0a]`) y `border-[#2a2a2a]` para sus separadores.

**Semánticos (admin feedback):**

| Significado | Bg | Border | Texto |
|---|---|---|---|
| Success | `bg-emerald-500/10` | `border-emerald-500/30` | `text-emerald-600` |
| Warning | `bg-amber-500/10` | `border-amber-500/30` | `text-amber-700` |
| Error | `bg-red-50` | `border-red-300` | `text-red-700` |
| Info / Loading | `bg-[#c9a84c]/10` | `border-[#c9a84c]/30` | `text-[#a8893a]` |
| Neutral | `bg-white` | `border-neutral-200` | `text-neutral-600` |

### Tipografía

Pendiente de definir con Liz (ver [`design-notes.md`](./ux/design-notes.md)). Por ahora se usa la default de Next/Tailwind. Convenciones de tracking:

- Headers de sección admin: `text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500`
- CTAs pill: `text-[11px]/[12px] font-semibold uppercase tracking-[0.14em]`
- Body: regular sans, `text-sm`/`text-base`, sin tracking custom.

### Border radius

- `rounded-2xl` → cards, paneles de sección
- `rounded-full` → chips, CTAs pill, badges
- `rounded-lg` → inputs, buttons rectangulares chicos
- `rounded` → divisores, helpers

### Sombras

- `shadow-sm` → cards estáticos
- `shadow-lg`/`shadow-2xl` → solo para toasts (overlay flotante)
- No usar sombras de elevación dramática en el cuerpo de la página.

---

## 2. Layout patterns

### Admin

```tsx
<div className="mx-auto max-w-[1100px] px-6 pt-4 pb-6">
  <Breadcrumb ... />
  <header className="mt-2 mb-6">
    <h1 className="text-2xl font-semibold text-neutral-900">Título</h1>
    <p className="mt-1 text-sm text-neutral-500">Subtítulo descriptivo.</p>
  </header>

  <section className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
    <header className="border-b border-neutral-100 px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Sección
      </h2>
    </header>
    {/* contenido */}
  </section>
</div>
```

### Sitio público

- Container: `.site-container` (vars `--site-max-w: 1600px`, `--site-px: clamp(1.5rem, 3vw, 3.5rem)` — respiro lateral estándar que escala con el ancho; 24px móvil → 56px en pantallas anchas)
- Navbar height: `--navbar-actual-h` estática (64px mobile, 104px ≥1200px vía media query en `globals.css`); colapso binario por dirección de scroll (bajar colapsa, subir expande): Navbar.tsx togglea `html.lc-nav-collapsed` y CSS transiciona el transform; clase `.navbar-follow-collapse` en stickies que lo siguen; el hero de home se dimensiona con `--home-hero-inset` (altura colapsada del navbar) para que al colapsar no quede franja blanca abajo
- Footer "telón": altura `--footer-stage-h`

### Auth (login / registrar) — Hermès-style

Ruta group `app/(auth)/` con layout dedicado (bg blanco, logo arriba). Componentes:

- `app/components/auth/FloatingInput.tsx` y `FloatingSelect.tsx` — label flotante (gris que se achica al focus/fill), borde inferior, soporte de error en rojo "Información necesaria" + helper `Formato esperado: …`.
- Card del login: `bg-neutral-100` (ver token de superficie sutil arriba).

**Flujo email-first del login** (`app/(auth)/login/page.tsx`):

1. Step 1: input email único + botón `CONTINUAR`. Vacío/inválido → marca rojo "Información necesaria".
2. POST `/api/auth/check-email` (service role, consulta `public.users.email`).
3. Si existe → email queda `readOnly` (label achicado), aparece campo password.
4. Si no existe → redirect a `/registrar?email=…`.

**Registro con OTP de email** (`app/(auth)/registrar/page.tsx`):

- El correo lo dispara `supabase.auth.signInWithOtp(...)` — quien envía físicamente es Supabase Auth (con Custom SMTP Resend en prod, ver `docs/delivery/pendientes/resend.md` §2).
- **Crítico:** el template **Magic Link** en Supabase Dashboard debe usar `{{ .Token }}` (no `{{ .ConfirmationURL }}`) para que llegue como código de 6 dígitos. Sin ese cambio el form queda roto en prod.
- Al verificar (`verifyOtp({ type: "email" })`) se hace `updateUser({ password, data })` y luego `update users` con `first_name`, `last_name`, `phone`. Tratamiento, fecha de nacimiento y opt-in viven en `auth.users.user_metadata` (no requieren migración).

### Inputs admin

```tsx
<input
  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
/>
```

### Botones admin

```tsx
// Primary
<button className="rounded-full bg-[#c9a84c] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a] disabled:opacity-50">

// Destructive
<button className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
```

---

## 3. Motion primitives

Tokens centralizados en `lib/ease.ts`:

| Token | Valor | Cuándo usar |
|---|---|---|
| `EASE_OUT` | `[0.16, 1, 0.3, 1]` | Entradas estándar, fade-up genérico |
| `EASE_IN_OUT` | `[0.77, 0, 0.175, 1]` | Loops, transiciones bidireccionales |
| `EASE_DRAWER` | `[0.32, 0.72, 0, 1]` | Drawers, paneles laterales |
| `EASE_OUT_CSS` | `cubic-bezier(0.16, 1, 0.3, 1)` | Equivalente CSS de `EASE_OUT` |
| `SPRING_PRESS` | stiffness 500, damping 30 | Botones, press feedback |
| `SPRING_SWAP` | stiffness 460, damping 30 | Cambios de contenido (action-swap) |
| `SPRING_PANEL` | stiffness 420, damping 40 | Paneles que aparecen/colapsan |
| `SPRING_LAYOUT` | stiffness 360, damping 32 | Layout animations (motion `layout`) |
| `SPRING_MOUSE` | stiffness 200, damping 15 | Cursor follow (magnetic) |

Reglas:
- Respetar `useReducedMotion()` siempre (motion lib lo hace si pasamos variantes condicionales).
- Layers GPU explícitos (`transform: translateZ(0)` o `will-change-transform`) en cards animados.
- Cero jank en hero/landing (ver `[[project_home_hero_tri_cards]]`).
- No mezclar `magnetic` + `tilt-card` en el mismo nodo.

---

## 4. Componentes motion (beUI)

Ubicación: `app/components/ui/motion/`. Helpers compartidos en `lib/utils.ts` (`cn`), `lib/ease.ts`, `lib/hooks/use-hover-capable.ts`.

| Componente | Uso |
|---|---|
| `marquee` | Scroll infinito CSS-driven. Requiere `@theme` + `@keyframes marquee` en `globals.css` (ya está). Usado en `ShopByBrands` |
| `magnetic` | Wrapper `inline-block` con spring x/y. NO es un Button, envuelve cualquier hijo. PDP "Agregar al carrito", checkout, CTAs hero |
| `tilt-card` | 3D perspective tilt + glare hover. Imagen de `ProductCard` (grid). Default `rounded-2xl` (override `rounded-none` si la card es flat) |
| `action-swap` | Text/icon swap blur/roll/cascade. Solo `ActionSwapText` + `ActionSwapIcon` (no el Button — depende de tokens shadcn que no existen) |
| `drawer` | Drawer lateral animado |
| `animated-toast-stack` | Stack de toasts animado, posicionable. Mount global en `app/admin/layout.tsx` vía `<ToastViewport />` |
| `animated-badge` | Badge animado con status (loading/success/warning/danger/info/neutral) |

**Regla dura:** **NO** usar tokens shadcn (`bg-primary`, `text-foreground`, `border-border`, `bg-destructive`, etc.). El repo usa colores raw. Si se importa un componente de beUI tal cual, hay que adaptar las clases antes de commitear.

Para añadir más componentes beUI:
```
https://raw.githubusercontent.com/starc007/ui-components/main/components/motion/<slug>.tsx
```
Verificar que sus imports `@/lib/ease`, `@/lib/utils`, `@/lib/hooks/use-hover-capable` ya estén cubiertos.

---

## 5. Notificaciones (toasts)

API singleton en `app/components/ui/motion/toast-provider.tsx`:

```ts
import { toast } from "@/app/components/ui/motion/toast-provider"

toast.success("Curso publicado")
toast.error("No se pudo guardar.", { description: "Intenta de nuevo." })
const id = toast.loading("Subiendo imagen...")
toast.update(id, { status: "success", title: "Imagen subida", duration: 2500 })
toast.dismiss(id)
```

### Cuándo usar
- Tras toda acción CRUD admin (crear, editar, eliminar, publicar, toggle).
- Tras subir / generar / sincronizar algo.
- Errores de red o server (los errores de validación de campo siguen siendo inline).

### Cuándo NO usar
- Validación de form que el usuario puede corregir leyendo el campo (errores inline).
- Confirmaciones previas a una acción destructiva (eso es `window.confirm()` por ahora).
- Estados que se notarán visualmente al instante (un toggle ON/OFF que ya cambió de color).

### Configuración
- **Posición:** `bottom-right` (no choca con `AdminNav` top).
- **Duración default:** 3.5s success / 4.5s error / `0` (manual) para loading.
- **Max visible:** 4 simultáneos. Si llegan más, los viejos hacen scroll-out.
- **Dismiss:** click X o drag horizontal.

### Convención de mensajes (español, imperativo corto)
- Create OK: `"{Entidad} creado"` (ej. "Curso creado")
- Update OK: `"{Entidad} actualizado"` o `"Cambios guardados"`
- Delete OK: `"{Entidad} eliminado"`
- Error genérico: `"No se pudo {acción}. Intenta de nuevo."`
- Error de red: `"Error de red. Verifica tu conexión."`

### Scope
- **Solo admin.** El `<ToastViewport />` se monta en `app/admin/layout.tsx`, NO en `app/layout.tsx`. El storefront público no recibe toasts (puede tener su propio sistema en el futuro para checkout/cart).

---

## 6. Badges (estado inline)

Componente: `<AnimatedBadge>` en `app/components/ui/motion/animated-badge.tsx`.

```tsx
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"

<AnimatedBadge status="loading">Subiendo</AnimatedBadge>
<AnimatedBadge status="success" size="sm">Listo</AnimatedBadge>
<AnimatedBadge status="warning">Pendiente</AnimatedBadge>
<AnimatedBadge status="danger">Bloqueado</AnimatedBadge>
<AnimatedBadge status="info">Borrador</AnimatedBadge>
```

### Cuándo usar
- Estado de un item dentro de listas/forms (uploading, syncing, pending, vendido).
- Reemplazo elegante de spinners "guardando..." en botones largos.
- Contadores de pendientes en nav (citas hoy, órdenes nuevas) — solo si hay endpoint que ya entregue el count.

### Cuándo NO usar
- Acciones top-level — esas son toasts.
- Status que no cambia (un label estático no necesita un badge animado).

### Variantes
- `loading` — pulse + spinner gold
- `success` — emerald check con roll-in
- `warning` — amber triangle
- `danger` — red X
- `info` — gold info
- `neutral` — gris circle (default)

### Sizes
- `sm` — `h-6` (inline en tablas, item lists)
- `md` — `h-8` (default, junto a títulos)

---

## 7. Páginas admin — patrón completo

Cada handler async sigue este patrón:

```tsx
async function handleAction() {
  setBusyId(id) // o setSubmitting(true)
  try {
    const res = await fetch("/api/...", { method: "PATCH", ... })
    const json = await res.json()
    if (!res.ok || json.error) {
      toast.error(json?.error?.message ?? "No se pudo guardar.")
      return
    }
    // update local state...
    toast.success("Cambios guardados.")
  } catch {
    toast.error("Error de red.")
  } finally {
    setBusyId(null)
  }
}
```

Para acciones con upload largo:

```tsx
async function handleUpload(file: File) {
  const id = toast.loading("Subiendo imagen...")
  try {
    await uploadToSupabase(file)
    toast.update(id, { status: "success", title: "Imagen subida", duration: 2500 })
  } catch {
    toast.update(id, { status: "error", title: "Error al subir", duration: 4500 })
  }
}
```

---

## 8. Animaciones premium — guardrails

Memoria viva del equipo. Si trabajas en hero/landing, revisa estos puntos antes de tocar nada:

- **Cero jank visible** en hero/landing. La usuaria no tolera repaints adicionales en zonas de scroll.
- Refactors decisivos > parches incrementales en componentes de motion críticos.
- `HomeHeroTriCards`: cross-fade en texto (nunca `scale`), lock con re-eval, intent threshold, capa GPU explícita.
- No mezclar `magnetic` + `tilt-card` en el mismo nodo (doble transform 3D = jank).
- Respetar `prefers-reduced-motion` en todo componente nuevo.
