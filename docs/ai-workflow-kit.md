# AI Workflow Kit — Liz Cabriales

> Sistema operativo del proyecto para trabajar con ChatGPT + Codex + Cursor sin perder continuidad, scope ni documentación.
>
> Este archivo es canónico para el flujo de trabajo.
> No reemplaza `delivery/roadmap.md`, `delivery/sprint-actual.md`, `delivery/backlog.md` ni `delivery/decisions-log.md`.
> Los complementa.

---

## 1. Propósito

Definir cómo se trabaja en este proyecto para que el sistema sea:

- portable entre cuentas de ChatGPT
- resistente a sesiones interrumpidas
- compatible con trabajo delegado
- consistente con el roadmap, sprint actual y documentación del vault

---

## 2. Roles operativos

### Usuario / operador
- Define prioridad de negocio
- Ejecuta Codex
- Pega reportes
- Aplica cambios al vault
- Puede hacer cambios manuales en código o docs, pero debe reportarlos

### ChatGPT
- Arquitecto de flujo
- Decide la siguiente tarea según sprint/roadmap
- Descompone sprints y tareas
- Genera prompts para Codex
- Revisa entregas
- Convierte reportes en updates exactos del vault
- Detecta drift entre código, docs y decisiones

### Codex
- Ejecutor principal de código
- No decide roadmap
- No actualiza documentación del vault
- Debe entregar reporte estructurado obligatorio

### Cursor
- Apoyo manual opcional
- Edición o inspección puntual
- No es el ejecutor principal por defecto

---

## 3. Jerarquía de autoridad

Cuando haya conflicto, aplicar este orden:

1. **Instrucción explícita del usuario en chat** → prioridad de negocio
2. **Código real del proyecto** → verdad de implementación
3. **Documentación del vault** → verdad de planeación y estado

Si hay contradicción:
- ChatGPT evalúa caso por caso
- la contradicción se reporta explícitamente
- se decide si adaptar docs o corregir implementación

---

## 4. Source of truth documental

Usar como referencias activas:

- `delivery/roadmap.md`
- `delivery/backlog.md`
- `delivery/sprint-actual.md`
- `payments/proveedorpagos.md`

Además, este archivo define la capa operativa del flujo de trabajo.

Archivos legacy o duplicados quedan fuera del flujo activo.

---

## 5. Regla de sesiones

### Sesión cerrada
Una sesión solo cuenta como cerrada si:

- la entrega de Codex fue revisada
- se emitió semáforo
- se definió la siguiente acción
- se generó bloque de continuidad
- los docs fueron:
  - actualizados, o
  - marcados con pendientes exactos de actualización

Si falta uno de esos puntos, la sesión queda **abierta**.

### Sesión abierta
Una sesión está abierta si:

- hay reporte pendiente
- no hay semáforo
- no hay continuidad
- hay cambios manuales no procesados
- no está claro qué docs deben cambiar

### Regla crítica
**No se cierra sesión sin continuidad.**

---

## 6. Regla de actualización documental

Se permite actualizar físicamente el vault **cada 2–3 entregas**, pero no se permite cerrar sesión sin:

- reporte procesado
- semáforo emitido
- continuidad generada
- lista exacta de updates documentales pendientes

Esto significa:

- el **estado lógico** debe quedar claro siempre
- la **edición física** del vault puede hacerse por lote

---

## 7. Semáforo de entregas

### Verde
La entrega:
- cumple scope
- no contradice arquitectura
- tiene validación suficiente
- deja claro el siguiente paso

### Amarillo
La entrega:
- es usable
- pero está incompleta, riesgosa o con deuda localizada
- requiere corrección antes de seguir normal

### Rojo
La entrega:
- sale del scope
- rompe algo
- contradice docs o arquitectura
- tiene validación insuficiente o confusa

---

## 8. Granularidad de trabajo

### Regla general
Trabajar con **tareas medias**, compuestas por **2–3 subtareas internas pequeñas**.

### No hacer al inicio
- tareas demasiado grandes
- bloques enteros de sprint en una sola ejecución
- trabajo difuso sin criterio de éxito

### Cada tarea debe incluir
- objetivo concreto
- criterio de éxito
- riesgos
- archivos a tocar
- orden recomendado
- restricciones de scope

---

## 9. Última milla de docs

ChatGPT no dirá solo “actualiza docs”.

El flujo correcto es:

1. ChatGPT indica qué archivo pedir primero
2. El usuario pega el archivo
3. ChatGPT devuelve parche textual exacto
4. Repetir para los demás archivos necesarios

Orden preferido:
1. `delivery/sprint-actual.md`
2. `delivery/backlog.md`
3. `delivery/decisions-log.md`
4. `delivery/roadmap.md` solo si cambió secuencia/alcance/fases

---

## 10. Cuándo cambia cada documento

### `delivery/sprint-actual.md`
Cambios frecuentes.
Define:
- qué se construye hoy
- estado real del sprint
- orden técnico inmediato

### `delivery/backlog.md`
Cambios frecuentes/moderados.
Define:
- pendientes nuevos
- cosas fuera de scope
- bloqueadores

### `delivery/decisions-log.md`
Cambia cuando:
- Liz aprueba algo
- cambia una decisión relevante
- se documenta una definición de alcance o implementación

### `delivery/roadmap.md`
Cambia poco.
Solo cuando:
- cambia la secuencia de fases/sprints
- cambia alcance
- cambian fechas o entregables macro
- cambia la estructura general del plan

---

## 11. Continuidad operativa

Además del almacenamiento externo del usuario, este proyecto debe mantener:

- `delivery/session-continuity.md`

Ese archivo guarda el último estado operativo confirmado.

Si no existe continuidad clara:
- no se avanza
- se entra a modo recuperación

---

## 12. Escenarios operativos

### A. Sesión perfecta cerrada
- reporte procesado
- semáforo emitido
- continuidad guardada
- docs actualizados o pendientes exactos definidos

Próxima sesión:
- usar reapertura

### B. Entrega de Codex sin docs cerrados
- no usar reapertura normal
- usar recuperación
- primero cerrar continuidad y updates

### C. Sesión interrumpida sin reporte claro
- recuperación obligatoria

### D. Cambios manuales del usuario
- reapertura si sabe qué tocó
- recuperación si no está claro

### E. Entrega amarilla
- siguiente paso = prompt de corrección o rediseño parcial

### F. Entrega roja
- siguiente paso = remediación o rollback lógico

### G. Cambio de sprint
- cierre del sprint anterior
- reapertura
- descomposición profunda del siguiente sprint

### H. Cambio de cuenta o computadora
- subir docs
- pegar continuidad
- usar reapertura
- seguir normal

---

## 13. Prompts operativos

### Prompt de reapertura
```text
SEGUIMOS

Antes de decidir cualquier tarea, lee y usa este contexto en este orden:

1. `docs/ai-context.md`
2. `docs/ai-workflow-kit.md`
3. `docs/delivery/session-continuity.md`
4. `docs/delivery/sprint-actual.md`

Solo si detectas conflicto, drift, bloqueadores, cambio de alcance o necesidad de prioridad adicional, consulta además:
- `docs/delivery/backlog.md`
- `docs/delivery/roadmap.md`
- `docs/delivery/decisions-log.md`

Modo de trabajo:
- Tú decides la siguiente tarea
- Tú profundizas el sprint antes de proponer ejecución
- Tú generas el prompt para Codex
- Tú revisas la entrega
- Tú me dices exactamente qué archivo del vault pedirte y qué cambiar
- Codex es el ejecutor principal
- Cursor solo apoyo manual si hace falta

Continuidad:
- Último estado confirmado: [rellenar]
- Hubo ejecución de Codex: [sí/no]
- Hubo cambios manuales en código o docs: [sí/no]
- Si sí hubo, cambio resumido en 1–3 líneas: [rellenar]
- Hay reporte pendiente de procesar: [sí/no]
- Estado de docs: [actualizados / pendientes exactos ya definidos]

Primero haz esto en orden:
1. validar continuidad contra `session-continuity.md`
2. verificar si la sesión anterior quedó cerrada o abierta según `ai-workflow-kit.md`
3. identificar el sprint activo y el siguiente frente de trabajo desde `sprint-actual.md`
4. consultar `backlog.md`, `roadmap.md` y `decisions-log.md` solo si hace falta para resolver conflicto, drift o prioridad
5. descomponer profundamente el tramo actual si hace falta
6. elegir la siguiente tarea media óptima
7. darme el prompt listo para Codex
8. decir explícitamente qué documentos usaste para decidir
   
   
   
```
### Regla de lectura obligatoria
En reapertura normal, ChatGPT debe leer primero:
1. `ai-context.md`
2. `ai-workflow-kit.md`
3. `delivery/session-continuity.md`
4. `delivery/sprint-actual.md`

`backlog.md`, `roadmap.md` y `decisions-log.md` se consultan solo si hay conflicto, drift, bloqueo, cambio de alcance o necesidad de re-priorización.
### Prompt de recuperación
```text
RECUPERACIÓN DE CONTINUIDAD

Asume el contexto base del proyecto desde los documentos cargados.
No propongas trabajo nuevo hasta reconstruir estado.

Información disponible:
- Último estado que recuerdo: [rellenar]
- Hubo ejecución de Codex: [sí/no/no sé]
- Tengo reporte de Codex: [sí/no]
- Hubo cambios manuales: [sí/no/no sé]
- Archivos posiblemente tocados: [rellenar]
- Estado de docs: [actualizados / no actualizados / no sé]

Haz esto en orden:
1. inferir estado probable
2. listar incertidumbres críticas
3. decirme qué falta confirmar
4. decidir si la sesión anterior estaba cerrada o abierta
5. proponer la forma más segura de retomar
```

### Prompt de cierre
```text
CIERRE DE SESIÓN

Genera un bloque de continuidad listo para pegar en un chat nuevo.
Debe incluir:

1. Último estado confirmado
2. Qué tarea quedó cerrada y cuál quedó abierta
3. Si hubo ejecución de Codex
4. Si quedó reporte pendiente
5. Qué docs deben actualizarse o cuáles ya quedaron actualizados
6. Próxima tarea recomendada
7. Riesgos o bloqueadores vigentes

Devuélvelo en formato breve, listo para copiar y pegar.
```

## Prompt maestro para Codex

Este prompt no se pega solo ni se usa como mensaje independiente al abrir una sesión.
ChatGPT lo usa como base para construir cada prompt operativo de ejecución para Codex.

```text
Eres el ejecutor técnico del proyecto Liz Cabriales.

Tu trabajo NO es decidir el roadmap. Tu trabajo es ejecutar una tarea delimitada dentro del sprint actual.

Reglas permanentes:
- Respeta el scope exacto de la tarea
- No adelantes trabajo de otros sprints salvo dependencia mínima indispensable
- No modifiques documentación del vault por tu cuenta
- Si detectas que falta contexto, asume lo mínimo razonable y repórtalo
- Si algo contradice archivos existentes, prioriza la implementación real del proyecto y repórtalo
- No hagas sobreingeniería
- TypeScript siempre
- Zod para validación
- Queries fuera de componentes
- Todo texto visible al usuario en español
- Respuesta API consistente:
  - éxito: { data: T, error: null }
  - error: { data: null, error: { message: string, code?: string } }

Antes de ejecutar cualquier tarea:
1. Revisa si ya existe implementación relacionada
2. Reutiliza o extiende antes de duplicar
3. Mantén cambios concentrados en el mínimo número de archivos posible

Si la tarea pertenece a un sprint o bloque grande, primero haz una mini-descomposición interna:
- dependencias
- riesgo principal
- orden de implementación

Al terminar, entrega obligatoriamente el REPORTE ESTRUCTURADO definido en este mismo archivo.

## 14. Reglas para Codex

Codex trabaja con un prompt operativo generado por ChatGPT.

### Reglas mínimas permanentes

- respetar scope exacto
- no adelantar otros sprints salvo dependencia mínima
- no actualizar docs del vault
- TypeScript siempre
- Zod para validación
- queries fuera de componentes
- texto visible al usuario en español
- reporte estructurado obligatorio al final

### Regla crítica

Si detecta cambios que afectan documentación:

- no actualiza docs
- solo los reporta


## 15. REPORTE ESTRUCTURADO obligatorio de Codex
```text
## 1) Resultado
- Qué se logró exactamente
- Qué no se logró exactamente

## 2) Archivos creados
- ruta/completa/archivo

## 3) Archivos modificados
- ruta/completa/archivo — cambio en 1 línea

## 4) Archivos eliminados
- ruta/completa/archivo

## 5) Cambios funcionales
- visible usuario
- interno/backend
- rutas/API nuevas o actualizadas

## 6) Decisiones técnicas tomadas
- decisión
- motivo
- impacto

## 7) Validación realizada
- comandos ejecutados
- tests corridos
- resultado
- qué no se validó y por qué

## 8) Bloqueadores y errores
- bloqueo
- error
- impacto

## 9) Pendientes reales
- falta para cerrar
- fuera de scope → backlog

## 10) Recomendación de actualización de docs del vault
- archivo exacto
- sección exacta
- cambio sugerido

## 11) Resumen ejecutivo corto
Máximo 8 líneas.
Sin “etc.”, sin “varios archivos”.
```

## 16. Tabla rápida: si pasa X, pega Y

| Situación                            | Qué pegar                                    |
| ------------------------------------ | -------------------------------------------- |
| Todo quedó bien                      | Prompt de cierre                             |
| Abres sesión nueva y todo quedó bien | Prompt de reapertura + bloque de continuidad |
| Hay reporte pendiente                | Prompt de recuperación                       |
| Hubo cambios manuales claros         | Reapertura con resumen                       |
| Hubo cambios manuales confusos       | Recuperación                                 |
| Cambio de cuenta o computadora       | Reapertura + continuidad + docs cargados     |
| Entrega amarilla/roja                | Esperar prompt correctivo de ChatGPT         |

## 17. Regla final de portabilidad

Este sistema debe seguir funcionando si:

- cambias de cuenta
- cambias de computadora
- pierdes acceso al chat actual

Por eso el conocimiento operativo debe vivir en:

- este archivo
- `delivery/session-continuity.md`
- el vault actualizado
- el código real del proyecto

No debe depender de la memoria de un chat.