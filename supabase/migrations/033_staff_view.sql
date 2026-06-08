-- ============================================================================
-- Migration 033: `staff` compatibility view over `profiles`
-- ============================================================================
-- The application reads `.from('staff')` in ~29 places (admissions, billing-plans,
-- incidents) and migration 020's RLS policies query `FROM staff`, but no `staff`
-- table or view ever existed — so those reads errored at runtime and the
-- admissions feature was broken. The canonical staff/user table is `profiles`
-- (owners/directors/teachers/etc.; parents are `guardians`, not profiles).
--
-- This creates `staff` as a view over `profiles`. All app usages are read-only
-- (id, organization_id, email, first_name, last_name), all present on profiles.
-- security_invoker=true ensures the querying user's RLS on profiles is applied
-- (so this is NOT a security-definer view), preserving tenant isolation.
-- ============================================================================

CREATE OR REPLACE VIEW public.staff
  WITH (security_invoker = true)
  AS SELECT * FROM public.profiles;
