# Autopilot Skill

Meta-orquestador que automatiza la creacion completa de un SaaS usando todas las herramientas de SaaS Factory V3.

## Cuando Activar

- Usuario ejecuta `/autopilot "descripcion del proyecto"`
- Usuario ejecuta `/autopilot-resume` para retomar un proyecto interrumpido

## Que Hace

Analiza la descripcion del proyecto con **Smart Detection** y ejecuta automaticamente 11 fases:

| Fase | Herramienta | Tipo |
|------|-------------|------|
| 0 | `/primer` | Siempre |
| 1 | `/gsd:new-project` | Siempre |
| 2 | `/consulta-diseno` | Siempre |
| 3 | `/componentes` | Condicional |
| 4 | `/gsd:plan-phase` + `/gsd:execute-phase` | Siempre |
| 5 | `/add-login` | Condicional |
| 6 | `/add-payments` | Condicional |
| 7 | `/supabase-schema-sync` | Condicional |
| 8 | Quality Gates + SEO + Auto-Blindaje | Siempre |
| 9 | `/create-architecture-documentation` | Siempre |
| 10 | `/deploy` | Siempre |

## Smart Detection

Escanea keywords en la descripcion para activar features opcionales:

- **Auth**: "login", "auth", "usuarios", "registro", "signup"
- **Payments**: "pagos", "stripe", "suscripcion", "checkout"
- **Landing**: "landing", "marketing", "homepage"
- **Components**: "componentes", "shadcn", "ui library"
- **Database**: "database", "supabase", "schema", "tablas"

## Archivos del Skill

```
.claude/skills/autopilot/
├── README.md              ← Este archivo
├── instructions.md        ← Logica detallada de las 11 fases
└── templates/
    └── AUTOPILOT.md       ← Template del archivo de estado
```

## Comandos Relacionados

- `.claude/commands/autopilot.md` — Comando principal
- `.claude/commands/autopilot-resume.md` — Recovery

## Estado

El autopilot persiste su estado en `.planning/AUTOPILOT.md` para recovery.
