---
name: web-designer-definitivo
description: "Ultimate Web Designer system that orchestrates 4 integrated tools for end-to-end web design and implementation. Use when building complete web interfaces from concept to production React components. Combines UI/UX Pro Max (design intelligence), NanoBanana MCP (AI image generation via Gemini), Google Stitch MCP (HTML/CSS generation), and 21st Dev Magic MCP (premium React/Tailwind components). Workflow: design system -> mockup images -> HTML/CSS prototype -> production React components."
license: MIT
---

# Web Designer Definitivo - Sistema Completo de Diseno Web

Sistema integrado que combina 4 herramientas especializadas para crear interfaces web profesionales desde el concepto hasta componentes React de produccion. Cada herramienta cubre una fase del pipeline de diseno.

## Purpose

Orquestar un flujo de trabajo completo de diseno web donde:
1. Se genera un **design system fundamentado** con datos reales (estilos, colores, tipografia, UX)
2. Se crean **mockups visuales con IA** para validar la vision antes de codificar
3. Se genera **HTML/CSS funcional** como prototipo rapido
4. Se producen **componentes React/Tailwind de produccion** listos para integrar

## When to Use

Activar este skill cuando el usuario solicite:
- Disenar y construir una interfaz web completa (landing, dashboard, SaaS, etc.)
- Crear un sitio web desde cero con diseno profesional
- Generar mockups visuales antes de implementar
- Convertir un concepto en componentes React de produccion
- Necesite un flujo end-to-end: diseno -> prototipo -> componentes

**No usar cuando:**
- Solo se necesita un componente aislado (usar `frontend-design` o `ui-ux-pro-max`)
- Solo se necesita generar imagenes (usar NanoBanana directamente)
- El proyecto ya tiene design system definido y solo falta implementar

## The 4 Tools

### Tool 1: UI/UX Pro Max GO (Skill - Design Intelligence)

**Tipo:** Skill local (`.claude/skills/ui-ux-pro-max/`)
**Funcion:** Base de conocimiento de diseno con datos cuantificados.

| Recurso | Cantidad | Uso |
|---------|----------|-----|
| Estilos UI | 67+ | Glassmorphism, Brutalism, Neumorphism, etc. |
| Paletas de color | 161+ | Por tipo de producto e industria |
| Combos tipograficos | 57+ | Google Fonts pairings con personalidad |
| Reglas UX | 99+ | Accesibilidad, interaccion, performance |
| Stacks | 10 | React, Next.js, Vue, Svelte, Flutter, etc. |

**Comando principal:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Project Name"
```

### Tool 2: NanoBanana MCP (Image Generation via Gemini)

**Tipo:** MCP Server
**Comando:** `uvx nanobanana-mcp-server@latest`
**Requiere:** `GEMINI_API_KEY`
**Funcion:** Genera imagenes con Gemini AI para mockups, hero images, iconos, y assets visuales.

**Capacidades:**
- Generar mockups de UI basados en descripcion textual
- Crear hero images, backgrounds, e ilustraciones
- Producir iconos y assets visuales para la interfaz
- Iterar visualmente antes de escribir codigo

### Tool 3: Google Stitch MCP (HTML/CSS Generation)

**Tipo:** MCP Server
**Comando:** `npx @_davideast/stitch-mcp proxy`
**Funcion:** Genera interfaces HTML/CSS completas a partir de descripciones o imagenes.

**Capacidades:**
- Convertir descripciones textuales en HTML/CSS funcional
- Transformar mockups/imagenes en codigo HTML
- Generar prototipos rapidos con CSS puro
- Producir layouts responsive listos para iterar

### Tool 4: 21st Dev Magic MCP (Premium React Components)

**Tipo:** MCP Server
**Comando:** `npx -y @21st-dev/magic@latest`
**Requiere:** `TWENTY_FIRST_API_KEY`
**Funcion:** Genera componentes React/Tailwind premium, listos para produccion.

**Capacidades:**
- Generar componentes React con Tailwind CSS
- Producir variantes (light/dark, sizes, states)
- Crear componentes animados con Framer Motion
- Seguir patrones de shadcn/ui y Radix UI

---

## Workflow Completo (Pipeline de 4 Fases)

```
FASE 1              FASE 2              FASE 3              FASE 4
UI/UX Pro Max  -->  NanoBanana     -->  Google Stitch  -->  21st Dev Magic
(Design System)     (Mockup Visual)     (HTML/CSS)          (React Components)
```

### Fase 1: Generar Design System (UI/UX Pro Max)

**Objetivo:** Establecer las reglas de diseno fundamentadas en datos.

```bash
# Generar design system completo
python3 skills/ui-ux-pro-max/scripts/search.py "<producto> <industria> <keywords>" --design-system -p "Nombre Proyecto"

# Ejemplo: SaaS de finanzas personales
python3 skills/ui-ux-pro-max/scripts/search.py "fintech personal finance dashboard modern" --design-system -p "MoneyFlow"
```

**Output esperado:**
- Estilo recomendado (ej: Glassmorphism + Minimalism)
- Paleta de colores con hex codes
- Font pairing (heading + body)
- Reglas UX prioritizadas
- Anti-patrones a evitar

**Persistir para el proyecto:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

### Fase 2: Generar Mockups Visuales (NanoBanana MCP)

**Objetivo:** Crear representaciones visuales del diseno antes de codificar.

Usar NanoBanana MCP para generar imagenes basadas en el design system de la Fase 1.

**Prompt pattern para mockups:**
```
Genera un mockup de [tipo de pagina] con estas especificaciones:
- Estilo: [estilo del design system]
- Colores: [paleta del design system]
- Tipografia: [fonts del design system]
- Layout: [descripcion del layout]
- Elementos clave: [hero, navbar, cards, etc.]
```

**Iteracion visual:**
1. Generar mockup inicial
2. Revisar con el usuario
3. Ajustar prompt y regenerar si es necesario
4. Aprobar vision final antes de pasar a codigo

### Fase 3: Generar HTML/CSS Prototype (Google Stitch MCP)

**Objetivo:** Convertir el mockup aprobado en codigo HTML/CSS funcional.

Usar Google Stitch MCP para generar el prototipo:

**Input para Stitch:**
- Descripcion detallada basada en el design system (Fase 1)
- Mockup visual como referencia (Fase 2)
- Especificaciones de responsive design

**Output:**
- HTML semantico
- CSS con las paletas y tipografia del design system
- Layout responsive
- Prototipo navegable

### Fase 4: Producir Componentes React (21st Dev Magic MCP)

**Objetivo:** Convertir el prototipo en componentes React/Tailwind de produccion.

Usar 21st Dev Magic MCP para generar componentes finales:

**Workflow:**
1. Tomar el HTML/CSS de Stitch como referencia
2. Solicitar componentes React individuales con 21st Dev Magic
3. Aplicar el design system (colores como CSS variables, font imports)
4. Agregar interactividad (hover states, animations, transitions)
5. Verificar accesibilidad (ARIA, keyboard nav, focus states)

**Estructura de salida Feature-First:**
```
src/features/[feature-name]/
  components/
    hero-section.tsx
    feature-grid.tsx
    pricing-table.tsx
    testimonial-carousel.tsx
  types/
    index.ts
```

---

## Ejemplo Completo: Landing Page para SaaS de Productividad

### Fase 1: Design System
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "saas productivity tool modern clean" --design-system -p "TaskFlow Pro"
```
Resultado: Minimalism + Glassmorphism, paleta azul-indigo, Inter + Cabinet Grotesk, etc.

### Fase 2: Mockups
Usar NanoBanana para generar:
- Hero section con gradiente azul-indigo y glass cards
- Feature grid con iconos SVG
- Pricing table con 3 tiers
- Footer con links y CTA

### Fase 3: HTML/CSS
Usar Google Stitch para convertir los mockups en:
- HTML semantico con sections, nav, main, footer
- Tailwind classes aplicando el design system
- Responsive breakpoints (mobile-first)

### Fase 4: React Components
Usar 21st Dev Magic para producir:
- `<HeroSection />` con animated gradient background
- `<FeatureGrid />` con hover card animations
- `<PricingTable />` con toggle monthly/yearly
- `<Footer />` con link groups y newsletter form

---

## Best Practices

### Orden Estricto del Pipeline
1. **SIEMPRE** empezar con UI/UX Pro Max para el design system
2. **NUNCA** saltar directamente a generar componentes sin design system
3. Los mockups (Fase 2) son opcionales pero recomendados para proyectos grandes
4. El prototipo HTML/CSS (Fase 3) puede omitirse si el diseno es simple

### Consistencia del Design System
- Usar CSS variables para colores: `--color-primary`, `--color-accent`, etc.
- Importar Google Fonts desde el design system, no elegir arbitrariamente
- Respetar spacing scale consistente (4px base: 4, 8, 12, 16, 24, 32, 48, 64)
- Mantener max-width consistente en todo el proyecto

### Calidad de Componentes
- Cada componente debe ser autocontenido con sus props tipadas
- Incluir estados: default, hover, active, focus, disabled, loading
- Respetar reglas de accesibilidad del design system (WCAG 2.1 AA)
- No usar emojis como iconos (usar Lucide, Heroicons, o Simple Icons)

### Iteracion Visual
- Capturar screenshot con Playwright MCP despues de implementar
- Comparar contra mockup de NanoBanana
- Iterar hasta alcanzar fidelidad visual aceptable
- Validar responsive en 375px, 768px, 1024px, 1440px

---

## Configuracion Requerida

### MCP Servers (en `.mcp.json`)
Los 3 MCP servers ya estan configurados. Reemplazar las API keys:

| MCP Server | Variable de Entorno | Obtener en |
|------------|--------------------|-----------:|
| NanoBanana | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| 21st Dev Magic | `TWENTY_FIRST_API_KEY` | [21st.dev](https://21st.dev) |
| Google Stitch | (no requiere key) | -- |

### Skill Local
UI/UX Pro Max ya esta instalado en `.claude/skills/ui-ux-pro-max/`.

### Verificar Dependencias
```bash
# Python (para UI/UX Pro Max)
python3 --version

# Node.js (para MCP servers)
node --version

# uvx (para NanoBanana)
uvx --version
```

---

## Reference Files

- Ver `references/workflow-diagram.md` para diagrama detallado del pipeline
- Ver `.claude/skills/ui-ux-pro-max/SKILL.md` para documentacion completa del design system
- Ver `.claude/skills/frontend-design/SKILL.md` para guidelines de estetica frontend
