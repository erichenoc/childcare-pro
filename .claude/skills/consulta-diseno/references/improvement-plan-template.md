# Plan de Mejora Template — Proyectos Existentes

Usa esta plantilla para generar el Plan de Mejora. Cada seccion es **obligatoria**.
Rellena con datos de `analyze_existing.py` + consultas a los skills de diseno.

---

## 1. Estado Actual

### Stack Detectado

| Campo | Valor |
|-------|-------|
| **Framework** | {Next.js 14 / React 18 / Vue 3 / Svelte / otro} |
| **Styling** | {Tailwind CSS / CSS Modules / styled-components / otro} |
| **UI Library** | {shadcn/ui / MUI / Chakra / ninguna} |
| **Version Tailwind** | {version o N/A} |
| **TypeScript** | {Si / No} |

### Estilo Detectado

| Senial | Presencia | Confianza |
|--------|-----------|-----------|
| Glassmorphism (backdrop-blur, bg-opacity) | {Si/No} | {alta/media/baja} |
| Neumorphism (shadow-inner, bg-gray-100) | {Si/No} | {alta/media/baja} |
| Neobrutalism (border-2+, shadow-[offset]) | {Si/No} | {alta/media/baja} |
| Bento Grid (grid-cols, aspect-square) | {Si/No} | {alta/media/baja} |
| Gradient Mesh (bg-gradient, from-/to-) | {Si/No} | {alta/media/baja} |
| Sin sistema definido | {Si/No} | — |

**Estilo dominante:** {nombre o "mixto/indefinido"}

### Paleta Actual

| Fuente | Colores Encontrados |
|--------|-------------------|
| tailwind.config | {lista de colores custom} |
| CSS variables | {lista de variables} |
| Clases hardcoded | {colores encontrados en componentes} |

### Tipografia Actual

| Fuente | Valor |
|--------|-------|
| Heading font | {nombre o "system default"} |
| Body font | {nombre o "system default"} |
| Fuente en tailwind.config | {Si/No — que fuente} |
| Google Fonts importada | {Si/No — cuales} |

---

## 2. Problemas Encontrados

### Criticos (arreglar primero)

| # | Problema | Ubicacion | Impacto |
|---|---------|-----------|---------|
| C1 | {descripcion} | {archivo:linea o patron} | {que causa} |
| C2 | ... | ... | ... |

### Altos

| # | Problema | Ubicacion | Impacto |
|---|---------|-----------|---------|
| A1 | {descripcion} | {archivo o patron} | {que causa} |
| A2 | ... | ... | ... |

### Medios

| # | Problema | Ubicacion | Impacto |
|---|---------|-----------|---------|
| M1 | {descripcion} | {archivo o patron} | {que causa} |
| M2 | ... | ... | ... |

### Bajos

| # | Problema | Ubicacion | Impacto |
|---|---------|-----------|---------|
| B1 | {descripcion} | {archivo o patron} | {que causa} |
| B2 | ... | ... | ... |

---

## 3. Migracion de Design System

> Solo incluir esta seccion si se recomienda adoptar o cambiar de design system.

| Campo | Valor |
|-------|-------|
| **Estilo actual** | {descripcion del estilo detectado} |
| **Design System recomendado** | {Liquid Glass / Neumorphism / Neobrutalism / Bento Grid / Gradient Mesh / Ninguno} |
| **Razon** | {por que este sistema es mejor para el proyecto} |
| **Archivo de referencia** | {design-systems/{nombre}/{nombre}.md} |
| **Nivel de esfuerzo** | {bajo: solo tokens / medio: tokens + componentes / alto: reestructuracion} |

### Plan de Migracion

1. {paso 1 — generalmente: actualizar tailwind.config con tokens del nuevo DS}
2. {paso 2 — actualizar globals.css con CSS variables}
3. {paso 3 — migrar componentes base (Button, Card, Input)}
4. {paso 4 — migrar layouts de pagina}
5. {paso 5 — verificar consistencia visual}

---

## 4. Actualizacion de Paleta

### Before / After

| Rol | Antes (hex) | Despues (hex) | Razon del cambio |
|-----|-------------|---------------|-------------------|
| Primary | {#actual} | {#nuevo} | {razon} |
| Secondary | {#actual} | {#nuevo} | {razon} |
| Accent | {#actual} | {#nuevo} | {razon} |
| Background | {#actual} | {#nuevo} | {razon} |
| Text | {#actual} | {#nuevo} | {razon} |

### Implementacion

```javascript
// tailwind.config.ts — colors section
colors: {
  primary: '{#nuevo}',
  secondary: '{#nuevo}',
  accent: '{#nuevo}',
  // ... resto
}
```

```css
/* globals.css — CSS variables */
:root {
  --color-primary: {#nuevo};
  --color-secondary: {#nuevo};
  --color-accent: {#nuevo};
}
```

**Contraste WCAG AA verificado:**
- Text sobre Background: {ratio} — {PASS/FAIL}
- Primary sobre Background: {ratio} — {PASS/FAIL}

---

## 5. Actualizacion de Tipografia

### Before / After

| Rol | Antes | Despues | Razon |
|-----|-------|---------|-------|
| Heading | {fuente actual} | {fuente nueva} | {razon} |
| Body | {fuente actual} | {fuente nueva} | {razon} |

### Implementacion

```javascript
// tailwind.config.ts — fontFamily section
fontFamily: {
  heading: ['{nueva heading}', '{fallback}'],
  body: ['{nueva body}', '{fallback}'],
}
```

**Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family={Heading}:wght@{weights}&family={Body}:wght@{weights}&display=swap
```

---

## 6. Fixes por Componente

### Fix Template

Para cada fix, usar este formato:

---

**Fix {ID}: {Titulo}** — Severidad: {critico/alto/medio/bajo}

**Archivo(s):** `{ruta/al/archivo.tsx}`

**Problema:** {descripcion concisa del problema}

**Solucion:**

```diff
- {codigo actual}
+ {codigo corregido}
```

**Skill de referencia:** {que skill consultar para la implementacion}

---

{Repetir para cada fix identificado}

---

## 7. Remediacion de Accesibilidad

### Gaps Detectados

| # | Gap | Severidad | Archivos Afectados |
|---|-----|-----------|-------------------|
| ACC1 | {descripcion — ej: botones sin aria-label} | {critico/alto/medio} | {lista de archivos} |
| ACC2 | {falta de sr-only en iconos} | ... | ... |
| ACC3 | {contraste insuficiente en texto secundario} | ... | ... |
| ACC4 | {touch targets menores a 44px} | ... | ... |
| ACC5 | {sin focus-visible en elementos interactivos} | ... | ... |

### Remediation por Gap

**ACC1: {Titulo}**
- Patron a aplicar: {codigo o referencia}
- Archivos a modificar: {lista}
- Referencia: `elite-frontend-ux` Seccion 3 / `ui-agents/accessibility/aria-implementation.md`

{Repetir para cada gap}

### Metricas de Accesibilidad

| Metrica | Actual | Target |
|---------|--------|--------|
| Cobertura aria-* | {X}% elementos interactivos | 100% |
| Cobertura alt text | {X}% imagenes | 100% |
| Focus visible | {presente/ausente} | Todos los focusables |
| Semantic HTML | {X} tags semanticos | header, nav, main, section, footer |

---

## 8. Orden de Prioridad

Orden recomendado de implementacion:

| Orden | Fix ID | Descripcion | Dependencias |
|-------|--------|-------------|-------------|
| 1 | {C1} | {titulo} | Ninguna |
| 2 | {C2} | {titulo} | {depende de C1} |
| 3 | {A1} | {titulo} | Ninguna |
| ... | ... | ... | ... |

### Fases de Implementacion

**Fase 1 — Fundaciones** (hacer primero):
- [ ] Actualizar tailwind.config con nueva paleta y tipografia
- [ ] Actualizar globals.css con CSS variables
- [ ] Importar Google Fonts
- [ ] {otros fixes criticos de fundacion}

**Fase 2 — Componentes Core**:
- [ ] Migrar componentes base (Button, Card, Input)
- [ ] Aplicar design system recipes
- [ ] {fixes de componentes}

**Fase 3 — Layout y Paginas**:
- [ ] Actualizar layouts de pagina
- [ ] Aplicar patrones de design system
- [ ] {fixes de layout}

**Fase 4 — Polish**:
- [ ] Accesibilidad (aria, focus, contrast)
- [ ] Animaciones y micro-interacciones
- [ ] Responsive verification
- [ ] {fixes de polish}

---

## 9. Esfuerzo Estimado

| Fase | Fixes Incluidos | Archivos a Tocar | Complejidad |
|------|----------------|-------------------|------------|
| Fase 1 — Fundaciones | {IDs} | {N} archivos | {baja/media/alta} |
| Fase 2 — Componentes | {IDs} | {N} archivos | {baja/media/alta} |
| Fase 3 — Layout | {IDs} | {N} archivos | {baja/media/alta} |
| Fase 4 — Polish | {IDs} | {N} archivos | {baja/media/alta} |

**Total archivos a modificar:** {N}
**Fixes criticos/altos:** {N}
**Fixes medios/bajos:** {N}

---

*Generado por `/consulta-diseno` (Modo Existente) — SaaS Factory v3*
