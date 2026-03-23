---
name: consulta-diseno
description: "Orquestador de diseno. Punto de entrada unico para TODAS las decisiones de diseno antes de escribir codigo frontend. Coordina 6 skills de diseno y 5 design systems. Usar cuando: iniciar proyecto web nuevo, mejorar UI existente, elegir design system, planificar arquitectura visual. Triggers: 'quiero disenar', 'mejorar el diseno', 'nuevo proyecto web', 'consulta de diseno', 'plan visual', 'design brief', '/consulta-diseno'."
---

# Consulta de Diseno - Orquestador

**REGLA CRITICA:** NUNCA escribas codigo frontend sin completar esta consulta primero. Este skill es el paso obligatorio antes de implementar cualquier interfaz.

## Cuando Activar

- Usuario dice: "quiero disenar", "nuevo proyecto web", "mejorar el diseno", "plan visual", "design brief"
- Usuario invoca: `/consulta-diseno`
- Usuario pide crear una pagina web, landing page, dashboard, o cualquier interfaz
- Usuario pide mejorar/redisenar un proyecto existente

## Deteccion de Modo

Determina automaticamente el modo:

**MODO NUEVO** (default):
- Usuario habla de un proyecto que aun no existe
- No hay `tailwind.config.*`, `globals.css`, o `package.json` en el directorio de trabajo

**MODO EXISTENTE**:
- Usuario menciona proyecto existente, da una ruta, o dice "mejorar/redisenar"
- Existe `tailwind.config.*` o `package.json` en el directorio de trabajo
- Usuario comparte URL de sitio actual

---

## MODO NUEVO: Crear Design Brief

### Fase 1: Preguntas Estrategicas

Haz estas preguntas ANTES de cualquier recomendacion. Presenta todas juntas para que el usuario responda de una vez:

```
Antes de disenar, necesito entender tu proyecto:

1. Que hace tu producto/servicio? Quien es el usuario principal?
2. Que industria? (SaaS, e-commerce, healthcare, restaurante, fintech, educacion, beauty, otro)
3. Que sentimiento debe transmitir? Elige uno:
   - Confianza/Profesional
   - Energia/Entusiasmo
   - Calma/Serenidad
   - Urgencia/Accion
   - Lujo/Premium
   - Diversion/Playful
   - Innovacion/Tech-forward
4. Hay marcas o sitios web que admires como referencia?
5. Que paginas necesitas? (landing, dashboard, auth, pricing, blog, contacto, etc.)
6. Stack preferido? (default: Next.js + Tailwind CSS)
7. Restricciones? (colores de marca existentes, dark mode obligatorio, nivel de accesibilidad, etc.)
```

### Fase 2: Consultar Base de Datos de Diseno

Con las respuestas, ejecuta el motor de busqueda de ui-ux-pro-max:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<tipo_producto> <industria> <sentimiento>" --design-system -p "<Nombre del Proyecto>"
```

Esto retorna: patron recomendado, estilo UI, paleta de 5 colores (hex), tipografia (heading + body con Google Fonts URL), efectos clave, y anti-patrones.

Si necesitas busquedas mas especificas:
```bash
# Paletas por industria
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<industria> <mood>" --domain color

# Tipografia alternativa
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<mood> <tipo>" --domain typography

# Patrones de landing page
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<tipo_pagina>" --domain landing

# Guidelines por stack
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<necesidad>" --stack nextjs
```

### Fase 3: Recomendar Design System

Cruza el estilo recomendado contra los 5 design systems disponibles:

| Keywords del Estilo | Design System | Archivo de Referencia |
|--------------------|--------------|-----------------------|
| glass, blur, transparent, fluid, frosted, premium | **Liquid Glass** | `design-systems/liquid-glass/liquid-glass.md` |
| soft, raised, inset, subtle, tactile, depth | **Neumorphism** | `design-systems/neumorphism/neumorphism.md` |
| bold, raw, borders, hard-shadows, vibrant, punk | **Neobrutalism** | `design-systems/neobrutalism/neobrutalism.md` |
| modular, grid, cards, bento, Apple, organized | **Bento Grid** | `design-systems/bento-grid/bento-grid.md` |
| gradient, mesh, flowing, aurora, Stripe, organic | **Gradient Mesh** | `design-systems/gradient-mesh/gradient-mesh.md` |
| minimal, flat, clean, Swiss, editorial | **Ninguno** (usar solo tokens de elite-frontend-ux) | - |
| mixed/custom | **Combinar** elementos de multiples sistemas | Multiples |

Si no es claro, presenta las 2-3 mejores opciones con razon y deja que el usuario elija.

**IMPORTANTE:** Lee el archivo .md del design system elegido para aplicar sus recetas de componentes.

### Fase 4: Ensamblar Skills

Determina que combinacion de skills usar:

**Siempre activos:**
- `ui-ux-pro-max` — Motor de datos (paletas, fuentes, estilos)
- `elite-frontend-ux` — Tokens de diseno, WCAG, patrones SaaS
- `frontend-design` — Mandato anti-generico, estetica bold

**Segun tono del proyecto:**
- Tono bold/creativo/experimental → Cargar `bencium-innovative-ux-designer`
- Tono conservador/corporativo/sistematico → Cargar `bencium-controlled-ux-designer`
- Si no esta claro, default: `bencium-innovative-ux-designer`

**Bajo demanda (durante implementacion):**
- Micro-interacciones → `ui-agents/animation/micro-interactions.md`
- Accesibilidad ARIA → `ui-agents/accessibility/aria-implementation.md`
- Mobile-first → `ui-agents/responsive/mobile-first-layout.md`
- CSS Architecture → `ui-agents/web-development/css-architecture.md`
- Componentes Tailwind → `tailwindcss-marketplace/plugins/[nombre]/README.md`

### Fase 5: Generar Design Brief

Genera el documento siguiendo la plantilla en `references/design-brief-template.md`. Las 12 secciones obligatorias son:

1. **Resumen del Proyecto** — Nombre, tipo, audiencia, objetivo
2. **Direccion de Diseno** — Tono, compromiso estetico, ancla de memorabilidad
3. **Design System** — Cual de los 5 (o ninguno), con personalizaciones
4. **Paleta de Colores** — 5 colores con hex, rol, CSS variable, clase Tailwind
5. **Tipografia** — Heading + body fonts, escala, Google Fonts URL
6. **Arquitectura de Paginas** — Lista de paginas con patron de layout
7. **Estrategia de Componentes** — Plugins de Tailwind recomendados, shadcn o custom
8. **Accesibilidad** — Nivel WCAG, reglas clave, contraste minimo, touch targets
9. **Animacion e Interaccion** — Filosofia de motion, timing, reduced-motion
10. **Anti-Patrones** — Lista especifica para ESTE proyecto
11. **Checklist Pre-Implementacion** — Tareas antes de codear
12. **Referencias de Skills** — Que skill cargar para cada fase de implementacion

**Presenta el Design Brief al usuario para aprobacion ANTES de escribir codigo.**

### Fase 6: Persistir (Opcional)

Si el usuario aprueba, persistir el design system:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<Nombre>"
```

Para paginas con tratamiento especial:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "<Nombre>" --page "<pagina>"
```

### Fase 7: Seleccionar Componentes Pre-Disenados

**OBLIGATORIO.** Consulta `.claude/skills/component-libraries/SKILL.md` y selecciona:

1. **Secciones de pagina** de Shadcnblocks (hero, features, pricing, etc.)
2. **Efectos animados** de Magic UI (shimmer, beams, text-reveal, etc.)
3. **Efectos premium** de Aceternity UI si el proyecto lo requiere (3D, parallax)
4. **Micro-interacciones** de Motion Primitives (text-effect, in-view, etc.)
5. **Componentes base mejorados** de Origin UI (inputs, buttons, selects)

Consulta las recetas en `.claude/skills/component-libraries/references/page-recipes.md` para recetas completas por tipo de pagina.

Agrega al Design Brief:
- Lista de componentes a instalar con comandos exactos
- Seccion "Receta de Componentes" con estructura de la pagina

---

## MODO EXISTENTE: Plan de Mejora

### Fase 1: Analizar Proyecto

Ejecuta el script de analisis:

```bash
python3 .claude/skills/consulta-diseno/scripts/analyze_existing.py <ruta-del-proyecto>
```

El script detecta:
- **Stack**: Framework, styling, version
- **Diseno actual**: Colores, fuentes, estilo dominante (glassmorphism, neumorphism, etc.)
- **Accesibilidad**: aria-*, sr-only, focus patterns, alt coverage
- **Anti-patrones**: Fuentes genericas (Inter/Roboto/Arial), colores hardcodeados, emojis como iconos, missing cursor-pointer

Si el script no puede ejecutarse, haz el analisis manualmente:
1. Lee `tailwind.config.ts/js` para colores y fuentes
2. Lee `globals.css` o `app/globals.css` para CSS variables
3. Revisa 3-5 componentes principales para detectar patrones
4. Busca `aria-`, `role=`, `sr-only` en el proyecto

### Fase 2: Diagnosticar

Mapea hallazgos contra los skills de diseno:

- **Consistencia de estilo**: Cuantos paradigmas visuales estan mezclados?
- **Coherencia de color**: Paleta unificada o colores dispersos?
- **Tipografia**: Fuentes consistentes? Son genericas?
- **Accesibilidad**: Gaps en ARIA, contraste, touch targets?
- **Anti-patrones**: Segun listas de elite-frontend-ux + frontend-design + bencium

### Fase 3: Generar Plan de Mejora

Sigue la plantilla en `references/improvement-plan-template.md`:

1. **Estado Actual** — Stack, estilo detectado, paleta, fuentes
2. **Problemas Encontrados** — Severidad: critico/alto/medio/bajo
3. **Migracion de Design System** — Si aplica
4. **Actualizacion de Paleta** — Before/after con hex
5. **Actualizacion de Tipografia** — Before/after con Google Fonts
6. **Fixes por Componente** — Archivo + guia especifica
7. **Remediacion de Accesibilidad** — WCAG gaps y fixes
8. **Orden de Prioridad** — Que arreglar primero
9. **Esfuerzo Estimado** — Por fix

**Presenta el Plan de Mejora al usuario para aprobacion ANTES de hacer cambios.**

---

## Tabla de Referencia Rapida

| Necesito... | Cargar este Skill | Archivo Clave |
|------------|-------------------|---------------|
| Paletas de colores | ui-ux-pro-max | `scripts/search.py --domain color` |
| Tipografia | ui-ux-pro-max | `scripts/search.py --domain typography` |
| Tokens de diseno | elite-frontend-ux | `SKILL.md` Seccion 2 |
| Estetica bold | frontend-design | `SKILL.md` completo |
| Direccion creativa | bencium-innovative | `SKILL.md` + `MOTION-SPEC.md` |
| Diseno sistematico | bencium-controlled | `SKILL.md` + `RESPONSIVE-DESIGN.md` |
| Patrones SaaS | elite-frontend-ux | `SKILL.md` Secciones 5-6 |
| WCAG compliance | elite-frontend-ux | `SKILL.md` Seccion 3 |
| Plugins Tailwind | tailwindcss-marketplace | `plugins/[nombre]/README.md` |
| ARIA | ui-agents | `accessibility/aria-implementation.md` |
| Mobile-first | ui-agents | `responsive/mobile-first-layout.md` |
| Micro-interacciones | ui-agents | `animation/micro-interactions.md` |
| Glassmorphism | design-systems | `liquid-glass/liquid-glass.md` |
| Hard shadows | design-systems | `neobrutalism/neobrutalism.md` |
| Soft shadows | design-systems | `neumorphism/neumorphism.md` |
| Grids modulares | design-systems | `bento-grid/bento-grid.md` |
| Gradientes fluidos | design-systems | `gradient-mesh/gradient-mesh.md` |

---

## Reglas de Output

1. **NUNCA** escribas codigo frontend sin completar la consulta
2. **SIEMPRE** presenta el Design Brief / Plan de Mejora para aprobacion del usuario
3. Si el usuario dice "solo construyelo", genera minimo: paleta, tipografia, y design system
4. El brief es un documento VIVO - actualizalo si cambian los requerimientos
5. Al implementar, carga los skills referenciados en la seccion 12 del brief
