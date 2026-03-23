# Recetas de Paginas — Componentes por Tipo de Proyecto

Recetas listas para copiar. Cada receta incluye los comandos de instalacion
y la estructura de componentes recomendada.

---

## Receta: Landing Page SaaS

```bash
# 1. Secciones pre-disenadas (Shadcnblocks)
npx shadcn add @shadcnblocks/navbar-1
npx shadcn add @shadcnblocks/hero-1
npx shadcn add @shadcnblocks/feature-1
npx shadcn add @shadcnblocks/stats-1
npx shadcn add @shadcnblocks/testimonial-1
npx shadcn add @shadcnblocks/pricing-1
npx shadcn add @shadcnblocks/faq-1
npx shadcn add @shadcnblocks/cta-1
npx shadcn add @shadcnblocks/footer-1

# 2. Efectos wow (Magic UI)
npx shadcn@latest add "https://magicui.design/r/shimmer-button"
npx shadcn@latest add "https://magicui.design/r/text-reveal"
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/border-beam"

# 3. Micro-interacciones (Motion Primitives)
npx motion-primitives@latest add text-effect
npx motion-primitives@latest add in-view
```

**Estructura sugerida:**
```
app/(marketing)/page.tsx
├── Navbar (shadcnblocks)
├── Hero (shadcnblocks + text-reveal + shimmer-button)
├── LogoMarquee (marquee de Magic UI)
├── Features (shadcnblocks + in-view de Motion Primitives)
├── Stats (shadcnblocks + number-ticker de Magic UI)
├── Testimonials (shadcnblocks)
├── Pricing (shadcnblocks + border-beam en plan popular)
├── FAQ (shadcnblocks)
├── CTA (shadcnblocks + shimmer-button)
└── Footer (shadcnblocks)
```

---

## Receta: Dashboard / Admin Panel

```bash
# 1. Layout (Shadcnblocks)
npx shadcn add @shadcnblocks/sidebar-1
npx shadcn add @shadcnblocks/stats-1

# 2. Componentes base mejorados (Origin UI — copy-paste)
# Copiar desde originui.com:
# - Inputs (search bar variant)
# - Tables (data table variant)
# - Tabs (animated variant)
# - Notifications (toast variant)
# - Buttons (icon variant)

# 3. Animaciones sutiles (Motion Primitives)
npx motion-primitives@latest add animated-number
npx motion-primitives@latest add accordion
npx motion-primitives@latest add in-view

# 4. Charts y visualizaciones (Magic UI)
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/animated-list"
```

**Estructura sugerida:**
```
app/(dashboard)/
├── layout.tsx (sidebar de shadcnblocks)
├── page.tsx
│   ├── StatsCards (stats + animated-number)
│   ├── RecentActivity (animated-list)
│   ├── DataTable (Origin UI table variant)
│   └── Charts (shadcn charts + number-ticker)
├── settings/page.tsx
│   ├── Tabs (Origin UI animated tabs)
│   ├── Forms (Origin UI inputs)
│   └── Toggles (Origin UI switches)
└── notifications/page.tsx
    └── NotificationList (Origin UI notifications)
```

---

## Receta: Portfolio / Personal Site

```bash
# 1. Efectos premium (Aceternity UI — copy-paste)
# Copiar desde ui.aceternity.com:
# - Hero Parallax
# - 3D Card Effect
# - Spotlight
# - Floating Dock
# - Aurora Background
# - Sticky Scroll Reveal

# 2. Animaciones de texto (Motion Primitives)
npx motion-primitives@latest add text-effect
npx motion-primitives@latest add text-morph
npx motion-primitives@latest add text-shimmer
npx motion-primitives@latest add image-comparison

# 3. Efectos adicionales (Magic UI)
npx shadcn@latest add "https://magicui.design/r/dock"
npx shadcn@latest add "https://magicui.design/r/globe"
npx shadcn@latest add "https://magicui.design/r/particles"
```

**Estructura sugerida:**
```
app/page.tsx
├── AuroraBackground (Aceternity)
├── Hero con Spotlight (Aceternity + text-effect)
├── FloatingDock (Aceternity o Magic UI)
├── ProjectsGrid con 3D Cards (Aceternity)
├── ExperienceTimeline con StickyScrollReveal (Aceternity)
├── SkillsGlobe (Magic UI globe)
├── ContactSection con Particles background (Magic UI)
└── Footer
```

---

## Receta: E-commerce / Tienda

```bash
# 1. Secciones (Shadcnblocks)
npx shadcn add @shadcnblocks/hero-1
npx shadcn add @shadcnblocks/gallery-1
npx shadcn add @shadcnblocks/testimonial-1
npx shadcn add @shadcnblocks/footer-1

# 2. Componentes de producto (Origin UI — copy-paste)
# - Cards (product card variants)
# - Buttons (add to cart variants)
# - Badges (sale, new, etc.)
# - Sliders (price range)
# - Tabs (product details)

# 3. Efectos de engagement (Magic UI)
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/shimmer-button"
npx shadcn@latest add "https://magicui.design/r/confetti"
npx shadcn@latest add "https://magicui.design/r/number-ticker"

# 4. Animaciones (Motion Primitives)
npx motion-primitives@latest add carousel
npx motion-primitives@latest add in-view
```

---

## Receta: Blog / Content Site

```bash
# 1. Secciones (Shadcnblocks)
npx shadcn add @shadcnblocks/navbar-1
npx shadcn add @shadcnblocks/hero-1
npx shadcn add @shadcnblocks/blog-1
npx shadcn add @shadcnblocks/cta-1
npx shadcn add @shadcnblocks/footer-1

# 2. Tipografia y texto (Motion Primitives)
npx motion-primitives@latest add text-effect
npx motion-primitives@latest add progressive-blur

# 3. Engagement (Magic UI)
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/text-reveal"
```

---

## Receta: Auth Pages (Login/Signup)

```bash
# 1. Forms pre-disenados (Shadcnblocks)
npx shadcn add @shadcnblocks/login-1

# 2. Inputs mejorados (Origin UI — copy-paste)
# - Password input con toggle visibility
# - Email input con validation icon
# - Social login buttons

# 3. Background (elegir uno):
# Opcion A: Aceternity Aurora Background
# Opcion B: Magic UI Particles
npx shadcn@latest add "https://magicui.design/r/particles"

# 4. Animaciones sutiles
npx motion-primitives@latest add text-effect
```

---

## Receta Rapida: Landing en 5 Minutos (ConvertFast UI)

```bash
npx convertfast-ui@latest init
npx convertfast-ui@latest page create mi-landing --template editorial
# Listo — landing completa con hero, features, pricing, FAQ
# Despues personalizar con Magic UI effects
```

---

*Recetas de `/component-libraries` — SaaS Factory v3*
