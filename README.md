# ChildCare Pro - SaaS Multi-Tenant

Plataforma SaaS multi-tenant para la gestion integral de guarderias y centros de cuidado infantil en Florida, USA.

## Estado del Proyecto

| Funcionalidad | Estado |
|---------------|--------|
| Autenticacion (Supabase Auth) | Completado |
| CRUD de Familias | Completado |
| CRUD de Ninos | Completado |
| CRUD de Staff | Completado |
| CRUD de Salones | Completado |
| Sistema de Asistencia | Completado |
| Facturacion con Stripe | Completado |
| Ratios DCF en Tiempo Real | Completado |
| Seguridad de APIs | Completado |

## Tech Stack

| Categoria | Tecnologia | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript | 5.x |
| Base de Datos | Supabase (PostgreSQL) | Latest |
| Autenticacion | Supabase Auth | Latest |
| Estilos | Tailwind CSS | 3.x |
| Pagos | Stripe | Latest |
| Estado | Zustand | 5.x |
| Validacion | Zod | 3.x |

## Inicio Rapido

### Prerequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Stripe (para pagos)

### Instalacion

```bash
# Clonar el repositorio
git clone <repository-url>
cd "Child Care - Program"

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno Requeridas

Crear archivo `.env.local` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe (requerido para pagos)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Seguridad (requerido para admin)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@tudominio.com
```

### Migracion Pendiente

Despues de configurar las variables de entorno, ejecutar la migracion de seguridad:

```bash
# Ejecutar en Supabase SQL Editor o via CLI
supabase db push
# O ejecutar manualmente: supabase/migrations/021_audit_logs.sql
```

Esta migracion crea:
- Tabla `audit_logs` para registro de operaciones sensibles
- Tabla `sales_leads` para gestion de leads
- Tabla `appointments` para citas/demos

## Estructura del Proyecto

```
proyecto/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticacion
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Panel de administracion
│   │   ├── children/             # Gestion de ninos
│   │   ├── families/             # Gestion de familias
│   │   ├── staff/                # Gestion de personal
│   │   ├── classrooms/           # Gestion de salones
│   │   ├── attendance/           # Control de asistencia
│   │   ├── billing/              # Facturacion y pagos
│   │   ├── communication/        # Mensajeria
│   │   ├── reports/              # Reportes
│   │   ├── incidents/            # Incidentes
│   │   └── settings/             # Configuracion
│   └── api/                      # API Routes
│       ├── stripe/               # Endpoints de Stripe
│       │   ├── checkout/         # Crear sesion de pago
│       │   └── webhook/          # Webhook de Stripe
│       └── auth/                 # Callbacks de auth
│
├── features/                     # Feature-First Architecture
│   ├── auth/                     # Autenticacion
│   ├── billing/                  # Facturacion
│   │   └── services/
│   │       ├── billing.service.ts
│   │       └── stripe.service.ts
│   ├── chat/                     # Chat/Asistente
│   ├── layout/                   # Componentes de layout
│   └── theme/                    # Manejo de tema
│
├── shared/                       # Codigo compartido
│   ├── components/               # Componentes UI
│   ├── lib/                      # Utilidades y configuracion
│   │   ├── supabase/             # Cliente Supabase
│   │   ├── auth-helpers.ts       # Utilidades de autenticacion
│   │   ├── rate-limiter.ts       # Rate limiting para APIs
│   │   ├── audit-logger.ts       # Audit logging
│   │   └── validations/          # Schemas Zod
│   └── types/                    # Tipos TypeScript
│
└── docs/                         # Documentacion adicional
```

## Sistema de Pagos (Stripe)

### Arquitectura de Pagos

El sistema de pagos soporta dos metodos:

1. **Pagos con Tarjeta (Stripe Checkout)**
   - Redireccion segura a Stripe
   - Procesamiento automatico via webhooks
   - Actualizacion automatica del estado de facturas

2. **Pagos Manuales**
   - Efectivo
   - Cheque
   - Transferencia bancaria

### Archivos Clave

| Archivo | Descripcion |
|---------|-------------|
| `features/billing/services/stripe.service.ts` | Servicio cliente para Stripe |
| `app/api/stripe/checkout/route.ts` | API para crear sesiones de checkout |
| `app/api/stripe/webhook/route.ts` | Webhook para procesar pagos completados |
| `app/dashboard/billing/page.tsx` | Pagina de facturacion |

### Flujo de Pago con Tarjeta

```
1. Usuario selecciona factura → 2. Clic en "Pagar con Tarjeta"
                                          ↓
3. Frontend llama a stripe.service.ts → 4. API crea Checkout Session
                                          ↓
5. Usuario completa pago en Stripe → 6. Webhook recibe confirmacion
                                          ↓
7. Se registra pago en Supabase → 8. Se actualiza estado de factura
```

### Configuracion de Webhook (Produccion)

Para recibir notificaciones de pagos en produccion:

1. Ir a Stripe Dashboard > Webhooks
2. Agregar endpoint: `https://tu-dominio.com/api/stripe/webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copiar el Webhook Secret a `STRIPE_WEBHOOK_SECRET`

### Pruebas en Desarrollo

Usar tarjetas de prueba de Stripe:

| Tarjeta | Resultado |
|---------|-----------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Tarjeta rechazada |
| 4000 0000 0000 3220 | Requiere 3D Secure |

## Autenticacion

El sistema usa Supabase Auth con soporte para:

- **Email/Password**: Registro e inicio de sesion tradicional
- **Google OAuth**: Inicio de sesion con cuenta de Google

### Configuracion de Google OAuth

1. Ir a Supabase Dashboard > Authentication > Providers
2. Habilitar Google
3. Configurar credenciales de Google Cloud Console

## Seguridad

### Utilidades de Seguridad Disponibles

El proyecto incluye utilidades reutilizables para seguridad en APIs:

| Archivo | Descripcion |
|---------|-------------|
| `shared/lib/auth-helpers.ts` | Verificacion de autenticacion y autorizacion admin |
| `shared/lib/rate-limiter.ts` | Rate limiting configurable por endpoint |
| `shared/lib/audit-logger.ts` | Logging de operaciones sensibles |
| `shared/lib/validations/*.ts` | Schemas Zod para validacion de entrada |

### Uso de Auth Helpers

```typescript
import { verifyAdminAuth, isAuthError } from '@/shared/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth()
  if (isAuthError(auth)) return auth.response

  // Usuario autenticado como admin
  const { user } = auth
}
```

### Uso de Rate Limiter

```typescript
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RateLimits.public, 'leads')
  if (rateLimitResponse) return rateLimitResponse

  // Procesar request
}
```

Configuraciones predefinidas:
- `RateLimits.public`: 10 req/min (endpoints publicos)
- `RateLimits.authenticated`: 60 req/min (usuarios autenticados)
- `RateLimits.strict`: 5 req/5min (operaciones sensibles)
- `RateLimits.ai`: 20 req/min (endpoints de IA)

### Uso de Audit Logger

```typescript
import { AuditLogger } from '@/shared/lib/audit-logger'

// Registrar acceso admin
await AuditLogger.adminAccess(user.email, user.id, 'leads', request.headers)

// Registrar pago iniciado
await AuditLogger.paymentInitiated(userId, orgId, invoiceId, amount, headers)

// Alertas de seguridad
await AuditLogger.securityAlert('Suspicious activity', { details }, headers)
```

### Uso de Schemas de Validacion

```typescript
import { createLeadSchema } from '@/shared/lib/validations'

const result = createLeadSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json({ error: result.error.errors }, { status: 400 })
}
const validatedData = result.data
```

Schemas disponibles:
- `createLeadSchema` / `getLeadsQuerySchema`
- `createAppointmentSchema` / `getAppointmentsQuerySchema`
- `createCheckoutSessionSchema`

## Ratios DCF de Florida

El sistema monitorea los ratios requeridos por el DCF de Florida:

| Grupo de Edad | Ratio Ninos:Staff | Tamano Maximo |
|---------------|-------------------|---------------|
| Infantes (0-12 meses) | 4:1 | 8 |
| 1 ano | 6:1 | 12 |
| 2 anos | 11:1 | 22 |
| 3 anos | 15:1 | 30 |
| 4-5 anos | 20:1 | 40 |
| Edad escolar (5+) | 25:1 | 50 |

## Comandos de Desarrollo

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Build
npm run build        # Build de produccion
npm run start        # Iniciar servidor de produccion

# Calidad de codigo
npm run lint         # Ejecutar ESLint
```

## Documentacion Adicional

- [CLAUDE.md](/Users/erichenocpenapaulino/Documents/Child Care - Program/CLAUDE.md) - Instrucciones para desarrollo con IA
- [CHILDCARE_SAAS_PROMPT.md](/Users/erichenocpenapaulino/Documents/Child Care - Program/CHILDCARE_SAAS_PROMPT.md) - Especificaciones completas del proyecto
- [CHILDCARE_SAAS_STRUCTURE.md](/Users/erichenocpenapaulino/Documents/Child Care - Program/CHILDCARE_SAAS_STRUCTURE.md) - Arquitectura y estructura

## Contribuir

1. Seguir las convenciones de codigo en CLAUDE.md
2. Usar Conventional Commits para mensajes
3. Crear PRs para todas las funcionalidades nuevas
4. Incluir tests para codigo nuevo

## Licencia

Proyecto privado. Todos los derechos reservados.
