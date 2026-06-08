-- ============================================================================
-- Migration 035: add missing RLS policies to menu_items / menu_templates
-- ============================================================================
-- Both tables had RLS enabled but ZERO policies (deny-all), which silently broke
-- the food-program menu feature under RLS. Both carry organization_id, so apply
-- the standard org-isolation policy.
-- ============================================================================

DO $$
DECLARE
  t text;
  menu_tables text[] := ARRAY['menu_items','menu_templates'];
BEGIN
  FOREACH t IN ARRAY menu_tables LOOP
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
