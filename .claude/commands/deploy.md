---
description: "Deploy rapido a Vercel con verificaciones pre-deploy. Typecheck, build, y deploy en un solo comando"
---

# Deploy

Ejecuta un deploy completo a Vercel con verificaciones previas.

## Proceso

### Paso 1: Pre-deploy checks

Ejecuta en secuencia (falla rapido si algo no pasa):

```bash
# 1. Type checking
npm run typecheck

# 2. Build de produccion
npm run build
```

Si alguno falla, muestra el error y pregunta si quiere que lo arregles.

### Paso 2: Git status

Verifica el estado de git:
- Si hay cambios sin commit, pregunta si quiere hacer commit primero
- Si hay cambios, sugiere un mensaje de commit basado en los cambios

### Paso 3: Deploy

Usa el Vercel Deploy plugin o CLI:

```bash
npx vercel --prod
```

### Paso 4: Verificacion post-deploy

1. Muestra la URL del deploy
2. Si Playwright MCP esta disponible, navega a la URL y toma screenshot
3. Reporta el estado del deploy

### Paso 5: Resumen

```
## 🚀 Deploy Completado

- URL: https://[proyecto].vercel.app
- Status: ✅ Exitoso
- Typecheck: ✅ Paso
- Build: ✅ Paso
- Tiempo total: X minutos
```

## Notas

- Este comando NO hace push a git automaticamente
- Si el build falla, intenta arreglar los errores antes de preguntar al usuario
- Siempre verifica que `.env.local` tiene las variables necesarias
