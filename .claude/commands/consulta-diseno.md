# /consulta-diseno — Orquestador de Diseno

> **Tu rol:** Actua como un **Director Creativo y Arquitecto de Diseno** que coordina TODOS los skills de diseno de la SaaS Factory antes de escribir una sola linea de codigo frontend.
> **REGLA CRITICA:** NUNCA escribas codigo frontend sin completar esta consulta primero.

## Instrucciones para el Agente

Lee y sigue las instrucciones completas del skill orquestador:

**Archivo principal:** `.claude/skills/consulta-diseno/SKILL.md`

### Paso 1: Detectar Modo

Determina automaticamente:

- **MODO NUEVO** → Si el usuario habla de un proyecto que aun no existe, o no hay `tailwind.config.*` ni `package.json` en el directorio de trabajo
- **MODO EXISTENTE** → Si el usuario menciona proyecto existente, da una ruta, dice "mejorar/redisenar", o existe `tailwind.config.*` o `package.json` en el directorio de trabajo

### Paso 2: Ejecutar el Flujo

**Si MODO NUEVO:**

1. Haz las 7 preguntas estrategicas (Fase 1 del SKILL.md) — presentalas TODAS juntas
2. Con las respuestas, ejecuta:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<tipo> <industria> <mood>" --design-system -p "<Nombre>"
   ```
3. Recomienda design system (de los 5 disponibles) cruzando contra keywords
4. Lee el `.md` del design system elegido en `.claude/design-systems/`
5. Decide skill bencium: innovative (bold/creativo) o controlled (corporativo)
6. Genera el **Design Brief** completo usando template en `.claude/skills/consulta-diseno/references/design-brief-template.md`
7. Presenta al usuario para aprobacion ANTES de escribir codigo

**Si MODO EXISTENTE:**

1. Ejecuta el analizador:
   ```bash
   python3 .claude/skills/consulta-diseno/scripts/analyze_existing.py <ruta-proyecto>
   ```
2. Diagnostica problemas cruzando contra los skills de diseno
3. Genera el **Plan de Mejora** usando template en `.claude/skills/consulta-diseno/references/improvement-plan-template.md`
4. Presenta al usuario para aprobacion ANTES de hacer cambios

### Paso 3: Referencias de Coordinacion

Consulta `.claude/skills/consulta-diseno/references/skill-coordination-map.md` para:
- Saber que skill cargar en cada fase
- Resolver conflictos entre skills (accesibilidad siempre gana, anti-patrones son UNION)
- Comandos exactos de busqueda en ui-ux-pro-max

---

## Skills que Coordina

| Skill | Rol |
|-------|-----|
| ui-ux-pro-max | Motor de datos (96 paletas, 67 estilos, 57 fuentes) |
| elite-frontend-ux | Tokens, WCAG, patrones SaaS |
| frontend-design | Mandato anti-generico |
| bencium-innovative | Direccion creativa (proyectos bold) |
| bencium-controlled | Direccion sistematica (proyectos corporate) |
| ui-agents | Micro-interacciones, ARIA, mobile-first |
| tailwindcss-marketplace | Plugins de Tailwind |

## Design Systems Disponibles

| Sistema | Cuando Usar |
|---------|------------|
| Liquid Glass | glass, blur, premium, Apple-like |
| Neumorphism | soft, raised, tactile, depth |
| Neobrutalism | bold, raw, hard-shadows, punk |
| Bento Grid | modular, cards, organized |
| Gradient Mesh | gradients, aurora, Stripe-like |

---

*"Disenar primero, codear despues. Siempre."*
