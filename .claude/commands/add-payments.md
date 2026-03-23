---
description: "Agrega integracion completa de pagos con Stripe. Incluye checkout, suscripciones, webhooks y portal de cliente"
---

# Add Payments (Stripe)

Agrega un sistema completo de pagos con Stripe al proyecto.

## Prerequisitos

Verifica que el usuario tenga:
- Cuenta de Stripe (al menos test mode)
- Supabase configurado con auth funcionando

Si no tiene cuenta de Stripe, dirigelo a https://dashboard.stripe.com/register

## Proceso

### Paso 1: Entrevista rapida

Pregunta al usuario:

1. **Modelo de precios**:
   - Suscripcion mensual/anual
   - Pago unico
   - Freemium con upgrade

2. **Planes** (si es suscripcion):
   - Cuantos planes? (ej: Free, Pro, Enterprise)
   - Precio de cada uno?
   - Que incluye cada plan?

3. **Stripe Keys**:
   > Necesito tu Publishable Key y Secret Key de Stripe (modo test).
   > Los encuentras en https://dashboard.stripe.com/test/apikeys

### Paso 2: Instalar dependencias

```bash
npm install stripe @stripe/stripe-js
```

### Paso 3: Configurar .env.local

Agrega las keys al `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Paso 4: Crear feature billing

Sigue la estructura Feature-First:

```
src/features/billing/
├── components/
│   ├── PricingTable.tsx
│   ├── CheckoutButton.tsx
│   └── CustomerPortalButton.tsx
├── hooks/
│   └── useSubscription.ts
├── services/
│   └── stripe-service.ts
├── types/
│   └── billing.ts
└── store/
    └── billing-store.ts
```

### Paso 5: API Routes

Crea las API routes necesarias:
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/stripe/webhook/route.ts`

### Paso 6: Base de datos

Usa Supabase MCP para crear la tabla de suscripciones con RLS.

### Paso 7: Verificar

1. Test checkout flow completo
2. Verificar webhook recibe eventos
3. Confirmar RLS protege datos de suscripcion

## Notas de Seguridad

- NUNCA confiar en precios del cliente. Siempre validar server-side
- Verificar firma del webhook con `stripe.webhooks.constructEvent()`
- Manejar webhooks de forma idempotente (pueden llegar duplicados)
