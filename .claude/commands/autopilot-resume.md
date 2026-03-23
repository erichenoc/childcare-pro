---
description: "Retoma un proyecto autopilot interrumpido. Lee el estado guardado y continua desde la fase exacta donde se detuvo."
---

# /autopilot-resume - Retomar Autopilot

Retoma un proyecto autopilot interrumpido desde la fase exacta donde se detuvo.

---

## Paso 1: Detectar Estado Guardado

Busca archivos de estado en este orden:

```
1. .planning/AUTOPILOT.md    → Estado principal del autopilot
2. .planning/STATE.md         → Estado del GSD (si esta en fase Build)
3. .continue-here.md          → Micro-checkpoint de GSD
```

### Si NO existe `.planning/AUTOPILOT.md`:
```
❌ No se encontro estado de autopilot.
   Usa /autopilot "descripcion del proyecto" para iniciar uno nuevo.
```
→ TERMINAR

### Si existe pero `status: completed`:
```
✅ Este proyecto ya fue completado por autopilot.
   Completado: [completed_at]
   Fases: [N/11]
   ¿Quieres ejecutar /autopilot de nuevo desde cero?
```
→ TERMINAR (esperar respuesta del usuario)

---

## Paso 2: Leer Estado Actual

Del archivo `.planning/AUTOPILOT.md`, extrae:

```yaml
status: [in_progress/failed]
current_phase: [0-10]
project_description: "[...]"
smart_detection:
  auth: [true/false]
  payments: [true/false]
  landing: [true/false]
  components: [true/false]
  database: [true/false]
phases_completed: [lista]
errors_found: [lista]
```

---

## Paso 3: Mostrar Resumen de Progreso

```
🔄 AUTOPILOT RESUME
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Proyecto: [project_description]
📍 Fase actual: [current_phase] de 10
✅ Completadas: [phases_completed]
⏭️  Saltadas: [fases con :skipped]
🐛 Errores previos: [errors_found count]

📊 Progreso:
[0] Context      ✅
[1] Planning     ✅
[2] Design       ✅
[3] Components   ⏭️ (skipped)
[4] Build        🔄 ← AQUI
[5] Auth         ⏳
[6] Payments     ⏳
[7] DB Sync      ⏭️ (skipped)
[8] Quality/SEO  ⏳
[9] Docs         ⏳
[10] Deploy      ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━
```

Usa estos emojis segun estado:
- ✅ Completada
- ⏭️ Saltada (skipped)
- 🔄 En progreso (fase actual)
- ⏳ Pendiente
- ❌ Fallida

---

## Paso 4: Contexto Adicional para Build (Fase 4)

Si `current_phase == 4` (Build), lee tambien:

### `.planning/STATE.md`
- Extrae la fase GSD actual
- Extrae tareas completadas vs pendientes

### `.continue-here.md`
- Si existe, contiene el micro-checkpoint exacto:
  - Que archivo se estaba editando
  - Que tarea de la wave estaba en progreso
  - Contexto para retomar sin perder trabajo

Muestra info adicional:
```
📦 Estado GSD:
   Fase GSD: [N]
   Tareas completadas: [X/Y]
   Micro-checkpoint: [si/no]
```

---

## Paso 5: Retomar Ejecucion

1. Confirma con el usuario: "Retomo desde Fase [N]?"
2. Si confirma:
   - Salta directamente a la fase indicada por `current_phase`
   - Ejecuta siguiendo la logica de `.claude/skills/autopilot/instructions.md`
   - Continua normalmente hasta Fase 10

3. Si la fase actual estaba `failed`:
   - Muestra el error que causo el fallo
   - Pregunta: "¿Reintento esta fase o la salto?"
   - Si reintenta: ejecuta la fase de nuevo
   - Si salta: marca como `skipped` y avanza

---

## Notas

- Este comando es seguro: NO borra progreso existente
- Si hay dudas sobre el estado, muestra TODO al usuario antes de continuar
- Los errores previos (`errors_found`) se mantienen para el Auto-Blindaje final
