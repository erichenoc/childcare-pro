# Design Brief Template — Proyectos Nuevos

Usa esta plantilla para generar el Design Brief completo. Cada seccion es **obligatoria**.
Rellena con los datos obtenidos de las Fases 1-5 del SKILL.md.

---

## 1. Resumen del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | {nombre_proyecto} |
| **Tipo** | {SaaS / e-commerce / landing / dashboard / portfolio / blog / otro} |
| **Audiencia principal** | {descripcion del usuario objetivo} |
| **Objetivo del sitio** | {que debe lograr el usuario al visitar} |
| **Stack** | {Next.js + Tailwind CSS / otro} |

---

## 2. Direccion de Diseno

| Campo | Valor |
|-------|-------|
| **Tono principal** | {Confianza / Energia / Calma / Urgencia / Lujo / Diversion / Innovacion} |
| **Compromiso estetico** | {descripcion en 1-2 oraciones de la identidad visual} |
| **Ancla de memorabilidad** | {el elemento unico que hace este sitio memorable — NO puede ser generico} |
| **Referencias visuales** | {sitios/marcas que inspiran el diseño} |

> **Regla frontend-design:** El ancla de memorabilidad debe ser especifica y unica.
> Ejemplos validos: "gradientes aurora que reaccionan al scroll", "tipografia display oversized con recorte diagonal"
> Ejemplos invalidos: "diseño limpio y moderno", "colores bonitos"

---

## 3. Design System

| Campo | Valor |
|-------|-------|
| **Sistema base** | {Liquid Glass / Neumorphism / Neobrutalism / Bento Grid / Gradient Mesh / Ninguno / Combinado} |
| **Archivo de referencia** | {ruta al .md del design system elegido} |
| **Personalizaciones** | {variaciones especificas para este proyecto} |

Si es **Combinado**, especificar:
- Sistema primario: {nombre} — usado en: {donde}
- Sistema secundario: {nombre} — usado en: {donde}

---

## 4. Paleta de Colores

Fuente: `ui-ux-pro-max` query resultado

| Rol | Nombre | Hex | CSS Variable | Tailwind Class | Uso |
|-----|--------|-----|-------------|----------------|-----|
| Primary | {nombre} | {#hex} | `--color-primary` | `bg-primary` / `text-primary` | CTA, enlaces, brand |
| Secondary | {nombre} | {#hex} | `--color-secondary` | `bg-secondary` / `text-secondary` | Acentos, hover |
| Accent | {nombre} | {#hex} | `--color-accent` | `bg-accent` / `text-accent` | Elementos destacados |
| Background | {nombre} | {#hex} | `--color-bg` | `bg-base` | Fondo principal |
| Text | {nombre} | {#hex} | `--color-text` | `text-base` | Texto principal |

**Contraste WCAG AA:**
- Text sobre Background: {ratio} — {PASS/FAIL}
- Primary sobre Background: {ratio} — {PASS/FAIL}

**Dark Mode** (si aplica):

| Rol | Light Hex | Dark Hex |
|-----|-----------|----------|
| Primary | {#hex} | {#hex} |
| Background | {#hex} | {#hex} |
| Text | {#hex} | {#hex} |

---

## 5. Tipografia

Fuente: `ui-ux-pro-max` query resultado

| Rol | Font Family | Weight | Fallback | Google Fonts |
|-----|------------|--------|----------|-------------|
| **Heading** | {nombre} | {700/800/900} | {system fallback} | `?family={nombre}:wght@{weights}` |
| **Body** | {nombre} | {400/500} | {system fallback} | `?family={nombre}:wght@{weights}` |

**Escala tipografica:**

| Element | Size (desktop) | Size (mobile) | Line Height | Letter Spacing |
|---------|---------------|---------------|-------------|----------------|
| h1 | {rem} | {rem} | {value} | {value} |
| h2 | {rem} | {rem} | {value} | {value} |
| h3 | {rem} | {rem} | {value} | {value} |
| body | {rem} | {rem} | {value} | {value} |
| small | {rem} | {rem} | {value} | {value} |

**Google Fonts URL completa:**
```
https://fonts.googleapis.com/css2?family={Heading}:wght@{weights}&family={Body}:wght@{weights}&display=swap
```

> **Regla elite-frontend-ux:** NUNCA usar Inter, Roboto, Arial, Helvetica como unica fuente.
> Siempre un pairing con personalidad.

---

## 6. Arquitectura de Paginas

| Pagina | Patron de Layout | Prioridad | Notas |
|--------|-----------------|-----------|-------|
| {landing/home} | {hero + features + social-proof + CTA} | Alta | {notas} |
| {dashboard} | {sidebar + main-content + widgets} | Alta | {notas} |
| {auth} | {split-screen / centered-card} | Media | {notas} |
| {pricing} | {comparison-table / card-grid} | Media | {notas} |
| {blog} | {content-focused / magazine-grid} | Baja | {notas} |
| ... | ... | ... | ... |

---

## 7. Estrategia de Componentes

### Biblioteca base
- [ ] shadcn/ui (recomendado para Next.js)
- [ ] Componentes custom con Tailwind
- [ ] Otro: {especificar}

### Plugins de tailwindcss-marketplace recomendados

| Plugin | Uso | Prioridad |
|--------|-----|-----------|
| {nombre del plugin} | {para que se usa} | {alta/media/baja} |
| ... | ... | ... |

### Componentes clave a crear

| Componente | Tipo | Design System Recipe |
|-----------|------|---------------------|
| {Button} | {shared} | {referencia a receta del design system} |
| {Card} | {shared} | {referencia} |
| {Hero} | {feature-specific} | {referencia} |
| ... | ... | ... |

---

## 8. Accesibilidad

| Requisito | Nivel | Implementacion |
|-----------|-------|----------------|
| **WCAG Target** | {AA / AAA} | Compliant en todos los componentes |
| **Contraste minimo** | {4.5:1 texto / 3:1 elementos grandes} | Verificar con paleta de seccion 4 |
| **Touch targets** | {44x44px minimo} | Todos los elementos interactivos |
| **Focus visible** | {outline-2 outline-offset-2} | Todos los elementos focusables |
| **Screen readers** | {aria-label, aria-describedby, sr-only} | Todos los elementos interactivos |
| **Reduced motion** | {prefers-reduced-motion: reduce} | Todas las animaciones |
| **Semantic HTML** | {header, nav, main, section, footer} | Estructura de cada pagina |

---

## 9. Animacion e Interaccion

| Aspecto | Especificacion |
|---------|---------------|
| **Filosofia** | {purposeful / playful / minimal} |
| **Timing function** | {ease-out / custom cubic-bezier} |
| **Duracion base** | {150ms-300ms para UI, 300ms-500ms para transiciones} |
| **Hover effects** | {descripcion — ej: scale(1.02) + shadow elevation} |
| **Page transitions** | {fade / slide / none} |
| **Scroll animations** | {intersection observer triggers / none} |
| **Loading states** | {skeleton / shimmer / spinner} |
| **Reduced motion** | {respeta prefers-reduced-motion, fallback a opacity-only} |

Referencia: `ui-agents/animation/micro-interactions.md`

---

## 10. Anti-Patrones

**PROHIBIDO en este proyecto** (union de todos los skills):

### Genericos (elite-frontend-ux + frontend-design)
- [ ] NO usar Inter/Roboto/Arial como unica fuente
- [ ] NO usar azul generico (#3B82F6 / blue-500) como primary
- [ ] NO usar emojis como iconos en produccion
- [ ] NO usar placeholder text en produccion
- [ ] NO usar stock photos genericas

### Especificos del Design System ({nombre})
- [ ] {anti-patron 1 del design system elegido}
- [ ] {anti-patron 2}
- [ ] {anti-patron 3}

### Especificos de la Industria ({industria})
- [ ] {anti-patron especifico de la industria}
- [ ] {anti-patron especifico de la industria}

---

## 11. Checklist Pre-Implementacion

Completar ANTES de escribir codigo:

### Setup
- [ ] Crear proyecto con `npx create-next-app@latest`
- [ ] Instalar Google Fonts (seccion 5)
- [ ] Configurar `tailwind.config.ts` con colores (seccion 4) y fuentes (seccion 5)
- [ ] Crear `globals.css` con CSS variables (seccion 4)
- [ ] Configurar dark mode si aplica

### Design System
- [ ] Leer archivo .md del design system elegido (seccion 3)
- [ ] Identificar recetas de componentes a usar
- [ ] Instalar plugins de tailwindcss-marketplace recomendados (seccion 7)

### Assets
- [ ] Seleccionar set de iconos (Lucide / Heroicons / Phosphor)
- [ ] Preparar assets de marca si existen (logo, favicon)

---

## 12. Referencias de Skills

Que skill cargar en cada fase de implementacion:

| Fase | Skill Principal | Archivo Clave |
|------|----------------|---------------|
| **Setup inicial** | elite-frontend-ux | Seccion 2: Design Tokens |
| **Layout structure** | bencium-{variant} | RESPONSIVE-DESIGN.md |
| **Componentes base** | {design-system} + tailwindcss-marketplace | {archivo del DS} + plugins/ |
| **Estilos y colores** | ui-ux-pro-max (datos persistidos) | design-system/MASTER.md |
| **Animaciones** | ui-agents | animation/micro-interactions.md |
| **Accesibilidad** | elite-frontend-ux + ui-agents | Seccion 3 + aria-implementation.md |
| **Mobile responsive** | ui-agents + bencium | mobile-first-layout.md + RESPONSIVE-DESIGN.md |
| **Review final** | frontend-design | Mandato anti-generico completo |

---

*Generado por `/consulta-diseno` — SaaS Factory v3*
