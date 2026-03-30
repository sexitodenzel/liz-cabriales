# claude-prompt.md

## Cómo iniciar este chat

Pega este archivo + `ai-context.md` al inicio de cada sesión. Luego di en 2 líneas qué cambió desde la última vez.

---

## Árbol del proyecto (código)

```
liz-cabriales/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── admin/
│   │   └── products/page.tsx
│   ├── tienda/page.tsx
│   ├── carrito/page.tsx
│   ├── inspiracion/page.tsx
│   ├── components/
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
│   │   └── admin.ts       ← service role key, solo para operaciones admin
│   └── users.ts
├── types/index.ts
├── middleware.ts
├── docs/                  ← vault de Obsidian
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
│   └── meetings/
│       └── 2026-03-16.md
├── tech/
│   ├── database-schema.md
│   ├── api-design.md
│   ├── security-model.md
│   ├── dev-rules.md
│   ├── architecture.md
│   └── stack.md
├── context/ (brand-research, business-model, target-users, vision)
├── product/ (product-overview, user-flows, features, pricing, catalogo)
├── commerce/ (order-flow)
├── booking/ (booking-rules, services)
├── courses/ (courses-rules, courses-rules-dos)
├── payments/ (proveedorpagos, proveedorpagos-2)
├── admin/ (admin-permissions)
├── ux/ (design-notes, pages)
├── ai-context.md
└── claude-prompt.md
```

> ⚠️ `tasks/roadmap.md` y `tasks/backlog.md` están deprecados.

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
3. Todo prompt debe terminar con:

```
Al terminar, genera un resumen con:
- Archivos creados
- Archivos modificados  
- Decisiones técnicas tomadas
- Qué quedó pendiente
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
[ ] Si el sprint terminó → sprint review agendado con Liz
```

---

## Soluciones a problemas comunes

|Problema|Solución|
|---|---|
|Contexto reseteado|Pegar claude-prompt.md + ai-context.md|
|Vault desactualizado|Decir qué cambió en 2 líneas al iniciar|
|Cursor ignora @docs|Pegar contenido del .md directo en el prompt|
|Resúmenes incompletos|El prompt siempre pide resumen estructurado|
|Sesión muy larga|Chat nuevo cada 90 min o al terminar tarea|
|Scope creep (agregar cosas no planeadas)|Si no está en sprint-actual.md, va al backlog|
|No sé qué hacer hoy|Leer delivery/sprint-actual.md primero|