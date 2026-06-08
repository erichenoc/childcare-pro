-- ============================================================================
-- Migration 027: CRITICAL — Enable Row Level Security on all tenant tables
-- ============================================================================
-- The live production database had RLS DISABLED with zero policies on 19 public
-- tables (children, families, profiles, organizations, invoices, payments, etc.),
-- exposing minors' medical PII and payment data to anyone holding the public
-- anon key via PostgREST. Migrations 001/etc DECLARED these policies but they
-- were never effectively applied. This migration enables RLS and (re)creates the
-- canonical organization-scoped policies, derived server-side from auth.uid()
-- via the SECURITY DEFINER helper get_user_organization_id().
--
-- Model:
--   * Standard tenant tables: a single org-isolation policy (authenticated only).
--   * organizations: scoped by id; allow signup insert + self update.
--   * profiles: own row + same-org visibility; self update; self insert (signup).
--   * sales_leads / appointments: no organization_id -> system-admin read/write
--     only; all programmatic capture goes through the service-role client
--     (which bypasses RLS), so NO anon/authenticated write path is exposed.
--   * keepalive: non-sensitive; RLS on with permissive read.
--
-- Service-role flows (Stripe webhook, n8n WhatsApp routes, public lead capture)
-- use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS and MUST scope by a
-- server-resolved organization_id in application code.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Standard tenant tables: org-isolation ALL policy (authenticated role only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  org_tables text[] := ARRAY[
    'children','families','classrooms','attendance','invoices','payments',
    'incidents','messages','daily_reports','daily_photos','bottle_feedings',
    'staff_assignments','staff_attendance','activity_log'
  ];
BEGIN
  FOREACH t IN ARRAY org_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_org_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
      || 'USING (organization_id = get_user_organization_id() OR is_system_admin()) '
      || 'WITH CHECK (organization_id = get_user_organization_id() OR is_system_admin());',
      t || '_org_isolation', t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) organizations (scoped by id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (id = get_user_organization_id() OR is_system_admin());

DROP POLICY IF EXISTS organizations_update ON public.organizations;
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = get_user_organization_id() OR is_system_admin())
  WITH CHECK (id = get_user_organization_id() OR is_system_admin());

-- Allow org creation during signup/onboarding (service-role also bypasses).
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS organizations_delete ON public.organizations;
CREATE POLICY organizations_delete ON public.organizations
  FOR DELETE TO authenticated
  USING (is_system_admin());

-- ---------------------------------------------------------------------------
-- 3) profiles (own row + same-org visibility)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() OR id = auth.uid() OR is_system_admin());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_system_admin())
  WITH CHECK (id = auth.uid() OR is_system_admin());

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4) sales_leads / appointments (no organization_id -> admin-only; capture via
--    service-role only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  lead_tables text[] := ARRAY['sales_leads','appointments'];
BEGIN
  FOREACH t IN ARRAY lead_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_admin_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (is_system_admin());',
      t || '_admin_select', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_admin_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (is_system_admin()) WITH CHECK (is_system_admin());',
      t || '_admin_update', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_admin_delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (is_system_admin());',
      t || '_admin_delete', t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) keepalive (non-sensitive utility table)
-- ---------------------------------------------------------------------------
ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS keepalive_read ON public.keepalive;
CREATE POLICY keepalive_read ON public.keepalive
  FOR SELECT TO authenticated USING (true);
