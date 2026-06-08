-- ============================================================================
-- Migration 032: Fix new-client (tenant) signup under RLS
-- ============================================================================
-- Creating an organization fires on_organization_created_init_accounts ->
-- initialize_default_account_categories(NEW.id), which INSERTs default rows into
-- account_categories. That function ran as the calling user (SECURITY INVOKER).
-- During signup the new owner does not yet belong to the org, so account_categories
-- RLS blocked the seed INSERT and the whole organization INSERT failed — new client
-- signup was broken. Making the seeding functions SECURITY DEFINER lets them seed
-- the brand-new org's defaults regardless of the caller's membership. search_path
-- is pinned to avoid the function_search_path_mutable hazard.
-- ============================================================================

ALTER FUNCTION public.initialize_default_account_categories(uuid)
  SECURITY DEFINER
  SET search_path = public, pg_temp;

ALTER FUNCTION public.trigger_initialize_account_categories()
  SECURITY DEFINER
  SET search_path = public, pg_temp;
