---
name: Component Libraries
description: Catalogo de 6 bibliotecas de componentes UI pre-disenados (2300+ componentes). Sabe CUANDO y COMO usar Magic UI, Aceternity UI, Motion Primitives, Shadcnblocks, ConvertFast UI y Origin UI para entregar disenos hermosos y no genericos.
---

# Component Libraries — Catalogo de Componentes Pre-Disenados

## Regla Principal

> **NUNCA construyas un componente desde cero si ya existe uno hermoso en estas bibliotecas.**
> Primero busca en el catalogo. Si existe, usalo. Si no, entonces crea.

---

## Las 6 Bibliotecas

### 1. Magic UI — Componentes Animados (shadcn registry)

**Cuando usar:** Hero sections, landing pages, efectos wow, demos de producto
**Prerequisito:** shadcn/ui inicializado
**Instalar componente:**
```bash
npx shadcn@latest add "https://magicui.design/r/[componente]"
```

**Top componentes por caso de uso:**

| Necesidad | Componente | Comando |
|-----------|-----------|---------|
| Logos de clientes scrolling | `marquee` | `npx shadcn@latest add "https://magicui.design/r/marquee"` |
| Grid modular tipo Apple | `bento-grid` | `npx shadcn@latest add "https://magicui.design/r/bento-grid"` |
| Globo 3D interactivo | `globe` | `npx shadcn@latest add "https://magicui.design/r/globe"` |
| Dock tipo macOS | `dock` | `npx shadcn@latest add "https://magicui.design/r/dock"` |
| Lineas animadas entre nodos | `animated-beam` | `npx shadcn@latest add "https://magicui.design/r/animated-beam"` |
| Borde brillante en cards | `border-beam` | `npx shadcn@latest add "https://magicui.design/r/border-beam"` |
| Numeros contando | `number-ticker` | `npx shadcn@latest add "https://magicui.design/r/number-ticker"` |
| Video modal en hero | `hero-video-dialog` | `npx shadcn@latest add "https://magicui.design/r/hero-video-dialog"` |
| Boton con shimmer | `shimmer-button` | `npx shadcn@latest add "https://magicui.design/r/shimmer-button"` |
| Lista con stagger animation | `animated-list` | `npx shadcn@latest add "https://magicui.design/r/animated-list"` |
| Texto que se revela | `text-reveal` | `npx shadcn@latest add "https://magicui.design/r/text-reveal"` |
| Particulas de fondo | `particles` | `npx shadcn@latest add "https://magicui.design/r/particles"` |
| Meteoros de fondo | `meteors` | `npx shadcn@latest add "https://magicui.design/r/meteors"` |
| Confetti celebracion | `confetti` | `npx shadcn@latest add "https://magicui.design/r/confetti"` |
| Mockup Safari | `safari` | `npx shadcn@latest add "https://magicui.design/r/safari"` |
| Mockup iPhone | `iphone-15-pro` | `npx shadcn@latest add "https://magicui.design/r/iphone-15-pro"` |

**Categorias completas:** Text Animations (16), Buttons (7), Backgrounds (8), Device Mocks, Special Effects

---

### 2. Aceternity UI — Efectos Premium (copy-paste)

**Cuando usar:** Efectos 3D, parallax, spotlight, backgrounds animados, paginas de alto impacto visual
**Prerequisito:** Tailwind CSS + motion (framer-motion)
**Instalar dependencias:**
```bash
npm i motion clsx tailwind-merge
```

**NO tiene CLI.** Copiar codigo desde https://ui.aceternity.com/components/[nombre]

**Top componentes por caso de uso:**

| Necesidad | Componente | URL |
|-----------|-----------|-----|
| Grid modular animado | Bento Grid | ui.aceternity.com/components/bento-grid |
| Hero con parallax scroll | Hero Parallax | ui.aceternity.com/components/hero-parallax |
| Cards con efecto 3D hover | 3D Card Effect | ui.aceternity.com/components/3d-card-effect |
| Navegacion flotante | Floating Dock | ui.aceternity.com/components/floating-dock |
| Efecto spotlight cursor | Spotlight | ui.aceternity.com/components/spotlight |
| Efecto lampara dramatico | Lamp Effect | ui.aceternity.com/components/lamp-effect |
| Background aurora | Aurora Background | ui.aceternity.com/components/aurora-background |
| Scroll Macbook animation | Macbook Scroll | ui.aceternity.com/components/macbook-scroll |
| Modal con animacion suave | Animated Modal | ui.aceternity.com/components/animated-modal |
| Contenido reveal al scroll | Sticky Scroll Reveal | ui.aceternity.com/components/sticky-scroll-reveal |
| Grids con hover direction | Direction Aware Hover | ui.aceternity.com/components/direction-aware-hover |
| Backgrounds estrellados | Stars Background | ui.aceternity.com/components/stars-background |
| Texto con efecto typewriter | Typewriter Effect | ui.aceternity.com/components/typewriter-effect |
| Cards con efecto glow | Card Hover Effect | ui.aceternity.com/components/card-hover-effect |
| Tabs animados | Animated Tabs | ui.aceternity.com/components/tabs |

**200+ componentes en:** Backgrounds/Effects (26), Cards (17), Scroll (5), Text (11), Nav (11), Forms (3), Carousels (4), Layout (3), 3D (3)

---

### 3. Motion Primitives — Animaciones Base (CLI propio)

**Cuando usar:** Micro-interacciones, transiciones suaves, text effects, scroll animations
**Prerequisito:** Tailwind CSS + motion
**Instalar componente:**
```bash
npx motion-primitives@latest add [componente]
```

**Top componentes:**

| Necesidad | Componente | Comando |
|-----------|-----------|---------|
| Texto con efecto entrada | `text-effect` | `npx motion-primitives@latest add text-effect` |
| Accordion animado | `accordion` | `npx motion-primitives@latest add accordion` |
| Carousel con motion | `carousel` | `npx motion-primitives@latest add carousel` |
| Dialog animado | `dialog` | `npx motion-primitives@latest add dialog` |
| Numeros suaves | `animated-number` | `npx motion-primitives@latest add animated-number` |
| Trigger al entrar viewport | `in-view` | `npx motion-primitives@latest add in-view` |
| Comparador antes/despues | `image-comparison` | `npx motion-primitives@latest add image-comparison` |
| Slider infinito | `infinite-slider` | `npx motion-primitives@latest add infinite-slider` |
| Texto que morphea | `text-morph` | `npx motion-primitives@latest add text-morph` |
| Efecto glow hover | `glow-effect` | `npx motion-primitives@latest add glow-effect` |
| Dock tipo macOS | `dock` | `npx motion-primitives@latest add dock` |
| Texto shimmer | `text-shimmer` | `npx motion-primitives@latest add text-shimmer` |
| Borde trail animado | `border-trail` | `npx motion-primitives@latest add border-trail` |
| Blur progresivo | `progressive-blur` | `npx motion-primitives@latest add progressive-blur` |

**33 componentes en:** Core (11), Text (7), Numbers (2), Interactive (7), Toolbars (2), Advanced (4)

---

### 4. Shadcnblocks — Secciones Pre-disenadas (1350+ bloques)

**Cuando usar:** Armar paginas completas rapido — hero, features, pricing, testimonials, FAQ, footer
**Prerequisito:** shadcn/ui inicializado
**Instalar bloque:**
```bash
npx shadcn add @shadcnblocks/[bloque]
```

**Top bloques por seccion de pagina:**

| Seccion | Bloque | Comando |
|---------|--------|---------|
| Hero principal | `hero-1` a `hero-177` | `npx shadcn add @shadcnblocks/hero-1` |
| Features grid | `feature-1` a `feature-274` | `npx shadcn add @shadcnblocks/feature-1` |
| Pricing tabla | `pricing-1` a `pricing-37` | `npx shadcn add @shadcnblocks/pricing-1` |
| Navbar superior | `navbar-1` a `navbar-19` | `npx shadcn add @shadcnblocks/navbar-1` |
| Galeria imagenes | `gallery-1` a `gallery-48` | `npx shadcn add @shadcnblocks/gallery-1` |
| Testimonios | `testimonial-*` | `npx shadcn add @shadcnblocks/testimonial-1` |
| CTA | `cta-*` | `npx shadcn add @shadcnblocks/cta-1` |
| FAQ | `faq-*` | `npx shadcn add @shadcnblocks/faq-1` |
| Login/Signup | `login-*` | `npx shadcn add @shadcnblocks/login-1` |
| Footer | `footer-*` | `npx shadcn add @shadcnblocks/footer-1` |
| Blog | `blog-*` | `npx shadcn add @shadcnblocks/blog-1` |
| Stats | `stats-*` | `npx shadcn add @shadcnblocks/stats-1` |

**Receta para landing page completa:**
```bash
npx shadcn add @shadcnblocks/navbar-1
npx shadcn add @shadcnblocks/hero-1
npx shadcn add @shadcnblocks/feature-1
npx shadcn add @shadcnblocks/testimonial-1
npx shadcn add @shadcnblocks/pricing-1
npx shadcn add @shadcnblocks/faq-1
npx shadcn add @shadcnblocks/cta-1
npx shadcn add @shadcnblocks/footer-1
```

**1,350+ bloques en 40+ categorias.** Incluye E-commerce, Application UI, Marketing, CMS integrations.

---

### 5. ConvertFast UI — Landing Pages CLI

**Cuando usar:** Necesitas una landing page completa en minutos, con todas las secciones
**Prerequisito:** shadcn/ui
**Inicializar:**
```bash
npx convertfast-ui@latest init
```
**Crear pagina:**
```bash
npx convertfast-ui@latest page create <nombre>
```
**Agregar seccion:**
```bash
npx convertfast-ui@latest page <nombre> add <seccion>
```

**Secciones disponibles:**

| Seccion | Descripcion |
|---------|------------|
| `hero-section` | Banner principal con headline y CTA |
| `feature-section` | Showcase de features del producto |
| `pricing-section` | Tabla de precios por tier |
| `cta-section` | Bloque de call-to-action |
| `faq-section` | Preguntas frecuentes |
| `testimonial` | Testimonios de clientes |
| `social-proof` | Logos y social proof |
| `logo-cloud` | Grid de logos de clientes |

**Receta rapida:**
```bash
npx convertfast-ui@latest init
npx convertfast-ui@latest page create mi-landing --template editorial
```

Dark/light mode y responsive incluido automaticamente.

---

### 6. Origin UI — 449+ Variantes de Componentes Base

**Cuando usar:** Necesitas inputs, buttons, selects, modals con mejor diseno que los default
**Prerequisito:** Sigue convenciones shadcn (Radix + Tailwind)
**NO tiene CLI.** Copiar desde https://originui.com/ (ahora coss.com/ui)

**Top componentes por categoria:**

| Categoria | Cantidad | Descripcion |
|-----------|----------|------------|
| Inputs | 53 variantes | Text inputs, search bars, con decoraciones |
| Buttons | 51 variantes | Todos los estilos de botones |
| Selects | 46 variantes | Dropdowns y select menus |
| Sliders | 27 variantes | Range sliders |
| Notifications | 21 variantes | Toast y notificaciones |
| Tabs | 20 variantes | Navegacion por tabs |
| Tables | 20 variantes | Data tables |
| Navbars | 19 variantes | Barras de navegacion |
| Dialogs | 18 variantes | Modals |
| Radios | 19 variantes | Radio buttons |
| Textareas | 19 variantes | Areas de texto |
| Switches | 17 variantes | Toggle switches |
| Badges | 13 variantes | Badges y labels |
| Dropdowns | 15 variantes | Dropdown menus |

---

## Mapa de Decision: Que Biblioteca Usar

```
Necesito un componente UI...

├── Es una SECCION DE PAGINA completa?
│   ├── Landing page rapida → ConvertFast UI (scaffold) + Shadcnblocks (bloques)
│   ├── Hero section → Shadcnblocks hero-* (177 opciones)
│   ├── Pricing table → Shadcnblocks pricing-* (37 opciones)
│   ├── Features grid → Shadcnblocks feature-* (274 opciones)
│   └── Testimonials → Shadcnblocks testimonial-*
│
├── Necesita ANIMACION / EFECTO WOW?
│   ├── Efecto 3D, parallax, spotlight → Aceternity UI
│   ├── Shimmer, beams, particles, marquee → Magic UI
│   ├── Text animations, morphing → Motion Primitives
│   └── Micro-interacciones sutiles → Motion Primitives
│
├── Es un COMPONENTE BASE (input, button, select)?
│   └── Con mejor diseno que default → Origin UI (449+ variantes)
│
└── Es un LAYOUT especial?
    ├── Bento grid → Magic UI O Aceternity UI
    ├── Dock navigation → Magic UI O Motion Primitives
    └── Device mockup → Magic UI (Safari, iPhone)
```

## Reglas de Prioridad

1. **Shadcnblocks primero** para secciones de pagina — tiene 1,350+ bloques pre-disenados
2. **Magic UI** para efectos animados que se integran via shadcn registry
3. **Aceternity UI** para efectos premium/3D (copy-paste, requiere mas trabajo)
4. **Motion Primitives** para micro-interacciones y text effects
5. **ConvertFast UI** solo para scaffold rapido de landings
6. **Origin UI** para mejorar componentes base (inputs, buttons, etc.)

## Reglas Anti-Generico

- **NUNCA** uses un componente default de shadcn sin personalizarlo
- **SIEMPRE** agrega al menos 1 efecto animado de Magic UI o Motion Primitives por pagina
- **SIEMPRE** usa Origin UI para inputs/buttons en vez de los default
- **SIEMPRE** revisa Shadcnblocks antes de disenar una seccion desde cero
- **NUNCA** dejes una landing page sin al menos: shimmer button, text reveal, y marquee

## Integracion con consulta-diseno

Cuando `/consulta-diseno` genera un Design Brief, este skill agrega:
- Componentes especificos de cada biblioteca por seccion de pagina
- Comandos de instalacion listos para copiar
- Alternativas si un componente no encaja con el design system elegido

---

*Catalogo de componentes de `/component-libraries` — SaaS Factory v3*
