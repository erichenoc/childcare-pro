---
description: "Propaga las actualizaciones de SaaS Factory V3 a TODOS los proyectos existentes. Reemplaza la carpeta .claude/ en cada proyecto sin tocar el codigo"
argument-hint: "[--dry-run] | [--path /ruta/a/proyectos]"
---

# /sync-all - Sincronizar Factory a Todos los Proyectos

Propaga las herramientas actualizadas de SaaS Factory V3 a todos los proyectos existentes.

**Solo actualiza `.claude/`** — NUNCA toca codigo fuente, CLAUDE.md, .mcp.json, ni .env

---

## Paso 1: Localizar la Factory

Busca la ruta de la factory:

```bash
# Leer la funcion saas-factory del shell
grep -A 5 "function saas-factory" ~/.zshrc | grep "FACTORY_PATH"
```

Si no la encuentra, usa la ruta por defecto:
```
/Users/erichenocpenapaulino/Documents/Maquina de Saas/saas-factory-setup/saas-factory
```

Verifica que existe y tiene `.claude/`:
```bash
ls [FACTORY_PATH]/.claude/commands/ | wc -l
```

---

## Paso 2: Descubrir Proyectos

Busca TODOS los directorios que tienen `.claude/` (proyectos SaaS Factory):

```bash
find /Users/erichenocpenapaulino/Documents -maxdepth 4 -name ".claude" -type d 2>/dev/null \
  | grep -v "saas-factory-setup" \
  | grep -v "node_modules" \
  | grep -v ".Trash"
```

Para cada resultado, extraer la ruta del PROYECTO (padre de `.claude/`).

Mostrar la lista al usuario:
```
🔍 Proyectos encontrados:

1. sistema-clinicas-esteticas
2. agente-estrategia
3. dashboard-dr-lopez
4. [etc...]

Total: X proyectos

¿Actualizar TODOS? (si/no/seleccionar)
```

**Esperar confirmacion del usuario.**

---

## Paso 3: Pre-check (--dry-run)

Si `$ARGUMENTS` contiene `--dry-run`:
- Mostrar que se HARIA en cada proyecto
- NO ejecutar ningun cambio
- Listar diferencias entre factory y cada proyecto

```bash
# Para cada proyecto, comparar
diff -rq [FACTORY_PATH]/.claude/ [PROJECT_PATH]/.claude/ 2>/dev/null | head -20
```

Si es dry-run, mostrar reporte y PARAR.

---

## Paso 4: Ejecutar Sincronizacion

Para CADA proyecto confirmado:

### 4A: Backup
```bash
# Crear backup de la .claude/ actual del proyecto
cp -r [PROJECT_PATH]/.claude/ [PROJECT_PATH]/.claude.backup.$(date +%Y%m%d)/
```

### 4B: Reemplazar .claude/
```bash
# Eliminar .claude/ vieja
rm -rf [PROJECT_PATH]/.claude/

# Copiar la nueva desde la factory
cp -r [FACTORY_PATH]/.claude/ [PROJECT_PATH]/.claude/
```

### 4C: Preservar configuracion local
**IMPORTANTE**: Estos archivos NO se tocan:
- `CLAUDE.md` — Cada proyecto tiene su propio brain
- `.mcp.json` — Cada proyecto tiene sus propios tokens
- `.env.local` — Cada proyecto tiene sus propias keys
- `src/` — Codigo fuente intacto
- `package.json` — Dependencias intactas

### 4D: Verificar
```bash
# Confirmar que .claude/ se copio correctamente
ls [PROJECT_PATH]/.claude/commands/ | wc -l
ls [PROJECT_PATH]/.claude/skills/ | wc -l
ls [PROJECT_PATH]/.claude/agents/ | wc -l
```

---

## Paso 5: Reporte Final

```
🔄 SYNC COMPLETADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Proyectos actualizados: X/Y
❌ Errores: Z

Detalle por proyecto:
  ✅ sistema-clinicas-esteticas    (24 cmd, 27 skills, 18 agents)
  ✅ dashboard-dr-lopez            (24 cmd, 27 skills, 18 agents)
  ✅ Expert Travellers CRM         (24 cmd, 27 skills, 18 agents)
  [...]

📦 Backups guardados en: .claude.backup.YYYYMMDD/

Que se actualizo:
  - 24 comandos (incluye /autopilot, /upgrade, /deploy, etc.)
  - 27 skills (incluye seo-optimizer, theme-factory, etc.)
  - 18 agentes (incluye GSD framework completo)
  - Hooks, scripts y configuracion

Que NO se toco:
  - CLAUDE.md (configuracion de cada proyecto)
  - .mcp.json (tokens y credenciales)
  - .env.local (variables de entorno)
  - src/ (codigo fuente)
  - package.json (dependencias)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Modo Selectivo

Si el usuario responde "seleccionar" en Paso 2:
- Mostrar lista numerada
- Pedir numeros separados por coma: "1,3,5,7"
- Solo actualizar los seleccionados

---

## Notas

- **Es seguro ejecutar multiples veces** — siempre reemplaza .claude/ completa
- **Backup automatico** — siempre crea .claude.backup antes de reemplazar
- **No necesita git** — copia directa de archivos
- **No necesita internet** — todo es local
- Para revertir: `rm -rf .claude/ && mv .claude.backup.YYYYMMDD/ .claude/`
