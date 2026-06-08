-- ============================================================================
-- Migration 029: Fix sales_leads schema drift + tenant-scope leads
-- ============================================================================
-- The WhatsApp n8n create-lead route inserts organization_id / interest /
-- children_ages into sales_leads, but those columns never existed in the table
-- (schema vs code drift, finding H-C/#19), so every WhatsApp lead insert failed.
-- This adds the missing columns, a per-org dedup constraint for the upsert, and
-- upgrades the RLS so each organization can read ITS OWN leads (platform admins
-- still see all; org-less marketing-widget leads remain admin-only).
-- ============================================================================

ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interest text,
  ADD COLUMN IF NOT EXISTS children_ages text[];

CREATE INDEX IF NOT EXISTS idx_sales_leads_organization_id
  ON public.sales_leads(organization_id);

-- Per-org dedup for the n8n upsert on (organization_id, phone). Partial unique so
-- multiple org-less widget leads with the same phone are still allowed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_leads_org_phone
  ON public.sales_leads(organization_id, phone)
  WHERE organization_id IS NOT NULL AND phone IS NOT NULL;

-- Upgrade the SELECT policy: org members can read their org's leads.
DROP POLICY IF EXISTS sales_leads_admin_select ON public.sales_leads;
DROP POLICY IF EXISTS sales_leads_select ON public.sales_leads;
CREATE POLICY sales_leads_select ON public.sales_leads
  FOR SELECT TO authenticated
  USING (
    is_system_admin()
    OR (organization_id IS NOT NULL AND organization_id = get_user_organization_id())
  );
