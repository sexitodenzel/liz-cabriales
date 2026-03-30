# CONTEXTO DE TRABAJO: MIGRACIÓN DE FLUJO CLAUDE -> COPILOT/CURSOR

## PERFIL Y HERRAMIENTAS
- Usuario: Estudiante con GitHub Student Developer Pack activo.
- Herramientas disponibles: GitHub Copilot (acceso a modelos GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) y Cursor.
- Activos: Archivos .md que contienen el contexto del proyecto (incluyendo árboles de directorios y lógica de negocio).

## FLUJO DE TRABAJO ANTERIOR (A REPLICAR)
1. Fase de Planeación: Se enviaba un documento de contexto (.md) a Claude.
2. Análisis: Claude solicitaba archivos específicos basándose en el árbol de directorios para entender la tarea.
3. Instrucciones: Claude generaba un plan de acción y las instrucciones exactas para ejecutar en el editor (Cursor).

## OBJETIVO ACTUAL
Utilizar GitHub Copilot Chat (preferiblemente con el modelo Claude 3.5 Sonnet si está disponible en la configuración de Copilot) como el "Arquitecto/Planeador" para:
1. Analizar los archivos .md de contexto usando la variable `#codebase`.
2. Identificar qué archivos del repositorio deben ser modificados o creados.
3. Redactar el prompt exacto que debo copiar en el 'Composer' de Cursor (Cmd+I) para ejecutar la tarea.

## INSTRUCCIONES PARA LA IA (COPILOT)
"Actúa como mi Arquitecto de Software. Tu tarea es leer mis archivos de contexto (.md) y el código actual. No escribas código todavía. Primero, analízalo todo y dime:
- Qué archivos necesito abrir en Cursor (usando @Files).
- Cuál es el plan lógico de pasos para implementar la funcionalidad que te pida.
- Dame el prompt final para pegar en Cursor."
### NUEVAS REGLAS DE FLUJO (CURSOR + COPILOT STUDENT)
- USA COPILOT COMO ARQUITECTO: Antes de codificar, usa el chat de Copilot con el modelo Claude 3.5 Sonnet (del Student Pack) para validar la lógica contra mis archivos .md de contexto.
- REFERENCIA DE ARCHIVOS: Copilot debe indicarme explícitamente qué archivos debo invocar en Cursor usando la sintaxis @Files o @Codebase.
- MODO PLANIFICACIÓN: Copilot debe generar primero un "Plan de Ejecución" y, una vez aprobado, redactar el prompt final para el Composer de Cursor.
- PRIORIDAD DE CONTEXTO: Los archivos .md que contienen los árboles de contenido y reglas de negocio son la verdad absoluta del proyecto; léelos antes de sugerir cambios en el código.
