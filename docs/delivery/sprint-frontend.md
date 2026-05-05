# Sprint Frontend — Rewrite Landing

> Rama: `frontend-rewrite`
> Objetivo: Reescribir todos los componentes visuales de la landing
> desde cero con código limpio y comprensible.
> El backend, admin y rutas NO se tocan.

---

## Reglas de este sprint

- Solo se modifica `app/page.tsx` y `app/components/`
- Cada componente se construye con datos hardcodeados primero
- Luego se conecta a Supabase
- Un componente a la vez — no se avanza sin que el anterior funcione

---

## Componentes a reescribir

| Componente | Archivo actual | Estado |
|---|---|---|
| Navbar | `app/components/navbar/` | ⏳ Pendiente |
| Hero | `app/components/hero/` | ⏳ Pendiente |
| Brands strip | `app/components/BrandsSlider.tsx` | ⏳ Pendiente |
| 3 Pilares | nuevo | ⏳ Pendiente |
| Productos destacados | `app/components/FeaturedKits.tsx` | ⏳ Pendiente |
| Sección colores OPI | `app/components/FeaturedColors.tsx` | ⏳ Pendiente |
| Próximos cursos | nuevo | ⏳ Pendiente |
| Feed academia | `app/components/InspirationGallery.tsx` | ⏳ Pendiente |
| Testimonios | `app/components/Testimonials.tsx` | ⏳ Pendiente |
| Beneficios | `app/components/Benefits.tsx` | ⏳ Pendiente |
| Footer | `app/components/Footer.tsx` | ⏳ Pendiente |

---

## Design system

- Dorado: `#C9A84C`
- Negro: `#111111`
- Off-white: `#FAF9F6`
- Fuente headings: Playfair Display
- Fuente body: Inter
- Configurados en `tailwind.config.ts`

---

## Orden de ataque

1. Navbar
2. Hero
3. Brands strip
4. 3 Pilares
5. Productos destacados
6. Sección colores
7. Cursos
8. Feed academia
9. Testimonios
10. Beneficios + Footer

---

## Prompt de arranque para Claude Code

Pegar esto al inicio de cada sesión:

\```
Lee estos archivos antes de cualquier cosa:
- docs/ai-context.md
- docs/delivery/sprint-frontend.md

Estamos en la rama `frontend-rewrite`.
Solo tocamos `app/page.tsx` y `app/components/`.
No toques backend, admin ni rutas.
Trabajamos un componente a la vez.
\```