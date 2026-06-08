-- ============================================================================
-- Migration 028: CRITICAL — Remove permissive client-write policies on billing
-- ============================================================================
-- subscriptions and subscription_events shipped with INSERT/UPDATE policies
-- defined as WITH CHECK (true) / USING (true) on the `public` role. Despite the
-- "Only system can ..." names, these allowed ANY authenticated (or anon) user to
-- INSERT/UPDATE billing rows for ANY organization (grant themselves enterprise,
-- overwrite stripe ids, poison dunning state).
--
-- All legitimate writes to these tables come from the Stripe webhook using the
-- service-role key, which BYPASSES RLS. Therefore the correct policy is: no
-- client write path at all. We drop the permissive write policies and keep the
-- existing org-scoped SELECT policies for read access.
-- ============================================================================

DROP POLICY IF EXISTS "Only system can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Only system can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Only system can insert subscription events" ON public.subscription_events;

-- (Optional defense-in-depth) explicit deny for client DELETE is implicit:
-- with RLS enabled and no DELETE policy, clients cannot delete. Service-role
-- continues to bypass RLS for all webhook-driven writes.
