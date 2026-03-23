---
description: "Analiza y optimiza el rendimiento de la aplicacion. Cubre bundle size, rendering, queries y Core Web Vitals"
---

# Performance Optimization

Analiza la aplicacion en busca de problemas de rendimiento y sugiere optimizaciones.

## Proceso

### Paso 1: Analisis del Bundle

1. Revisa `package.json` por dependencias pesadas innecesarias
2. Busca imports que deberian ser dinamicos (`dynamic()` de Next.js)
3. Verifica que las imagenes usan `next/image` con `sizes` apropiados
4. Busca barrel exports que causan import bloat (ej: `import { X } from '@/shared'`)

### Paso 2: Analisis de Rendering

1. Busca componentes con `"use client"` que podrian ser Server Components
2. Identifica re-renders innecesarios (falta de `React.memo`, selectores de Zustand)
3. Busca layout shifts (elementos sin dimensiones definidas)
4. Verifica uso correcto de `Suspense` boundaries

### Paso 3: Analisis de Data Fetching

1. Busca requests en waterfall (secuenciales cuando podrian ser paralelos)
2. Verifica que queries de Supabase usan `.select()` con campos especificos (no `select('*')`)
3. Busca patrones N+1 (loop con queries individuales)
4. Verifica paginacion en datasets grandes

### Paso 4: Quick Wins

Implementa automaticamente las optimizaciones de bajo riesgo:
- Agregar `loading="lazy"` a imagenes below the fold
- Convertir imports estaticos a dinamicos donde sea seguro
- Agregar selectores a stores de Zustand

### Paso 5: Reporte

```
## ⚡ Performance Report - [Fecha]

### Quick Wins (implementados)
✅ [Optimizacion]: [Mejora esperada]

### Optimizaciones Recomendadas
📋 [Optimizacion]: [Esfuerzo] - [Impacto esperado]

### Arquitecturales (largo plazo)
🏗️ [Optimizacion]: [Esfuerzo] - [Impacto esperado]
```
