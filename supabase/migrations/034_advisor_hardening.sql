-- ============================================================================
-- Migration 034: Advisor hardening — security_invoker views + function search_path
-- ============================================================================
-- (1) 19 public views ran as their owner (SECURITY DEFINER semantics), bypassing
--     the querying user's RLS. With multiple tenants this leaks cross-tenant data
--     to anyone who can query the view (directly via PostgREST, like the original
--     RLS breach). Flip every view to security_invoker so the caller's RLS on the
--     underlying tables applies. Super-admin (cross-tenant) reporting still works
--     because the underlying policies include is_system_admin().
-- (2) Admin reporting reads subscriptions/subscription_events; add is_system_admin()
--     to those SELECT policies so platform admins retain cross-tenant visibility
--     under security_invoker.
-- (3) ~52 functions had a mutable search_path (privilege-escalation hazard for
--     SECURITY DEFINER ones). Pin them to a fixed search_path.
-- ============================================================================

-- (1) Flip all public views to security_invoker
DO $$
DECLARE v record;
BEGIN
  FOR v IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v.relname);
  END LOOP;
END $$;

-- (2) Allow platform admins to read billing data cross-tenant (for admin views)
DROP POLICY IF EXISTS "Users can view their org subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their org subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR is_system_admin()
  );

DROP POLICY IF EXISTS "Users can view their org subscription events" ON public.subscription_events;
CREATE POLICY "Users can view their org subscription events" ON public.subscription_events
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR is_system_admin()
  );

-- (3) Pin a fixed search_path on every public function we own that lacks one
--     (skip extension-owned functions like pg_trgm's set_limit).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}'::text[])) c
        WHERE c LIKE 'search_path=%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.func);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- e.g. functions we don't own (extensions); skip
    END;
  END LOOP;
END $$;
