# Upgrade Skill - Instrucciones Detalladas

> Logica granular del meta-orquestador para mejorar proyectos existentes.
> Complementa al comando `/upgrade` con detalles de implementacion por fase.

---

## Filosofia

El `/upgrade` sigue el principio de **"Primero no hacer dano"**:

1. **Diagnosticar** antes de tocar nada
2. **Arreglar** solo lo critico primero
3. **Mejorar** incrementalmente
4. **Documentar** todo lo que se cambio
5. **Blindar** para que no se repita

---

## Smart Detection: Que tiene el proyecto?

### Deteccion de Auth
```
Buscar:
- proxy.ts o middleware.ts en root
- src/lib/supabase/ o src/features/auth/
- @supabase/ssr en package.json
- Paginas /login, /signup, /auth

Resultado: has_auth = true/false
```

### Deteccion de Payments
```
Buscar:
- stripe en package.json
- src/features/payments/ o src/features/billing/
- Webhooks de stripe
- Paginas /pricing, /checkout, /billing

Resultado: has_payments = true/false
```

### Deteccion de Tests
```
Buscar:
- jest.config.* o vitest.config.*
- Archivos *.test.* o *.spec.*
- Scripts test en package.json
- Directorio __tests__/

Resultado: has_tests = true/false
  test_coverage_estimate = "none" | "low" | "medium" | "high"
```

### Deteccion de SEO
```
Buscar:
- metadata exports en layout.tsx/page.tsx
- sitemap.ts o sitemap.xml
- robots.ts o robots.txt
- generateMetadata() en pages
- JSON-LD structured data

Resultado: has_seo = true/false
  seo_completeness = "none" | "partial" | "complete"
```

### Deteccion de Documentation
```
Buscar:
- docs/ directorio con contenido
- README.md con >100 lineas
- ADRs (Architecture Decision Records)
- API documentation

Resultado: has_docs = true/false
  docs_quality = "none" | "basic" | "complete"
```

### Deteccion de Landing
```
Buscar:
- Pagina principal con hero section
- Seccion de pricing
- CTA (call to action) components
- Testimonials o social proof

Resultado: has_landing = true/false
```

---

## Reglas de Ejecucion

### Regla 1: No romper lo existente
- Antes de cada fix, verificar que los tests existentes pasan
- Si no hay tests, crear tests ANTES de refactorizar
- Hacer cambios incrementales, nunca reescrituras masivas

### Regla 2: Preguntar antes de features nuevas
- Las features faltantes (auth, payments, landing) SIEMPRE preguntar
- Los fixes de seguridad y calidad se aplican automaticamente
- El deploy SIEMPRE pregunta confirmacion

### Regla 3: Documentar todo
- Cada cambio significativo se documenta en UPGRADE.md
- Errores encontrados van al Auto-Blindaje
- El resumen final muestra metricas before/after

### Regla 4: Fail gracefully
- Si un paso falla, documentar el error y continuar
- No parar el upgrade completo por un fallo individual
- Marcar pasos fallidos para revision manual

---

## Clasificacion de Severidad

### Code Review Issues
| Severidad | Descripcion | Accion |
|-----------|-------------|--------|
| **critical** | Bugs activos, memory leaks, data loss | Fix automatico inmediato |
| **warning** | Code smells, malas practicas, DRY violations | Fix en Paso 3 |
| **info** | Estilo, naming, sugerencias | Documentar, no arreglar |

### Security Vulnerabilities
| Severidad | Descripcion | Accion |
|-----------|-------------|--------|
| **high** | XSS, SQL injection, auth bypass, exposed secrets | Fix automatico inmediato |
| **medium** | CSRF, insecure cookies, missing headers | Fix en Paso 3 |
| **low** | Informational, best practices | Documentar en blindaje |

### Performance Issues
| Severidad | Descripcion | Accion |
|-----------|-------------|--------|
| **critical** | Bundle >500KB, N+1 queries, blocking renders | Fix automatico |
| **warning** | Missing lazy load, select('*'), no pagination | Fix en Paso 3 |
| **info** | Minor optimizations, nice-to-haves | Documentar |

---

## Modos de Ejecucion

### Modo `--full` (default)
Ejecuta TODAS las fases 1-7. Tiempo estimado: 20-45 min.

### Modo `--diagnostico`
Solo fases 1-2. **NO modifica nada**. Genera reporte.
Tiempo estimado: 5-10 min.
Ideal para: "Quiero saber que problemas tiene mi proyecto"

### Modo `--quality`
Fases 1-4. Diagnostica + arregla + tests + SEO.
Tiempo estimado: 15-25 min.
Ideal para: "Quiero mejorar la calidad sin agregar features"

### Modo `--features`
Fases 1, 5. Diagnostica + agrega features faltantes.
Tiempo estimado: 10-20 min.
Ideal para: "Quiero agregar auth/payments/landing"

---

## Integracion con Auto-Blindaje V3

El Auto-Blindaje en `/upgrade` es especialmente valioso porque:

1. **Errores en proyecto existente** = errores que la fabrica NO previno
2. Documentarlos mejora la fabrica para TODOS los proyectos futuros
3. Cada `/upgrade` hace la fabrica mas inteligente

### Formato de Aprendizaje
```markdown
### [YYYY-MM-DD] Upgrade: [nombre-proyecto]
- **Encontrado**: [X issues de code review, Y vulnerabilidades, Z optimizaciones]
- **Patron comun**: [Si hay un patron que se repite]
- **Prevencion**: [Que deberia hacer /autopilot para evitar esto en nuevos proyectos]
```

---

## Diferencias clave: /upgrade vs /autopilot

| Aspecto | /autopilot | /upgrade |
|---------|-----------|----------|
| **Para** | Proyectos NUEVOS | Proyectos EXISTENTES |
| **Empieza con** | /gsd:new-project | /primer (analisis) |
| **Construye?** | SI, desde cero | NO, mejora lo existente |
| **Features** | Auto-detecta de descripcion | Auto-detecta del codigo |
| **Pregunta?** | No, ejecuta Golden Path | Si, para features nuevas |
| **Output** | Proyecto completo | Proyecto mejorado |
