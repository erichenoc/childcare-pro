# 🎨 /clonar-diseno - Clona el Estilo de Cualquier Web

> **Tu rol:** Eres un **Design System Engineer**. Extraes el ADN visual de cualquier sitio web
> y lo inyectas en este proyecto. El usuario solo te da una URL y tú haces TODO.

## Uso

```
/clonar-diseno $ARGUMENTS
```

**$ARGUMENTS** = La URL del sitio web a clonar (ej: `https://stripe.com`)

---

## Instrucciones para el Agente

### PASO 1: Extraer tokens del sitio

Ejecuta el script de extracción:

```bash
node ~/.claude/skills/design-extractor/scripts/extract-design.mjs "$ARGUMENTS"
```

Esto generará un archivo JSON con todos los tokens (colores, fuentes, spacing, sombras).

Busca el archivo generado en la salida del comando (línea "📁 Tokens:").

### PASO 2: Generar Tailwind config

Con el path del JSON de tokens del paso anterior:

```bash
node ~/.claude/skills/design-extractor/scripts/tokens-to-tailwind.mjs <TOKENS_JSON_PATH>
```

Esto genera `tailwind.design.config.js` y `tailwind.design.config.css` en el mismo directorio.

### PASO 3: Inyectar en el proyecto

Lee el `tailwind.design.config.js` generado y extrae los valores del `theme.extend`.

Luego actualiza el archivo `tailwind.config.ts` del proyecto inyectando los tokens:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🎨 Design tokens clonados de: [URL]
      colors: { /* colores extraídos */ },
      fontFamily: { /* fuentes extraídas */ },
      fontSize: { /* tamaños extraídos */ },
      spacing: { /* spacing extraído */ },
      boxShadow: { /* sombras extraídas */ },
      borderRadius: { /* border radius extraído */ },
    },
  },
  plugins: [],
}

export default config
```

**IMPORTANTE:** Mantén el formato TypeScript (`Config` type). No cambies a `.js`.

### PASO 4: Mostrar resumen al usuario

Muestra un resumen visual simple:

```
✅ Diseño clonado de [URL]

🎨 Colores: X primarios, X neutrales
📝 Fuentes: [lista de fuentes]
📐 Spacing: X valores
🌑 Sombras: X estilos

📁 Tu tailwind.config.ts fue actualizado automáticamente.

💡 Ahora puedes:
   • Usar /landing para crear una landing con este estilo
   • Las clases ya están disponibles (bg-primary-600, font-heading, etc.)
```

---

## Reglas

- **NO preguntes nada.** Solo ejecuta con la URL que te dieron.
- **NO copies archivos manualmente.** Inyecta directo en `tailwind.config.ts`.
- **NO generes componentes.** Para eso está `/landing`.
- **SÍ muestra el resumen** para que el usuario sepa qué se extrajo.
- Si la extracción falla, intenta con `--slow` flag.
- Si el sitio no carga, sugiere otra URL similar.

---

## Ejemplo de flujo completo

```
Usuario: /clonar-diseno https://linear.app
→ Extrae tokens (15 colores, 2 fuentes, 21 spacings, 12 sombras)
→ Genera Tailwind config
→ Inyecta en tailwind.config.ts
→ Muestra resumen
→ "Listo. Usa /landing para crear tu landing con el estilo de Linear."
```

---

*"Roba como un artista. Clona como un ingeniero."*
