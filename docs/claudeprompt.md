# claude-prompt.md

## Cómo iniciar este chat

Pega este archivo + `ai-context.md` al inicio de cada sesión. Luego di en 2 líneas qué cambió desde la última vez.

---

## Árbol del proyecto (código) — actualizado 30 marzo 2026

```
liz-cabriales/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   └── products/page.tsx
│   ├── api/
│   │   ├── admin/products/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── cart/route.ts
│   ├── carrito/page.tsx
│   ├── tienda/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── FilterSidebar.tsx
│   │       ├── ProductCard.tsx
│   │       └── ProductGrid.tsx
│   ├── inspiracion/page.tsx
│   ├── components/
│   │   ├── cart/CartContext.tsx
│   │   ├── hero/HeroSlider.tsx
│   │   ├── navbar/
│   │   │   ├── Navbar.tsx
│   │   │   ├── CartMenu.tsx
│   │   │   ├── DropdownContainer.tsx
│   │   │   ├── MegaMenu.tsx
│   │   │   ├── SearchMenu.tsx
│   │   │   └── menuData.ts
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
│   └── page.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts        ← service role key, solo operaciones admin
│   │   ├── cart.ts         ← queries de carrito
│   │   └── products.ts     ← queries de productos
│   ├── validations/
│   │   └── products.ts     ← schemas Zod
│   ├── cart.ts             ← lógica merge guest→auth
│   └── users.ts
├── scripts/
│   └── seed-products.ts
├── types/index.ts
├── proxy.ts
├── docs/                   ← vault de Obsidian
├── tsconfig.scripts.json
└── .env.local
```

---

## Árbol del vault (docs/)

```
docs/
├── delivery/
│   ├── project-charter.md
│   ├── roadmap.md
│   ├── backlog.md
│   ├── sprint-actual.md    ← LEER SIEMPRE AL INICIAR
│   ├── decisions-log.md
│   ├── entregables.md
│   ├── acuerdo-servicio.md
│   └── meetings/
│       └── 2026-03-16.md
├── tech/
│   ├── database-schema.md
│   ├── api-design.md
│   ├── security-model.md
│   ├── dev-rules.md
│   ├── architecture.md
│   └── stack.md
├── admin/admin-permissions.md
├── booking/booking-rules.md
├── commerce/order-flow.md
├── context/ (brand-research, business-model, target-users, vision)
├── courses/ (courses-rules, courses-rules-dos)
├── payments/ (proveedorpagos, proveedorpagos-2)
├── product/ (product-overview, user-flows, features, pricing, catalogo)
├── ux/ (design-notes, pages)
├── tasks-DEPRECAR/         ← ignorar
├── vmigracion/             ← ignorar, basura de Cursor
├── ai-context.md
├── cheat-sheet.md
└── claudeprompt.md
```

> ⚠️ `tasks-DEPRECAR/` y `vmigracion/` se ignoran completamente.

---

## Reglas de Claude en este proyecto

- **Nunca generar código directamente** — solo prompts para Cursor
- **Siempre pedir los .md relevantes antes** de generar el prompt
- **Si algo no está en el sprint actual** → no lo construyas, agrégalo al backlog
- **Al final de cada tarea** → entregar los .md actualizados listos para Obsidian
- **Si la sesión lleva más de 90 minutos** → recordar abrir chat nuevo

---

## Reglas para los prompts de Cursor

1. Siempre pegar el contenido de los .md relevantes directo en el prompt (no solo `@docs`)
2. Especificar archivos a crear y archivos a modificar
3. Decirle a Cursor explícitamente qué NO debe tocar
4. Todo prompt debe terminar con:

```
Al terminar, genera un resumen con:
- Archivos creados
- Archivos modificados  
- Decisiones técnicas tomadas
- Qué quedó pendiente
No modifiques archivos fuera del scope de esta tarea.
```

---

## El flujo de trabajo

```
╔══════════════════════════════════╗
║        INICIO DE SESIÓN          ║
╚══════════════════════════════════╝
          ↓
  1. Pegar claude-prompt.md + ai-context.md
          ↓
  2. Decir qué cambió en 2 líneas
          ↓
  3. Claude lee delivery/sprint-actual.md
     → Confirma qué está en scope HOY
╔══════════════════════════════════╗
║         LOOP DE TRABAJO          ║
╚══════════════════════════════════╝
          ↓
  Describir tarea concreta
          ↓
  ¿Está en el sprint actual?
  SÍ → continuar
  NO → loggear en backlog, no construir
          ↓
  Claude pide .md relevantes
          ↓
  Denzel pega contenido de esos .md
          ↓
  Claude genera prompt para Cursor
          ↓
  Cursor ejecuta → manda resumen
          ↓
  Denzel pega resumen a Claude
          ↓
  Claude entrega .md actualizados
          ↓
  Denzel copia .md en Obsidian
          ↓
  ¿Tarea nueva?  → volver al loop
  ¿90 min?       → abrir chat nuevo
╔══════════════════════════════════╗
║         FIN DE SESIÓN            ║
╚══════════════════════════════════╝
          ↓
  Verificar que todos los .md
  estén actualizados en Obsidian
          ↓
  ¿Terminó el sprint?
  SÍ → agendar sprint review con Liz
  NO → anotar dónde quedamos en sprint-actual.md
```

---

## Checklist de inicio de sesión

```
[ ] Pegué claude-prompt.md
[ ] Pegué ai-context.md
[ ] Le dije a Claude qué cambió desde la última vez
[ ] Claude confirmó qué está en scope (sprint-actual.md)
```

## Checklist de fin de sesión

```
[ ] Todos los .md actualizados copiados a Obsidian
[ ] sprint-actual.md refleja el estado real
[ ] Si algo nuevo surgió → está en backlog.md
[ ] Si Liz tomó una decisión → está en decisions-log.md
[ ] git add . → git commit -m "mensaje" → git push
[ ] Si el sprint terminó → sprint review agendado con Liz
```

---

## Soluciones a problemas comunes

| Problema                         | Solución                                                   |
| -------------------------------- | ---------------------------------------------------------- |
| Contexto reseteado               | Pegar claude-prompt.md + ai-context.md                     |
| Vault desactualizado             | Decir qué cambió en 2 líneas al iniciar                    |
| Cursor ignora @docs              | Pegar contenido del .md directo en el prompt               |
| Cursor hace cosas fuera de scope | Agregar "No modifiques archivos fuera del scope" al prompt |
| Resúmenes incompletos            | El prompt siempre pide resumen estructurado                |
| Sesión muy larga                 | Chat nuevo cada 90 min o al terminar tarea                 |
| Scope creep                      | Si no está en sprint-actual.md → va al backlog             |
| No sé qué hacer hoy              | Leer delivery/sprint-actual.md primero                     |
| Git con cambios atorados         | git add . → git commit -m "mensaje" → git push             |