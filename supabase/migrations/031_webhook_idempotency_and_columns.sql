-- ============================================================================
-- Migration 031: Stripe webhook — missing columns + event idempotency
-- ============================================================================
-- The webhook writes organizations.billing_cycle / payment_retry_count /
-- last_payment_failed_at, none of which existed (every dunning/subscription
-- update threw). Adds them. Also adds a processed_webhook_events table so the
-- webhook can deduplicate Stripe's at-least-once delivery (finding H-A), and a
-- unique guard on payments.stripe_payment_id so a replayed checkout cannot
-- double-record a payment.
-- ============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_cycle text,
  ADD COLUMN IF NOT EXISTS payment_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_failed_at timestamptz;

-- Idempotency ledger for Stripe webhook events.
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: only the service-role webhook (which bypasses RLS) touches it.

-- Prevent duplicate payment rows from replayed checkout.session.completed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_payment_id
  ON public.payments(stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;
