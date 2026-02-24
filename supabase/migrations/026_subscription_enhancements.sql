-- =====================================================
-- Migration: 026_subscription_enhancements
-- Description: Add billing_cycle, coupon tracking, and dunning fields
-- =====================================================

-- Add billing_cycle to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_failed_at TIMESTAMPTZ;

-- Add billing_cycle and coupon to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
ADD COLUMN IF NOT EXISTS child_count_at_signup INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_amount_cents INTEGER;

-- Create coupons tracking table
CREATE TABLE IF NOT EXISTS stripe_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_coupon_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  percent_off DECIMAL(5,2),
  amount_off INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  duration TEXT NOT NULL CHECK (duration IN ('once', 'repeating', 'forever')),
  duration_in_months INTEGER,
  max_redemptions INTEGER,
  times_redeemed INTEGER DEFAULT 0,
  valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for coupon lookups
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_code ON stripe_coupons(code);
CREATE INDEX IF NOT EXISTS idx_stripe_coupons_valid ON stripe_coupons(valid) WHERE valid = true;

-- RLS for stripe_coupons (admin only via service role, but readable by org members)
ALTER TABLE stripe_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_coupons_read_access" ON stripe_coupons
  FOR SELECT
  USING (
    organization_id IS NULL -- global coupons readable by all
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
