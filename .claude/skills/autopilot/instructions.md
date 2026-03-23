# Autopilot - Instrucciones Detalladas por Fase

> Logica granular de las 11 fases del meta-orquestador.
> Cada fase documenta: QUE ejecutar, COMO verificar, y CUANDO saltar.

---

## Fase 0: Context (`/primer`)

**Comando:** `/primer`
**Tipo:** SIEMPRE

### Ejecucion
1. Ejecuta el comando `/primer` para analizar el workspace
2. Extrae: tech stack detectado, estructura de carpetas, dependencias existentes
3. Si el proyecto esta vacio, `/primer` inicializara el contexto base

### Verificacion
- Confirma que el contexto fue capturado correctamente
- Si hay un proyecto existente, identifica que ya esta construido vs que falta

### Actualizar Estado
```yaml
# En .planning/AUTOPILOT.md
current_phase: 1
phases_completed: ["0:context"]
```

---

## Fase 1: Planning (`/gsd:new-project`)

**Comando:** `/gsd:new-project`
**Tipo:** SIEMPRE

### Ejecucion
1. Ejecuta `/gsd:new-project` pasando la descripcion del proyecto de `$ARGUMENTS`
2. Esto crea la estructura `.planning/` con:
   - `PROJECT.md` — Definicion del proyecto
   - `STATE.md` — Estado de ejecucion GSD
   - `config.json` — Configuracion

3. **CRITICO**: Activar auto-advance mode:
   ```json
   // En .planning/config.json
   {
     "workflow": {
       "auto_advance": true
     }
   }
   ```

4. Incorpora resultados del Smart Detection en el plan:
   - Features condicionales detectadas se agregan como fases adicionales
   - Features no detectadas se marcan como `skipped`

### Verificacion
- `.planning/PROJECT.md` existe y tiene contenido coherente
- `.planning/STATE.md` existe con estado inicial
- `.planning/config.json` tiene `auto_advance: true`

### Actualizar Estado
```yaml
current_phase: 2
phases_completed: ["0:context", "1:planning"]
```

---

## Fase 2: Design (`/consulta-diseno`)

**Comando:** `/consulta-diseno`
**Tipo:** SIEMPRE

### Ejecucion
1. Ejecuta `/consulta-diseno` que coordina internamente:
   - `ui-ux-pro-max` — Analisis UX profesional
   - `elite-frontend-ux` — Frontend design patterns
   - `theme-factory` — Generacion de tema/design tokens
   - `frontend-design` — Estructura visual

2. Genera un design system coherente para el proyecto:
   - Paleta de colores
   - Tipografia
   - Spacing system
   - Componentes base

### Verificacion
- Se genero un design system documentado
- Los design tokens son aplicables al Golden Path (Tailwind)

### Actualizar Estado
```yaml
current_phase: 3
phases_completed: ["0:context", "1:planning", "2:design"]
```

---

## Fase 3: Components (`/componentes`)

**Comando:** `/componentes`
**Tipo:** CONDICIONAL — Solo si `smart_detection.components == true`

### Pre-check
```
SI smart_detection.components == false:
  → Marcar como "3:components:skipped" en phases_completed
  → Saltar a Fase 4
```

### Ejecucion
1. Ejecuta `/componentes` que accede al catalogo de 2,300+ componentes
2. Selecciona UI library apropiada basada en el design system de Fase 2
3. Instala componentes seleccionados en `src/shared/components/`

### Verificacion
- Componentes instalados en la ruta correcta
- Compatibles con Tailwind CSS del design system

### Actualizar Estado
```yaml
current_phase: 4
phases_completed: [..., "3:components"]
```

---

## Fase 4: Build (`/gsd:plan-phase` + `/gsd:execute-phase`)

**Comando:** `/gsd:plan-phase` → `/gsd:execute-phase` (loop)
**Tipo:** SIEMPRE

### Ejecucion
1. **Para cada fase del plan GSD:**
   ```
   a. Ejecuta /gsd:plan-phase → Genera PLAN.md para la fase actual
   b. Ejecuta /gsd:execute-phase → Ejecuta las tareas del PLAN.md
   c. Verifica SUMMARY.md == PLAN.md (todas las tareas completadas)
   d. Si hay tareas pendientes → re-ejecuta /gsd:execute-phase
   e. Si completa → avanza a siguiente fase GSD
   ```

2. **Wave execution**: GSD ejecuta tareas en paralelo cuando es posible (subagentes frescos)

3. **Continua hasta** que todas las fases del plan GSD esten completadas

### Verificacion
- Cada fase tiene PLAN.md y SUMMARY.md pareados
- El conteo de tareas en SUMMARY coincide con PLAN
- `.planning/STATE.md` refleja el progreso real

### Actualizar Estado
```yaml
current_phase: 5
phases_completed: [..., "4:build"]
```

---

## Fase 5: Auth (`/add-login`)

**Comando:** `/add-login`
**Tipo:** CONDICIONAL — Solo si `smart_detection.auth == true`

### Pre-check
```
SI smart_detection.auth == false:
  → Marcar como "5:auth:skipped"
  → Saltar a Fase 6
```

### Ejecucion
1. Ejecuta `/add-login` — Golden Path completo, sin preguntas:
   - Supabase Auth con email/password
   - `proxy.ts` (Next.js 16, NO middleware.ts)
   - `@supabase/ssr` con `getAll()` / `setAll()`
   - Patron Profiles (`public.profiles` + trigger)
   - RLS policies
   - Componentes: LoginForm, SignupForm, AuthGuard

2. **NO pregunta** que tipo de auth. Ejecuta el Golden Path directamente.

### Verificacion
- `proxy.ts` existe en root
- `src/lib/supabase/` configurado correctamente
- `src/features/auth/` tiene componentes y hooks
- Login/signup funcional

### Actualizar Estado
```yaml
current_phase: 6
phases_completed: [..., "5:auth"]
```

---

## Fase 6: Payments (`/add-payments`)

**Comando:** `/add-payments`
**Tipo:** CONDICIONAL — Solo si `smart_detection.payments == true`

### Pre-check
```
SI smart_detection.payments == false:
  → Marcar como "6:payments:skipped"
  → Saltar a Fase 7
```

### Ejecucion
1. Ejecuta `/add-payments` — Stripe completo:
   - Checkout sessions
   - Suscripciones con planes
   - Webhooks para eventos de pago
   - Portal del cliente
   - Tablas en Supabase (subscriptions, prices, products)

### Verificacion
- `src/features/payments/` creado con componentes y servicios
- Webhook endpoint configurado
- Tablas de Stripe sincronizadas con Supabase

### Actualizar Estado
```yaml
current_phase: 7
phases_completed: [..., "6:payments"]
```

---

## Fase 7: DB Sync (`/supabase-schema-sync`)

**Comando:** `/supabase-schema-sync`
**Tipo:** CONDICIONAL — Solo si `smart_detection.database == true`

### Pre-check
```
SI smart_detection.database == false:
  → Marcar como "7:database:skipped"
  → Saltar a Fase 8
```

### Ejecucion
1. Ejecuta `/supabase-schema-sync --push`
2. Sincroniza el schema de la base de datos
3. Genera migraciones si necesario

### Verificacion
- Schema de Supabase refleja el modelo de datos del proyecto
- Migraciones generadas en `supabase/migrations/`
- RLS habilitado en todas las tablas

### Actualizar Estado
```yaml
current_phase: 8
phases_completed: [..., "7:database"]
```

---

## Fase 8: Quality + SEO + Auto-Blindaje

**Tipo:** SIEMPRE (3 sub-sistemas)

### 8A: Quality Gates (Secuencial)

Ejecuta en secuencia estricta:

```
1. /code-review        → Identifica issues de codigo
2. /generate-tests     → Genera tests para codigo nuevo
3. /security-audit     → Detecta vulnerabilidades
4. /optimize           → Mejora performance
5. /refactor-code      → Solo si /code-review encontro issues criticos
```

**Recopilar TODOS los errores** encontrados en cada paso.

### 8B: SEO

Ejecuta el skill `seo-optimizer`:

1. Meta tags para todas las paginas
2. `sitemap.xml` generado
3. Structured data (JSON-LD)
4. Core Web Vitals optimizados
5. `robots.txt` configurado
6. Open Graph tags

### 8C: Auto-Blindaje V3

**CRITICO**: Este paso fortalece la fabrica.

1. Recopila TODOS los errores de Quality Gates (8A)
2. Para CADA error encontrado, documenta en el CLAUDE.md del proyecto nuevo:

```markdown
### [YYYY-MM-DD]: [Titulo corto del error]
- **Error**: [Que fallo exactamente]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas podria aplicar este aprendizaje]
```

3. Agrega los aprendizajes a la seccion `## 🔥 Aprendizajes (Auto-Blindaje Activo)` del CLAUDE.md

4. Tambien actualiza `.planning/AUTOPILOT.md`:
```yaml
errors_found:
  - phase: "8:quality"
    error: "[descripcion]"
    fix: "[como se arreglo]"
    severity: "critical|warning|info"
```

### Verificacion
- Todos los quality gates pasaron (o errores fueron arreglados)
- SEO configurado correctamente
- Errores documentados en CLAUDE.md del proyecto

### Actualizar Estado
```yaml
current_phase: 9
phases_completed: [..., "8:quality-seo-blindaje"]
```

---

## Fase 9: Documentation (`/create-architecture-documentation`)

**Comando:** `/create-architecture-documentation`
**Tipo:** SIEMPRE

### Ejecucion
1. Ejecuta `/create-architecture-documentation` que genera:
   - C4 Models (Context, Container, Component)
   - Arc42 documentation
   - Architecture Decision Records (ADRs)
   - API documentation
   - README.md completo del proyecto

### Verificacion
- `docs/` contiene documentacion generada
- README.md del proyecto es completo y util

### Actualizar Estado
```yaml
current_phase: 10
phases_completed: [..., "9:documentation"]
```

---

## Fase 10: Deploy (`/deploy`)

**Comando:** `/deploy`
**Tipo:** SIEMPRE

### Ejecucion
1. Ejecuta `/deploy` que hace:
   - Pre-deploy checks (typecheck + build)
   - Git status y commit si hay cambios pendientes
   - Deploy a Vercel (`npx vercel --prod`)
   - Verificacion post-deploy

### Verificacion
- Build exitoso sin errores
- Deploy completado
- URL de produccion accesible

### Actualizar Estado Final
```yaml
status: completed
current_phase: 10
completed_at: "[fecha ISO]"
phases_completed: [..., "10:deploy"]
```

---

## Reglas Globales

### Si una fase FALLA:
1. **NO parar** el autopilot completo
2. Registrar el error en `errors_found`
3. Intentar arreglar automaticamente
4. Si no se puede arreglar: marcar fase como `failed` y preguntar al usuario
5. Continuar con la siguiente fase si el usuario autoriza

### Tiempos estimados por fase:
| Fase | Tiempo estimado |
|------|----------------|
| 0: Context | ~30 seg |
| 1: Planning | ~2 min |
| 2: Design | ~3 min |
| 3: Components | ~2 min |
| 4: Build | ~10-30 min (depende del proyecto) |
| 5: Auth | ~5 min |
| 6: Payments | ~5 min |
| 7: DB Sync | ~2 min |
| 8: Quality + SEO | ~10 min |
| 9: Docs | ~5 min |
| 10: Deploy | ~3 min |

### Landing Page (Feature Condicional Integrada)
Si `smart_detection.landing == true`, durante la **Fase 4 (Build)**, la landing page se genera usando el comando `/landing` que aplica frameworks AIDA/PAS con el design system de Fase 2.
