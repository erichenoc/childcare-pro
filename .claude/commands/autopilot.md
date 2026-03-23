---
description: "Meta-orquestador que automatiza la creacion completa de un SaaS. Analiza la descripcion del proyecto, detecta features necesarias, y ejecuta todas las herramientas de la fabrica en secuencia automatizada."
---

# /autopilot - Meta-Orquestador de SaaS Factory V3

Construye un SaaS completo de principio a fin con UN SOLO COMANDO.

**NO preguntas tecnicas. Analizas, detectas, ejecutas.**

> *"La maquina que construye la maquina es mas importante que el producto."* — Elon Musk

---

## Descripcion del Proyecto

```
$ARGUMENTS
```

---

## Paso 0: Recovery Check

Antes de empezar, verifica si ya existe un estado previo:

```
SI existe `.planning/AUTOPILOT.md`:
  → Lee el archivo
  → Extrae `current_phase` y `phases_completed`
  → Muestra resumen de progreso al usuario
  → Pregunta: "Detecte progreso previo en fase [X]. ¿Retomo desde ahi o inicio de cero?"
  → Si retoma: salta a la fase guardada
  → Si reinicia: borra AUTOPILOT.md y empieza desde Fase 0

SI NO existe:
  → Continua con Paso 1 (Smart Detection)
```

---

## Paso 1: Smart Detection

Analiza `$ARGUMENTS` para detectar que features activar automaticamente.

### Keywords a Detectar

| Feature | Keywords | Herramienta |
|---------|----------|-------------|
| **Auth** | "login", "auth", "usuarios", "registro", "cuenta", "signup", "sesion", "user" | `/add-login` |
| **Payments** | "pagos", "payments", "stripe", "suscripcion", "cobrar", "planes", "pricing", "checkout" | `/add-payments` |
| **Landing** | "landing", "marketing", "homepage", "pagina principal", "hero" | `/landing` |
| **Components** | "componentes", "ui library", "shadcn", "design system", "ui kit" | `/componentes` |
| **Database** | "database", "supabase", "schema", "db", "base de datos", "tablas", "postgres" | `/supabase-schema-sync` |

### Features Siempre Activos (Core)

Estos se ejecutan SIEMPRE, sin importar la descripcion:

- `/primer` — Context
- `/gsd:new-project` — Planning
- `/consulta-diseno` — Design System
- Build Loop (`/gsd:plan-phase` + `/gsd:execute-phase`)
- Quality Gates (code-review, tests, security, optimize)
- SEO (`seo-optimizer` skill)
- Auto-Blindaje V3
- Documentacion (`/create-architecture-documentation`)
- Deploy (`/deploy`)

### Crear Estado Inicial

Crea el archivo `.planning/AUTOPILOT.md` con este contenido:

```yaml
---
status: in_progress
current_phase: 0
project_description: "$ARGUMENTS"
smart_detection:
  auth: [true/false segun deteccion]
  payments: [true/false segun deteccion]
  landing: [true/false segun deteccion]
  components: [true/false segun deteccion]
  database: [true/false segun deteccion]
  seo: true
phases_completed: []
errors_found: []
started_at: "[fecha actual ISO]"
---

# Autopilot State: [nombre del proyecto]

## Smart Detection Results
- Auth: [SI/NO] — Keywords encontradas: [lista]
- Payments: [SI/NO] — Keywords encontradas: [lista]
- Landing: [SI/NO] — Keywords encontradas: [lista]
- Components: [SI/NO] — Keywords encontradas: [lista]
- Database: [SI/NO] — Keywords encontradas: [lista]
- SEO: SI (siempre activo)

## Phase Log
[Se actualiza automaticamente con cada fase completada]
```

Muestra al usuario un resumen de la deteccion antes de continuar:

```
🔍 Smart Detection Results:
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Auth: [SI/NO]
✅ Payments: [SI/NO]
✅ Landing: [SI/NO]
✅ Components: [SI/NO]
✅ Database: [SI/NO]
✅ SEO: SI (siempre)
━━━━━━━━━━━━━━━━━━━━━━━━━
Total fases: [N] de 11
```

---

## Paso 2: Ejecutar Fases

Ejecuta las fases en secuencia. Consulta `.claude/skills/autopilot/instructions.md` para la logica detallada de cada fase.

### Secuencia de Fases

```
FASE 0  → /primer                              [SIEMPRE]
FASE 1  → /gsd:new-project + auto_advance       [SIEMPRE]
FASE 2  → /consulta-diseno                      [SIEMPRE]
FASE 3  → /componentes                          [CONDICIONAL]
FASE 4  → /gsd:plan-phase + /gsd:execute-phase  [SIEMPRE - Loop]
FASE 5  → /add-login                            [CONDICIONAL]
FASE 6  → /add-payments                         [CONDICIONAL]
FASE 7  → /supabase-schema-sync                 [CONDICIONAL]
FASE 8  → Quality + SEO + Auto-Blindaje         [SIEMPRE]
FASE 9  → /create-architecture-documentation    [SIEMPRE]
FASE 10 → /deploy                               [SIEMPRE]
```

### Para CADA fase:

1. **Pre-check**: Si la fase es condicional y `smart_detection.[feature] == false` → marcar como `skipped` y saltar
2. **Ejecutar**: Llama al comando/skill correspondiente
3. **Actualizar estado**: En `.planning/AUTOPILOT.md`:
   - Agrega fase a `phases_completed`
   - Incrementa `current_phase`
   - Registra errores en `errors_found` si los hubo
4. **Siguiente**: Avanza a la siguiente fase

### Al Completar Todas las Fases

Actualiza `.planning/AUTOPILOT.md`:
```yaml
status: completed
completed_at: "[fecha actual ISO]"
```

Muestra resumen final:

```
🏭 AUTOPILOT COMPLETADO
━━━━━━━━━━━━━━━━━━━━━━
📋 Proyecto: [nombre]
⏱️  Fases completadas: [N/11]
⏭️  Fases saltadas: [N]
🐛 Errores encontrados: [N]
🔗 URL: [deploy URL si disponible]
━━━━━━━━━━━━━━━━━━━━━━
```

---

## Notas Importantes

- **Golden Path**: Siempre Next.js 16 + Supabase + Tailwind. No preguntas alternativas.
- **Feature-First**: Arquitectura `src/features/`, `src/shared/`, `src/app/`
- **Auto-Blindaje**: Los errores de Fase 8 se documentan en el CLAUDE.md del proyecto nuevo
- **Recovery**: Si se interrumpe, usar `/autopilot-resume` para retomar
- **GSD Auto-Mode**: Fase 1 activa `auto_advance: true` para que el build loop sea continuo
