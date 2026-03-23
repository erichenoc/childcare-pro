# Mapa de Coordinacion de Skills

Referencia interna para `consulta-diseno`. Define que skill cubre que, como resolver conflictos,
y que cargar en cada fase.

---

## Skills Disponibles

### Siempre Activos (se cargan en toda consulta)

| Skill | Rol Principal | Archivo Clave | Tokens Aprox |
|-------|--------------|---------------|-------------|
| **ui-ux-pro-max** | Motor de datos: 96 paletas, 67 estilos, 57 fuentes, 45 landing patterns | `scripts/search.py` | ~500 (script) |
| **elite-frontend-ux** | Tokens de diseno, WCAG 2.1 AA, patrones SaaS, anti-patrones | `SKILL.md` | ~3k |
| **frontend-design** | Mandato anti-generico, estetica bold, personalidad visual | `SKILL.md` | ~2k |

### Dependientes del Tono

| Tono del Proyecto | Skill | Archivo Clave | Tokens Aprox |
|-------------------|-------|---------------|-------------|
| Bold, creativo, experimental, startup | **bencium-innovative-ux-designer** | `SKILL.md` + `MOTION-SPEC.md` | ~5k |
| Conservador, corporativo, enterprise | **bencium-controlled-ux-designer** | `SKILL.md` + `RESPONSIVE-DESIGN.md` | ~5k |

**Regla:** Si no es claro, default a `bencium-innovative`.

### Bajo Demanda (cargar solo cuando se necesite)

| Necesidad | Skill | Archivo Especifico |
|-----------|-------|--------------------|
| Micro-interacciones | ui-agents | `animation/micro-interactions.md` |
| ARIA implementation | ui-agents | `accessibility/aria-implementation.md` |
| Mobile-first layout | ui-agents | `responsive/mobile-first-layout.md` |
| CSS architecture | ui-agents | `web-development/css-architecture.md` |
| Design system generation | ui-agents | `design-systems/design-system-generator.md` |
| User personas | ui-agents | `research/user-persona-generator.md` |
| React components | ui-agents | `development/react-component-generator.md` |
| Plugins Tailwind | tailwindcss-marketplace | `plugins/{nombre}/README.md` |

### Design Systems (cargar segun recomendacion)

| Sistema | Archivo | Cuando Usar |
|---------|---------|------------|
| Liquid Glass | `design-systems/liquid-glass/liquid-glass.md` | glass, blur, transparent, frosted, premium, Apple-like |
| Neumorphism | `design-systems/neumorphism/neumorphism.md` | soft, raised, inset, subtle, tactile, depth |
| Neobrutalism | `design-systems/neobrutalism/neobrutalism.md` | bold, raw, borders, hard-shadows, vibrant, punk |
| Bento Grid | `design-systems/bento-grid/bento-grid.md` | modular, grid, cards, bento, Apple, organized |
| Gradient Mesh | `design-systems/gradient-mesh/gradient-mesh.md` | gradient, mesh, flowing, aurora, Stripe, organic |

---

## Cobertura por Dominio

### Color / Paleta

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| Busqueda de paletas por industria/mood | ui-ux-pro-max (`--domain color`) | — |
| CSS variables y tokens | elite-frontend-ux (Seccion 2) | — |
| Contraste WCAG | elite-frontend-ux (Seccion 3) | — |
| Dark mode strategy | {design-system elegido} | elite-frontend-ux |
| Anti-patron: azul generico | frontend-design + elite-frontend-ux | — |

### Tipografia

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| Busqueda de font pairings | ui-ux-pro-max (`--domain typography`) | — |
| Escala tipografica | elite-frontend-ux (Seccion 2) | bencium (typography tokens) |
| Anti-patron: fuentes genericas | frontend-design + elite-frontend-ux | — |
| Responsive typography | bencium (RESPONSIVE-DESIGN.md) | ui-agents/responsive |

### Layout y Estructura

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| Patrones de landing page | ui-ux-pro-max (`--domain landing`) | — |
| Grid systems | {design-system elegido} | bencium |
| Mobile-first approach | ui-agents/responsive | bencium (RESPONSIVE-DESIGN.md) |
| Page architecture | elite-frontend-ux (Seccion 5-6) | — |

### Componentes

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| Recetas visuales (Button, Card, etc.) | {design-system elegido} | — |
| Plugins Tailwind | tailwindcss-marketplace | — |
| Patrones SaaS (pricing, auth, etc.) | elite-frontend-ux (Seccion 5-6) | — |
| Component generators | ui-agents/development | — |

### Animacion

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| Filosofia de motion | bencium (MOTION-SPEC.md) | — |
| Micro-interacciones | ui-agents/animation | tailwindcss-marketplace/animation-suite |
| Timing y easing | bencium (MOTION-SPEC.md) | — |
| Reduced motion | elite-frontend-ux (Seccion 3) | ui-agents/accessibility |

### Accesibilidad

| Aspecto | Skill Principal | Skill de Apoyo |
|---------|----------------|----------------|
| WCAG 2.1 AA guidelines | elite-frontend-ux (Seccion 3) | — |
| ARIA implementation | ui-agents/accessibility | — |
| Focus management | elite-frontend-ux | bencium (ACCESSIBILITY.md) |
| Screen reader support | ui-agents/accessibility | — |
| Touch targets | elite-frontend-ux (Seccion 3) | — |

---

## Resolucion de Conflictos

### Regla General
Cuando dos skills dan recomendaciones diferentes, la **preferencia del usuario** (tono/mood expresado en la consulta) decide.

### Reglas Especificas

| Conflicto | Resolucion |
|-----------|-----------|
| Color: ui-ux-pro-max sugiere paleta X, elite-frontend-ux dice que no cumple WCAG | **elite-frontend-ux gana** — accesibilidad no es negociable. Ajustar tonos de la paleta para cumplir contraste. |
| Tipografia: ui-ux-pro-max sugiere fuente, frontend-design dice que es generica | **frontend-design gana** — buscar alternativa con personalidad en ui-ux-pro-max. |
| Animacion: bencium-innovative quiere animaciones complejas, elite-frontend-ux pide reduced-motion | **Ambos** — implementar animaciones complejas con `prefers-reduced-motion` fallback. |
| Layout: design-system sugiere patron, bencium sugiere otro | **Design system gana** para componentes individuales. **Bencium gana** para estructura de pagina. |
| Estetica: bencium-innovative quiere bold, bencium-controlled quiere sutil | **Solo uno debe estar activo** — nunca cargar ambos. La eleccion se hace en Fase 4 del SKILL.md. |

### Anti-Patrones: Regla UNION

Los anti-patrones son siempre **UNION** (lo mas estricto). Si cualquier skill prohibe algo, queda prohibido.

Fuentes de anti-patrones:
1. `elite-frontend-ux` — anti-patrones de tokens y accesibilidad
2. `frontend-design` — anti-patrones de estetica generica
3. `bencium-{variant}` — anti-patrones de UX
4. `{design-system}` — anti-patrones especificos del sistema visual

La lista final en el Design Brief (Seccion 10) es la **union** de todas estas fuentes.

---

## Orden de Consulta (Pipeline)

Para **MODO NUEVO**, el pipeline de consulta es:

```
1. ui-ux-pro-max (datos)
   └─> Paleta, fuentes, estilo base

2. Matching: estilo → design system
   └─> Seleccionar 1 de 5 (o ninguno)

3. Matching: tono → bencium variant
   └─> innovative O controlled (nunca ambos)

4. elite-frontend-ux (tokens + WCAG)
   └─> Validar paleta contra contraste
   └─> Agregar tokens CSS

5. frontend-design (anti-generico)
   └─> Validar que nada es generico
   └─> Definir ancla de memorabilidad

6. Bajo demanda: ui-agents + tailwindcss-marketplace
   └─> Solo si se necesitan patrones especificos
```

Para **MODO EXISTENTE**, el pipeline es:

```
1. analyze_existing.py (deteccion)
   └─> Stack, colores, fuentes, estilo, accesibilidad, anti-patrones

2. ui-ux-pro-max (datos de referencia)
   └─> Buscar paleta/fuente mejorada para el contexto

3. Matching: estilo detectado → design system recomendado
   └─> Migrar o reforzar

4. elite-frontend-ux (auditoria)
   └─> Gaps de WCAG, tokens faltantes

5. frontend-design (auditoria estetica)
   └─> Elementos genericos a reemplazar

6. Generar Plan de Mejora con fixes priorizados
```

---

## Referencia Rapida de Comandos

### ui-ux-pro-max search.py

```bash
# Design system completo (paleta + fuentes + estilo)
python3 scripts/search.py "<tipo> <industria> <mood>" --design-system -p "<Nombre>"

# Solo paletas
python3 scripts/search.py "<industria> <mood>" --domain color

# Solo tipografia
python3 scripts/search.py "<mood> <tipo>" --domain typography

# Patrones de landing
python3 scripts/search.py "<tipo_pagina>" --domain landing

# Estilos UI
python3 scripts/search.py "<descripcion>" --domain style

# Guidelines de stack
python3 scripts/search.py "<necesidad>" --stack nextjs

# Persistir design system
python3 scripts/search.py "<query>" --design-system --persist -p "<Nombre>"

# Persistir con override de pagina
python3 scripts/search.py "<query>" --design-system --persist -p "<Nombre>" --page "<pagina>"
```

### analyze_existing.py

```bash
# Analisis completo (output legible)
python3 scripts/analyze_existing.py <ruta-proyecto>

# Analisis en JSON (para procesamiento)
python3 scripts/analyze_existing.py <ruta-proyecto> --json

# Analisis verbose (muestra archivos escaneados)
python3 scripts/analyze_existing.py <ruta-proyecto> --verbose
```

---

*Referencia interna de `/consulta-diseno` — SaaS Factory v3*
