---
name: a11y-review
description: Pase de revisión de accesibilidad y multidispositivo para features nuevas o cambios de UI de este sitio. Ejecutar antes de dar por terminada cualquier página/componente público nuevo, o cuando se pida auditar accesibilidad.
---

# Revisión de accesibilidad — Liz Cabriales

Checklist calibrado a este proyecto (Next.js App Router + Tailwind v4, tokens
en `app/globals.css`). Referencia completa: `docs/a11y/audit-2026-07-05.md`.

## 1. Contraste (calcular, no estimar)

Ejecutar la matemática WCAG con node para cada par texto/fondo nuevo:

```js
function lum(h){const c=h.replace('#','');const[r,g,b]=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);const f=v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);return .2126*f(r)+.7152*f(g)+.0722*f(b)}
function ratio(a,b){const[l1,l2]=[lum(a),lum(b)].sort((x,y)=>y-x);return(l1+.05)/(l2+.05)}
```

Reglas del sistema:
- Texto normal ≥ 4.5:1, texto grande (≥24px o ≥18.66px bold) y UI ≥ 3:1.
- `--color-gold` (#8a6d26) es el ÚNICO dorado válido para texto sobre claro.
- `--color-gold-soft` (#c9a84c) SOLO decorativo (hairlines) o sobre fondos oscuros.
- En el footer negro (#0a0a0a): mínimo `neutral-400` para texto pequeño.
- Prohibido reintroducir `#c9a84c`/`#a8862f` hardcodeados como color de texto sobre claro.

## 2. Teclado y foco

- NO quitar el anillo global `:focus-visible` de `globals.css`; no agregar
  `outline-none` sin reemplazo visible.
- Todo overlay (drawer/sheet/modal/lightbox) debe: cerrar con Esc, mover el
  foco al panel al abrir, devolverlo al abrir-dor al cerrar, y llevar
  `inert={!open}` si permanece montado cerrado (patrón: `MobileSortSheet`).
  Preferir el componente `Drawer` (`app/components/ui/motion/drawer.tsx`),
  que ya hace todo esto.
- Elementos clickeables = `<button>`/`<a>`, nunca `div onClick`.
- El skip link (`layout.tsx` → `#main-content`) debe seguir siendo el primer
  elemento enfocable.

## 3. Semántica

- Cada página: exactamente un `<h1>` (sr-only si el diseño no lo muestra) y
  sin saltos de nivel (h1→h3).
- Botón/enlace de solo ícono → `aria-label` en español; toggles → `aria-pressed`.
- Imágenes: `alt` descriptivo (o `alt=""` si es decorativa).
- Formularios: usar `FloatingInput`/`FloatingSelect` (label real +
  `aria-invalid` + `aria-describedby`); errores y toasts en contenedores
  `aria-live`/`role="status"`.
- Nunca bloquear zoom en `viewport` (sin `maximumScale`/`userScalable`).

## 4. Responsive

- Solo `max-w-*` (nunca `w-[Npx]` fijo) en layout público; tablas siempre
  dentro de `overflow-x-auto`.
- Probar mentalmente 390 / 768 / 1440 px; títulos grandes con `clamp()`.
- Elementos posicionados con offsets negativos (`-left-*`, `-right-*`) deben
  quedar dentro del padding de `.site-container` o ocultarse por breakpoint.
- Animaciones: solo `transform`/`opacity`, con variante
  `prefers-reduced-motion` (nunca `scale` en texto).

## 5. Verificación

1. `npm run typecheck` y eslint sobre los archivos tocados.
2. Escanear el HTML SSR de las rutas afectadas con
   el script de `docs/a11y/audit-2026-07-05.md` (imgs sin alt, íconos sin
   label, headings, landmarks) — 0 hallazgos para dar por cerrado.
3. Registrar cualquier riesgo restante en `docs/a11y/`.
