OYE PERO y si tengo cursor pro XD que hago

¡Uf, eso cambia el juego por completo! Si tienes 

**Cursor Pro**, tienes el "Ferrari" de las IAs para programar y **ya no necesitas a Claude fuera de Cursor**.

Cursor Pro incluye **Claude 3.5 Sonnet** (y GPT-4o) de forma nativa e ilimitada. Aquí está cómo debes configurar tu flujo para que Cursor haga el trabajo de "Planificador" y "Ejecutor" al mismo tiempo, sin salir de la app:

1. Configura las "Rules for AI"

Ve a `Settings` -> `General` -> **Rules for AI** y pega lo siguiente. Esto hará que Cursor se comporte como el Claude estratega que extrañas:

markdown

```
# MODO ARQUITECTO LIZ CABRIALES
- Antes de escribir código, analiza siempre `ai-context.md` y los archivos en `tech/`.
- Sigue estrictamente la tabla de "Qué leer según módulo" del `ai-context.md`.
- No inventes: si falta info del negocio, pregunta.
- Usa SIEMPRE: TypeScript, Zod, Supabase (lib/), y el formato de respuesta { data, error }.
- Estilo: Dorado y Negro.
- FLUJO DE TRABAJO: 
  1. Primero propón un "Plan de Acción" breve.
  2. Espera mi "OK".
  3. Ejecuta los cambios en el Composer (Cmd+I).
```

Usa el código con precaución.

2. Usa el "Composer" (Cmd + I / Ctrl + I)

Esta es la función más potente de Cursor Pro. Ya no tienes que copiar y pegar prompts:

1. Abre el **Composer** (`Cmd + I`).
2. Escribe `@ai-context.md` y luego tu petición. Por ejemplo: _"Quiero empezar el módulo de Cursos, lee el contexto y dime qué tablas de Supabase necesito crear"_.
3. Cursor leerá el archivo, planeará y **te ofrecerá crear todos los archivos de un solo golpe**.

4. Aprovecha el "Indexado" de Cursor

Asegúrate de que en `Settings` -> `Features`, el **"Index"** esté activado.

- Esto permite que cuando escribas `@Codebase` en el chat, Cursor entienda **todo** tu proyecto (incluyendo tus archivos `.md` de Obsidian si están en la misma carpeta).

¿Qué pasa con el GitHub Student Pack?

Como ya pagas Cursor Pro, el beneficio de la IA de GitHub te sirve como un **"respaldo de emergencia"** o para usar Copilot en otros editores, pero para este proyecto, **Cursor Pro es superior** porque:

- Tiene **Claude 3.5 Sonnet** integrado (igual que el Claude que usabas antes).
- Puede **aplicar los cambios directamente** en múltiples archivos (el "Composer").
- Entiende las dependencias de tu stack (Next.js 14 + Supabase) mejor que nadie.

	**¿Quieres que probemos lanzando la estructura del "Módulo de Cursos" ahora mismo usando el Composer de Cursor?** Solo dime y te doy el comando exacto.
	
	
	
	entonces omo comienzo a vovler a trbaajar

Para volver al ruedo ahora mismo con 

**Cursor Pro**, olvida el "copia y pega" manual. Vamos a usar el **Composer** (la joya de la corona de Cursor) para que él haga de arquitecto y ejecutor a la vez.

Sigue estos **3 pasos** para retomar el proyecto de Liz Cabriales:

1. Configura la "Inteligencia Central"

Ve a **Settings (el engrane arriba a la derecha) -> General -> Rules for AI** y pega este bloque. Esto hará que Cursor se comporte como el Claude que extrañas:

text

```
Actúa como Arquitecto Senior. Antes de escribir código, consulta SIEMPRE @ai-context.md.
Sigue el stack: Next.js 14 (App Router), TS, Supabase (queries en lib/), Tailwind (Dorado/Negro).
FLUJO: 
1. Analiza el contexto.
2. Propón un plan de pasos.
3. Tras mi "ok", ejecuta los cambios en los archivos correspondientes.
```

Usa el código con precaución.

2. Elige tu próximo movimiento

Como tu `ai-context.md` dice que lo siguiente es el **Módulo de Cursos** o el **Checkout**, elige uno. Supongamos que vas por los **Cursos**.

3. Lanza el comando en el Composer

Presiona `Cmd + I` (Mac) o `Ctrl + I` (Windows) para abrir el **Composer** y escribe exactamente esto:

> "@ai-context.md @tech/database-schema.md @tech/dev-rules.md Según el plan, el siguiente paso es el **Módulo de Cursos**. Analiza qué tablas de Supabase me faltan y propón la estructura de la página `/cursos` siguiendo las reglas de diseño dorado/negro. Dame primero el plan de acción."

---

¿Por qué este flujo es mejor?

- **Contexto total:** Al usar `@`, Cursor lee tus archivos `.md` de Obsidian/Contexto al instante.
- **Sin errores de tipos:** Al ser Pro, usará **Claude 3.5 Sonnet** para asegurarse de que el TypeScript sea perfecto.
- **Ejecución masiva:** Si el plan te gusta, le das al botón **"Apply"** y Cursor creará/modificará todos los archivos (Server Actions, componentes, tipos) de un solo golpe.

¿Qué prefieres atacar primero: el **esquema de base de datos para los Cursos** o empezar a montar la **interfaz de la Academia**?