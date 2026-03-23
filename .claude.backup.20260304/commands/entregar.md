---
description: "Entrega final del producto. Deploy, documentacion, instrucciones de uso y mantenimiento. El objetivo es independencia total — no depender de esta conversacion."
argument-hint: "[--cliente para documentacion para terceros]"
---

# Entrega Final: Producto Listo para el Mundo

Fase final que asegura que el producto esta desplegado, documentado y que el dueno tiene todo lo necesario para usarlo, mantenerlo y evolucionarlo sin depender de Claude.

## Principio Fundamental

> **"Un producto no esta 'entregado' hasta que el dueno puede operarlo solo. Documentacion no es opcional — es parte del producto."**

## Input: $ARGUMENTS

- Sin argumentos: Entrega para el dueno (tu)
- `--cliente`: Genera documentacion adicional para terceros/clientes

---

## Fase 1: Pre-Entrega — Verificacion Final

### 1.1 Checklist de Produccion

Verificar ANTES de declarar el producto listo:

```yaml
funcionalidad:
  - [ ] Todas las features de v1 implementadas y funcionando
  - [ ] Flujos criticos probados end-to-end
  - [ ] Manejo de errores en TODOS los endpoints
  - [ ] Estados vacios (empty states) en todas las listas

seguridad:
  - [ ] Variables de entorno — NINGUNA hardcodeada en codigo
  - [ ] .env.local en .gitignore
  - [ ] RLS habilitado en TODAS las tablas de Supabase
  - [ ] Rutas protegidas verifican autenticacion
  - [ ] CORS configurado solo para dominios permitidos
  - [ ] Rate limiting en endpoints publicos

datos:
  - [ ] Migraciones de BD aplicadas en produccion
  - [ ] Datos de prueba eliminados (o claramente marcados)
  - [ ] Backup strategy definida (Supabase point-in-time)

infraestructura:
  - [ ] Deploy en Vercel exitoso y funcionando
  - [ ] Dominio configurado (si aplica)
  - [ ] Variables de entorno en Vercel actualizadas
  - [ ] SSL/HTTPS funcionando
```

### 1.2 Smoke Test en Produccion

Usar Playwright MCP para verificar produccion:

```
1. Navegar a URL de produccion
2. Verificar que carga sin errores
3. Probar login/registro
4. Probar flujo principal (happy path)
5. Verificar que datos se persisten
6. Screenshot de evidencia
```

---

## Fase 2: Deploy (si no esta desplegado)

### 2.1 Deploy a Vercel

```bash
# Verificar build local
npm run build

# Si build exitoso, deploy
# Usar /vercel:deploy o:
vercel --prod
```

### 2.2 Variables de Entorno

Verificar que TODAS estan en Vercel:

```yaml
# Listar las necesarias (sin valores)
variables_requeridas:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - STRIPE_SECRET_KEY (si aplica)
  - STRIPE_WEBHOOK_SECRET (si aplica)
  - [otras especificas del proyecto]
```

### 2.3 Dominio (si aplica)

```yaml
configurar:
  - dominio_personalizado: "[dominio.com]"
  - dns_records: "[Registros necesarios]"
  - ssl: "Automatico via Vercel"
  - redirect_www: "Si/No"
```

---

## Fase 3: Documentacion para el Dueno

### 3.1 Guia de Operacion Rapida

Generar archivo `docs/OPERACION.md`:

```markdown
# Guia de Operacion - [Nombre del Proyecto]

## Accesos
| Servicio | URL | Notas |
|----------|-----|-------|
| App (produccion) | [URL] | Frontend |
| Supabase Dashboard | [URL] | Base de datos |
| Vercel Dashboard | [URL] | Deploys |
| Stripe Dashboard | [URL] | Pagos (si aplica) |
| GitHub Repo | [URL] | Codigo fuente |

## Como hacer cosas comunes

### Agregar un usuario admin
[Pasos especificos en Supabase o la app]

### Ver logs de errores
[Donde ir y que buscar]

### Actualizar el producto
```bash
# Hacer cambios en el codigo
git add . && git commit -m "descripcion del cambio"
git push origin main
# Vercel despliega automaticamente
```

### Restaurar la base de datos
[Pasos para point-in-time recovery en Supabase]

### Costos mensuales estimados
| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | [Free/Pro] | $[X]/mes |
| Supabase | [Free/Pro] | $[X]/mes |
| Dominio | [Registrar] | $[X]/ano |
| Total estimado | | $[X]/mes |
```

### 3.2 Inventario Tecnico

Generar archivo `docs/INVENTARIO_TECNICO.md`:

```markdown
# Inventario Tecnico - [Nombre del Proyecto]

## Stack
| Capa | Tecnologia | Version | Documentacion |
|------|------------|---------|---------------|
| Framework | Next.js | [X] | [URL docs] |
| Base de datos | Supabase/PostgreSQL | [X] | [URL docs] |
| Auth | Supabase Auth | [X] | [URL docs] |
| Pagos | Stripe | [X] | [URL docs] |
| Deploy | Vercel | - | [URL docs] |

## Estructura del Proyecto
[Tree simplificado con explicacion de cada carpeta]

## Base de Datos
### Tablas principales
| Tabla | Proposito | Registros | RLS |
|-------|-----------|-----------|-----|
| [tabla] | [que guarda] | [N] | SI/NO |

### Migraciones aplicadas
[Lista de migraciones con descripcion]

## APIs y Endpoints
| Metodo | Ruta | Proposito | Auth requerida |
|--------|------|-----------|----------------|
| GET | /api/[X] | [Que hace] | Si/No |
| POST | /api/[X] | [Que hace] | Si/No |

## Variables de Entorno
| Variable | Donde obtenerla | Proposito |
|----------|-----------------|-----------|
| [VAR] | [URL/instruccion] | [Para que sirve] |

## Dependencias Externas
| Servicio | Proposito | Plan actual | Limite |
|----------|-----------|-------------|--------|
| [servicio] | [para que] | [free/pro] | [limites] |
```

### 3.3 Mapa de Archivos Clave

```markdown
# Archivos Clave - Si necesitas cambiar algo, empieza aqui

## Cambiar la apariencia
- `tailwind.config.ts` → Colores, fonts, breakpoints
- `shared/components/ui/` → Componentes reutilizables
- `app/layout.tsx` → Layout global

## Cambiar logica de negocio
- `features/[feature]/services/` → Logica de cada modulo
- `features/[feature]/types/` → Tipos y validaciones

## Cambiar base de datos
- `supabase/migrations/` → Migraciones (crear nueva, nunca editar existentes)
- `shared/types/database.types.ts` → Tipos generados de Supabase

## Cambiar autenticacion
- `shared/lib/supabase/` → Clientes de Supabase
- `shared/lib/auth-helpers.ts` → Helpers de auth

## Cambiar rutas
- `app/` → Estructura de carpetas = estructura de URLs
```

---

## Fase 4: Documentacion para Terceros (solo si se usa --cliente)

### 4.1 Manual de Usuario

Generar `docs/MANUAL_USUARIO.md` con:

```markdown
# Manual de Usuario - [Nombre del Producto]

## Primeros Pasos
1. Como crear una cuenta
2. Como iniciar sesion
3. Tour rapido de la interfaz

## [Feature 1]
### Que es y para que sirve
### Como usarlo paso a paso
### Preguntas frecuentes

## [Feature 2]
...

## Soporte
- Email: [contacto]
- Horario: [disponibilidad]
```

### 4.2 FAQ Tecnico

```markdown
# Preguntas Frecuentes

## "No puedo iniciar sesion"
[Pasos para resolver]

## "La pagina carga lento"
[Pasos para resolver]

## "Perdi mis datos"
[Pasos para resolver]
```

---

## Fase 5: Roadmap v2

### 5.1 Sugerencias de Mejora

Basado en lo construido, generar recomendaciones:

```markdown
# Roadmap v2 - [Nombre del Proyecto]

## Mejoras Sugeridas (por prioridad)

### Alta Prioridad
- [ ] [Mejora 1]: [Que aporta] - Complejidad: [Simple/Media/Alta]
- [ ] [Mejora 2]: [Que aporta] - Complejidad: [Simple/Media/Alta]

### Media Prioridad
- [ ] [Feature postergada de v1]
- [ ] [Optimizacion identificada en /pulir]

### Nice-to-Have
- [ ] [Idea para el futuro]

## Metricas a Monitorear
- [Metrica 1]: [Por que importa] - [Como medirla]
- [Metrica 2]: [Por que importa] - [Como medirla]

## Deuda Tecnica
- [Item 1]: [Impacto si no se resuelve]
- [Item 2]: [Impacto si no se resuelve]
```

---

## Fase 6: Reporte de Entrega

### 6.1 Resumen Final

```markdown
# Entrega Final - [Nombre del Proyecto]
**Fecha:** [YYYY-MM-DD]

## Estado: ENTREGADO

## URLs
- Produccion: [URL]
- Repositorio: [URL]
- Dashboard BD: [URL]

## Lo que se construyo
[Resumen de v1 completada]

## Documentacion generada
- [ ] docs/OPERACION.md
- [ ] docs/INVENTARIO_TECNICO.md
- [ ] docs/MANUAL_USUARIO.md (si --cliente)
- [ ] docs/ROADMAP_V2.md

## Lo que sigue
[Top 3 recomendaciones para v2]

## Independencia
El dueno tiene todo lo necesario para:
- Operar el producto diariamente
- Hacer cambios menores
- Entender la arquitectura
- Escalar cuando sea necesario
```

---

## Reglas de Comportamiento

### HACER
- Verificar TODO en produccion real (no asumir que funciona)
- Documentar con lenguaje simple y directo
- Incluir costos reales y limites de servicios
- Dar instrucciones paso a paso (no asumir conocimiento previo)
- Generar archivos reales en el proyecto (no solo mostrar en chat)

### NO HACER
- No entregar sin verificar produccion
- No dejar variables de entorno sin documentar
- No ignorar costos ocultos (servicios, limites, overages)
- No escribir documentacion generica — ser especifico al proyecto
- No crear dependencia — el objetivo es independencia total

### CRITERIO FINAL
```
Preguntate: "Si pierdo acceso a Claude manana,
tengo todo lo necesario para operar y evolucionar este producto?"

Si la respuesta es NO, la entrega no esta completa.
```

---

## Uso

```bash
# Entrega estandar (para ti como dueno)
/entregar

# Entrega con documentacion para cliente/terceros
/entregar --cliente

# Solo generar documentacion (sin deploy)
/entregar --docs-only

# Solo verificar produccion (sin documentar)
/entregar --verify-only
```

**Prerequisito:** El proyecto debe haber pasado por /pulir

**Este es el ULTIMO paso del flujo:**
```
/co-founder → /primer → /generar-prp → /ejecutar-prp → /bucle-agentico → /pulir → /entregar
                                                                                      ↑
                                                                               ESTAS AQUI
```

---

*SaaS Factory v3: Un producto no esta terminado hasta que su dueno puede operarlo solo.*
