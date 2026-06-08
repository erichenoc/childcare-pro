-- ============================================================================
-- Migration 030: Guardian (parent portal) RLS access
-- ============================================================================
-- Parents authenticate with a Supabase auth user linked via guardians.portal_user_id.
-- They do NOT have a profiles row, so get_user_organization_id() is NULL for them
-- and the staff/org policies from migration 027 deny everything. Before RLS was
-- enabled this didn't matter; now the parent portal needs explicit guardian-scoped
-- read policies. These are SELECT-only and combine (OR) with the existing staff
-- policies. They also enforce per-family/per-child scoping at the DB layer, which
-- is defense-in-depth against the family-portal IDOR (request-supplied child ids).
-- ============================================================================

-- Helper: does the current auth user (a guardian) belong to a given family?
CREATE OR REPLACE FUNCTION public.is_guardian_family(fid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardians g
    WHERE g.portal_user_id = auth.uid() AND g.family_id = fid
  );
$$;

-- Helper: is a given child in the current guardian's family?
CREATE OR REPLACE FUNCTION public.is_guardian_child(cid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.children c
    JOIN public.guardians g ON g.family_id = c.family_id
    WHERE g.portal_user_id = auth.uid() AND c.id = cid
  );
$$;

-- guardians: a parent can read their own guardian rows
DROP POLICY IF EXISTS guardians_self_select ON public.guardians;
CREATE POLICY guardians_self_select ON public.guardians
  FOR SELECT TO authenticated
  USING (portal_user_id = auth.uid());

-- families: parent can read their own family
DROP POLICY IF EXISTS families_guardian_select ON public.families;
CREATE POLICY families_guardian_select ON public.families
  FOR SELECT TO authenticated
  USING (public.is_guardian_family(id));

-- children: parent can read children in their family
DROP POLICY IF EXISTS children_guardian_select ON public.children;
CREATE POLICY children_guardian_select ON public.children
  FOR SELECT TO authenticated
  USING (public.is_guardian_family(family_id));

-- invoices: parent can read their family's invoices
DROP POLICY IF EXISTS invoices_guardian_select ON public.invoices;
CREATE POLICY invoices_guardian_select ON public.invoices
  FOR SELECT TO authenticated
  USING (public.is_guardian_family(family_id));

-- daily_photos: parent can read their children's photos
DROP POLICY IF EXISTS daily_photos_guardian_select ON public.daily_photos;
CREATE POLICY daily_photos_guardian_select ON public.daily_photos
  FOR SELECT TO authenticated
  USING (public.is_guardian_child(child_id));

-- attendance: parent can read their children's attendance
DROP POLICY IF EXISTS attendance_guardian_select ON public.attendance;
CREATE POLICY attendance_guardian_select ON public.attendance
  FOR SELECT TO authenticated
  USING (public.is_guardian_child(child_id));

-- daily_reports: parent can read their children's daily reports
DROP POLICY IF EXISTS daily_reports_guardian_select ON public.daily_reports;
CREATE POLICY daily_reports_guardian_select ON public.daily_reports
  FOR SELECT TO authenticated
  USING (public.is_guardian_child(child_id));
