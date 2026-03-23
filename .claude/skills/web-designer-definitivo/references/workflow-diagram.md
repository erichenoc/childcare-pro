# Web Designer Definitivo - Workflow Diagram

## Pipeline Visual

```
+========================+     +=====================+     +======================+     +========================+
|   FASE 1: DESIGN       |     |  FASE 2: MOCKUP     |     |  FASE 3: PROTOTYPE   |     |  FASE 4: PRODUCTION    |
|   UI/UX Pro Max GO     |     |  NanoBanana MCP     |     |  Google Stitch MCP   |     |  21st Dev Magic MCP    |
|========================| --> |=====================| --> |======================| --> |========================|
|                        |     |                     |     |                      |     |                        |
| INPUT:                 |     | INPUT:              |     | INPUT:               |     | INPUT:                 |
| - Tipo de producto     |     | - Design system     |     | - Design system      |     | - HTML/CSS prototype   |
| - Industria            |     | - Descripcion UI    |     | - Mockup aprobado    |     | - Design system rules  |
| - Keywords de estilo   |     | - Layout specs      |     | - Layout specs       |     | - Component specs      |
|                        |     |                     |     |                      |     |                        |
| PROCESO:               |     | PROCESO:            |     | PROCESO:             |     | PROCESO:               |
| - Busca en 67 estilos  |     | - Genera imagen     |     | - Genera HTML        |     | - Genera React TSX     |
| - Matchea 161 paletas  |     |   via Gemini AI     |     | - Genera CSS/TW      |     | - Aplica Tailwind      |
| - Selecciona 57 fonts  |     | - Itera con user    |     | - Responsive layout  |     | - Agrega animations    |
| - Aplica 99 UX rules   |     | - Aprueba vision    |     | - Semantic HTML       |     | - Props tipadas        |
|                        |     |                     |     |                      |     |                        |
| OUTPUT:                |     | OUTPUT:             |     | OUTPUT:              |     | OUTPUT:                |
| - Estilo UI            |     | - Mockup PNG/JPG    |     | - index.html         |     | - hero-section.tsx     |
| - Paleta hex codes     |     | - Hero image        |     | - styles.css         |     | - feature-grid.tsx     |
| - Font pairing         |     | - Section mockups   |     | - Responsive code    |     | - pricing-table.tsx    |
| - UX guidelines        |     | - Asset images      |     |                      |     | - Componentes listos   |
| - Anti-patterns        |     |                     |     |                      |     |                        |
+========================+     +=====================+     +======================+     +========================+
```

## Decision Tree: Cuando Usar Cada Fase

```
Usuario pide interfaz web
        |
        v
  FASE 1: Design System (SIEMPRE)
        |
        v
  Es proyecto grande o complejo?
       / \
     SI   NO
     |     |
     v     v
  FASE 2  Skip a Fase 3 o 4
  Mockups
     |
     v
  Necesita prototipo rapido para validar?
       / \
     SI   NO
     |     |
     v     v
  FASE 3  Skip a Fase 4
  HTML/CSS
     |
     v
  FASE 4: React Components (SIEMPRE para produccion)
```

## Flujo de Datos Entre Fases

### Fase 1 -> Fase 2
```
Design System Output:
  style: "Glassmorphism + Minimalism"
  colors: { primary: "#6366F1", accent: "#EC4899", bg: "#0F172A" }
  fonts: { heading: "Cabinet Grotesk", body: "Inter" }

  Se convierte en prompt para NanoBanana:
  "Modern SaaS dashboard with glassmorphism cards, dark background #0F172A,
   indigo (#6366F1) accents, clean typography, minimalist layout"
```

### Fase 2 -> Fase 3
```
Mockup aprobado + Design System rules
  Se convierte en input para Google Stitch:
  "Create responsive HTML/CSS for a SaaS dashboard with:
   - Dark glassmorphism navbar (bg: rgba(15,23,42,0.8), backdrop-blur)
   - Card grid with glass effect (border: 1px solid rgba(255,255,255,0.1))
   - Sidebar navigation with active state in indigo
   - Based on this mockup: [reference image]"
```

### Fase 3 -> Fase 4
```
HTML/CSS prototype + Design System
  Se convierte en solicitudes a 21st Dev Magic:
  "Create a React component <DashboardCard> with:
   - Tailwind CSS glassmorphism: bg-white/5 backdrop-blur-xl border border-white/10
   - Props: title (string), value (string | number), trend ('up' | 'down'), icon (ReactNode)
   - Hover: scale-[1.02] shadow-xl transition-all duration-200
   - Dark mode support via CSS variables"
```

## Integracion con SaaS Factory

```
SaaS Factory Project
  |
  +-- .mcp.json (NanoBanana + Stitch + 21st Dev configured)
  |
  +-- .claude/skills/
  |     +-- ui-ux-pro-max/      (Fase 1: Design Intelligence)
  |     +-- web-designer-definitivo/  (This skill: Orchestration)
  |     +-- frontend-design/    (Complementary: Aesthetic guidelines)
  |
  +-- src/features/
  |     +-- [feature]/
  |           +-- components/   (Fase 4 output goes here)
  |           +-- types/
  |
  +-- design-system/           (Optional: persisted design system)
        +-- MASTER.md
        +-- pages/
```
