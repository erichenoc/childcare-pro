# Upgrade Skill

Meta-orquestador para mejorar proyectos existentes usando todas las herramientas de SaaS Factory V3.

## Que hace

Toma un proyecto ya construido y lo mejora profesionalmente:

1. **Diagnostica** - Code review + Security audit + Performance analysis
2. **Arregla** - Fixes criticos automaticos (seguridad, bugs, performance)
3. **Refuerza** - Genera tests + Configura SEO
4. **Expande** - Ofrece features faltantes (auth, payments, landing)
5. **Blinda** - Documenta errores en CLAUDE.md (Auto-Blindaje V3)
6. **Documenta** - Genera arquitectura + API docs
7. **Despliega** - Deploy a produccion

## Modos

| Modo | Comando | Que hace |
|------|---------|----------|
| Completo | `/upgrade --full` | Todo (default) |
| Diagnostico | `/upgrade --diagnostico` | Solo analisis, sin cambios |
| Calidad | `/upgrade --quality` | Diagnostico + fixes + tests + SEO |
| Features | `/upgrade --features` | Diagnostico + features faltantes |

## Ejemplo

```bash
# Mejora completa
/upgrade --full

# Solo quiero saber que problemas tiene
/upgrade --diagnostico

# Mejorar calidad sin agregar features
/upgrade --quality

# Agregar features que faltan
/upgrade --features
```

## vs /autopilot

- `/autopilot` = Proyecto NUEVO desde cero
- `/upgrade` = Proyecto EXISTENTE, mejorarlo

## Archivos

- `instructions.md` - Logica detallada de cada fase
- `templates/UPGRADE.md` - Template de estado para tracking
