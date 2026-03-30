# Cómo funciona el flujo — cheat sheet

## Quién hace qué

**Yo (Denzel):** hablo con Liz, copio docs a Obsidian/repo, pego resúmenes de Cursor en Claude **Claude:** genera prompts para Cursor, actualiza los docs, mantiene el contexto **Cursor:** ejecuta los prompts, crea el código, da el resumen al final

---

## Los únicos docs que yo leo

**`delivery/sprint-actual.md`** → ábrelo al inicio de cada sesión. Te dice qué hacer hoy. **`delivery/decisions-log.md`** → cada que Liz aprueba algo, lo anotas aquí.

---

## El flujo de cada sesión

```
1. Abrir chat nuevo en Claude
2. Pegar claude-prompt.md + ai-context.md
3. Decirle a Claude qué cambió en 2 líneas
4. Claude confirma qué está en scope (sprint-actual)
5. Describir tarea → Claude pide docs → pegarlos → Claude genera prompt
6. Pegar prompt en Cursor → Cursor ejecuta → Cursor da resumen
7. Pegar resumen de Cursor en Claude → Claude actualiza los docs
8. Copiar docs actualizados a Obsidian
9. Repetir desde 5 hasta terminar la sesión
```

---

## Cuándo actualizar cada cosa

**Cada sesión de trabajo** → pegar resumen de Cursor en Claude → Claude actualiza lo que cambió → copiar a Obsidian

**Cuando Liz decide algo** → anotarlo en `decisions-log.md` (Claude lo genera, tú lo copias)

**Al terminar cada sprint** → Claude actualiza `sprint-actual.md`, `roadmap.md` y `ai-context.md`

---

## Si algo se rompe

| Problema                | Solución                                     |
| ----------------------- | -------------------------------------------- |
| Claude no sabe qué pasó | Pegar resumen de Cursor que te faltó         |
| Cursor ignora los docs  | Pegar contenido del .md directo en el prompt |
| No sé qué hacer hoy     | Leer sprint-actual.md                        |
| Liz cambió algo         | Anotarlo en decisions-log.md                 |
| Sesión de +90 min       | Abrir chat nuevo y pegar contexto otra vez   |