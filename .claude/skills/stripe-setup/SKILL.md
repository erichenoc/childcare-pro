# Stripe Payment Integration Skill

## Description
Sets up complete Stripe payment infrastructure for SaaS applications. Handles checkout, subscriptions, webhooks, and customer portal.

## Triggers
- "add payments", "stripe integration", "setup billing"
- "add subscriptions", "payment processing", "checkout"
- "stripe webhook", "customer portal"

## Instructions

### When triggered, implement Stripe following this pattern:

#### 1. Environment Setup
```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2. Dependencies
```bash
npm install stripe @stripe/stripe-js
```

#### 3. File Structure (Feature-First)
```
src/features/billing/
├── components/
│   ├── PricingTable.tsx      # Pricing cards with plan selection
│   ├── CheckoutButton.tsx    # Stripe Checkout redirect
│   └── CustomerPortalButton.tsx  # Manage subscription
├── hooks/
│   └── useSubscription.ts    # Current user subscription status
├── services/
│   └── stripe-service.ts     # Stripe API wrapper
├── types/
│   └── billing.ts            # Plan, Subscription types
└── store/
    └── billing-store.ts      # Zustand billing state
```

#### 4. API Routes
```
src/app/api/
├── stripe/
│   ├── checkout/route.ts     # Create checkout session
│   ├── portal/route.ts       # Create portal session
│   └── webhook/route.ts      # Handle Stripe events
```

#### 5. Database (Supabase)
```sql
-- Table: subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Users can only see their own subscription
alter table subscriptions enable row level security;
create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);
```

#### 6. Webhook Events to Handle
- `checkout.session.completed` - Create/update subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Failed payment notification

#### 7. Security Checklist
- [ ] Webhook signature verification
- [ ] Server-side price validation (never trust client prices)
- [ ] RLS on subscriptions table
- [ ] Idempotent webhook handling
