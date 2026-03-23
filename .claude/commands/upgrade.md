---
description: "Meta-orquestador para MEJORAR proyectos existentes. Diagnostica, optimiza, blinda y documenta un proyecto ya construido usando todas las herramientas de SaaS Factory V3"
argument-hint: "[descripcion de que mejorar] | --full | --diagnostico | --quality | --features"
---

# /upgrade - Mejorar Proyecto Existente

Analiza, mejora y blinda un proyecto que ya esta construido: $ARGUMENTS

**NO es para proyectos nuevos** (para eso usa `/autopilot`).
**ES para proyectos existentes** que necesitan mejora profesional.

---

## Paso 0: Deteccion de Modo

Analiza `$ARGUMENTS` para determinar el modo de ejecucion:

| Argumento | Modo | Fases que ejecuta |
|-----------|------|-------------------|
| `--full` | Completo | TODAS las fases (1-7) |
| `--diagnostico` | Solo diagnostico | Fases 1-2 (sin cambios) |
| `--quality` | Solo calidad | Fases 1-4 (diagnostico + mejora) |
| `--features` | Solo features | Fases 1, 5 (diagnostico + features) |
| _(sin flag)_ | Completo | TODAS las fases (1-7) |

---

## Paso 1: Context & Scan (`/primer`)

Ejecuta `/primer` para entender el proyecto actual:

1. Analizar estructura de carpetas
2. Detectar tech stack
3. Identificar dependencias
4. Mapear features existentes

**Guardar en memoria:**
- Tiene auth? (buscar `supabase/auth`, `proxy.ts`, login pages)
- Tiene payments? (buscar `stripe`, checkout, pricing)
- Tiene tests? (buscar `*.test.*`, `*.spec.*`, jest/vitest config)
- Tiene SEO? (buscar `metadata`, `sitemap`, structured data)
- Tiene docs? (buscar `docs/`, `README.md` completo, ADRs)

---

## Paso 2: Diagnostico Profundo

Ejecuta estos **3 analisis en secuencia**:

### 2A: Code Review
Ejecuta `/code-review --full`
- Captura TODOS los issues encontrados
- Clasificar por severidad: critical / warning / info

### 2B: Security Audit
Ejecuta `/security-audit`
- Captura vulnerabilidades encontradas
- Clasificar: high / medium / low

### 2C: Performance Analysis
Ejecuta `/optimize` (modo analisis, NO aplicar cambios aun)
- Bundle size issues
- Rendering problems
- Data fetching antipatterns
- Core Web Vitals

### Generar Reporte de Diagnostico

Crea `.planning/UPGRADE.md` usando el template de `skills/upgrade/templates/UPGRADE.md`:

```markdown
## Reporte de Diagnostico
### Code Review: X issues (Y critical, Z warnings)
### Security: X vulnerabilidades (Y high, Z medium)
### Performance: X optimizaciones identificadas
### Features faltantes: [lista]
```

**Si el modo es `--diagnostico`**: Mostrar reporte al usuario y PARAR aqui.

---

## Paso 3: Fix Critical Issues

**Prioridad: Solo arreglar lo CRITICO primero.**

### 3A: Security Fixes (High severity)
Para cada vulnerabilidad HIGH encontrada en 2B:
1. Aplicar fix automaticamente
2. Documentar que se cambio

### 3B: Code Fixes (Critical issues)
Para cada issue CRITICAL encontrado en 2A:
1. Ejecuta `/refactor-code` en los archivos afectados
2. Verificar que no se rompio nada

### 3C: Performance Fixes
Aplicar las optimizaciones identificadas en 2C:
1. Bundle optimizations (dynamic imports, tree shaking)
2. Rendering fixes (Server Components, memo)
3. Data fetching improvements (parallel queries, pagination)

---

## Paso 4: Test Coverage + SEO

### 4A: Generar Tests
Ejecuta `/generate-tests --full`
- Genera tests para TODO el codigo que no tiene cobertura
- Unit tests + Integration tests
- Ejecuta los tests para verificar que pasan

### 4B: SEO (si es web app)
Si el proyecto es una web app (tiene pages/routes):
1. Aplicar skill `seo-optimizer`:
   - Meta tags en todas las paginas
   - `sitemap.xml`
   - Structured data (JSON-LD)
   - Open Graph tags
   - `robots.txt`

**Si el modo es `--quality`**: Mostrar resumen de mejoras y PARAR aqui.

---

## Paso 5: Features Faltantes (Smart Detection)

Basado en el scan del Paso 1, ofrecer features que FALTAN:

### Si NO tiene Auth y el proyecto lo necesita:
```
→ Preguntar: "Tu proyecto no tiene autenticacion. Quieres que ejecute /add-login?"
→ Si acepta: ejecutar /add-login (Golden Path completo)
```

### Si NO tiene Payments y el proyecto lo necesita:
```
→ Preguntar: "Tu proyecto no tiene sistema de pagos. Quieres que ejecute /add-payments?"
→ Si acepta: ejecutar /add-payments (Stripe completo)
```

### Si NO tiene Landing y es un SaaS:
```
→ Preguntar: "Tu proyecto no tiene landing page. Quieres que ejecute /landing?"
→ Si acepta: ejecutar /landing
```

### Si usa Supabase y hay cambios de schema pendientes:
```
→ Ejecutar /supabase-schema-sync --push
```

**Si el modo es `--features`**: Ejecutar features y PARAR aqui.

---

## Paso 6: Auto-Blindaje V3

**CRITICO**: Documentar TODOS los errores encontrados para que nunca se repitan.

1. Recopilar errores de Paso 2 (diagnostico) + Paso 3 (fixes)

2. Para CADA error, agregar al CLAUDE.md del proyecto:

```markdown
### [YYYY-MM-DD]: [Titulo corto]
- **Error**: [Que se encontro]
- **Fix**: [Como se arreglo]
- **Prevencion**: [Como evitarlo en el futuro]
```

3. Agregar a la seccion `## Aprendizajes (Auto-Blindaje Activo)` del CLAUDE.md

---

## Paso 7: Documentation + Deploy

### 7A: Documentacion
Ejecuta `/create-architecture-documentation`
- C4 Models actualizados
- README.md completo
- API docs si aplica

### 7B: Deploy (preguntar primero)
```
→ Preguntar: "Todo listo. Quieres que haga deploy con /deploy?"
→ Si acepta: ejecutar /deploy
→ Si no: mostrar resumen final
```

---

## Resumen Final

Al terminar, mostrar:

```
🔧 UPGRADE COMPLETADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Diagnostico:
  - Code issues encontrados: X → Arreglados: Y
  - Vulnerabilidades: X → Parcheadas: Y
  - Optimizaciones: X → Aplicadas: Y

🧪 Calidad:
  - Tests generados: X archivos
  - SEO: [configurado/ya existia/N/A]

🛡️ Blindaje:
  - Aprendizajes documentados: X

📚 Documentacion:
  - Arquitectura: [generada/actualizada]

🚀 Deploy:
  - [desplegado a URL / pendiente]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
