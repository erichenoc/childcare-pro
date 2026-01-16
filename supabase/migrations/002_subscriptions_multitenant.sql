-- Migration: 002_subscriptions_multitenant
-- Description: Add subscription management for multi-tenant SaaS
-- Date: 2026-01-15

-- ============================================
-- 1. ADD SUBSCRIPTION FIELDS TO ORGANIZATIONS
-- ============================================

-- Add trial and subscription tracking fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_staff INTEGER DEFAULT 3;

-- Create subscription plan enum
DO $$ BEGIN
    CREATE TYPE subscription_plan_type AS ENUM ('trial', 'starter', 'professional', 'enterprise', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update subscription_plan to use enum (if it's text, convert it)
-- First, add a temporary column
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan subscription_plan_type DEFAULT 'trial';

-- ============================================
-- 2. CREATE SUBSCRIPTIONS HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT,
    plan subscription_plan_type NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active', -- active, past_due, cancelled, trialing
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- 3. CREATE SUBSCRIPTION EVENTS TABLE (AUDIT)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- created, updated, cancelled, payment_failed, payment_succeeded
    stripe_event_id TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_org_id ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type ON subscription_events(event_type);

-- ============================================
-- 4. ADD OWNER FLAG TO PROFILES
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_org_owner BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their org subscriptions"
    ON subscriptions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Only system can insert subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (true); -- Controlled via service role

CREATE POLICY "Only system can update subscriptions"
    ON subscriptions FOR UPDATE
    USING (true); -- Controlled via service role

-- RLS Policies for subscription_events
CREATE POLICY "Users can view their org subscription events"
    ON subscription_events FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Only system can insert subscription events"
    ON subscription_events FOR INSERT
    WITH CHECK (true); -- Controlled via service role

-- ============================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if organization is on active subscription
CREATE OR REPLACE FUNCTION is_org_subscription_active(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    org_status TEXT;
    trial_end TIMESTAMPTZ;
    period_end TIMESTAMPTZ;
BEGIN
    SELECT
        subscription_status::TEXT,
        trial_ends_at,
        current_period_end
    INTO org_status, trial_end, period_end
    FROM organizations
    WHERE id = org_id;

    -- Check trial
    IF trial_end IS NOT NULL AND trial_end > NOW() THEN
        RETURN TRUE;
    END IF;

    -- Check active subscription
    IF org_status = 'active' AND (period_end IS NULL OR period_end > NOW()) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION get_current_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user limits
CREATE OR REPLACE FUNCTION check_org_limits(org_id UUID, entity_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    IF entity_type = 'children' THEN
        SELECT COUNT(*) INTO current_count FROM children WHERE organization_id = org_id AND status = 'active';
        SELECT max_children INTO max_allowed FROM organizations WHERE id = org_id;
    ELSIF entity_type = 'staff' THEN
        SELECT COUNT(*) INTO current_count FROM profiles WHERE organization_id = org_id AND status = 'active' AND role != 'parent';
        SELECT max_staff INTO max_allowed FROM organizations WHERE id = org_id;
    ELSE
        RETURN TRUE;
    END IF;

    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. UPDATE TRIGGERS
-- ============================================

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. PLAN LIMITS CONFIGURATION
-- ============================================

-- Create a table for plan configurations
CREATE TABLE IF NOT EXISTS plan_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan subscription_plan_type NOT NULL UNIQUE,
    name TEXT NOT NULL,
    max_children INTEGER NOT NULL,
    max_staff INTEGER NOT NULL,
    price_monthly_cents INTEGER NOT NULL,
    price_annual_cents INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan configurations
INSERT INTO plan_configs (plan, name, max_children, max_staff, price_monthly_cents, price_annual_cents, features)
VALUES
    ('trial', 'Trial', 15, 3, 0, 0, '["all_features", "14_days"]'),
    ('starter', 'Starter', 15, 3, 7900, 79000, '["check_in", "billing", "reports", "ai_support", "parent_communication"]'),
    ('professional', 'Professional', 50, 10, 14900, 149000, '["all_starter", "ratio_tracking", "advanced_reports", "priority_support"]'),
    ('enterprise', 'Enterprise', 150, 999, 29900, 299000, '["all_professional", "multi_location", "api_access", "dedicated_onboarding", "custom_branding"]')
ON CONFLICT (plan) DO UPDATE SET
    name = EXCLUDED.name,
    max_children = EXCLUDED.max_children,
    max_staff = EXCLUDED.max_staff,
    price_monthly_cents = EXCLUDED.price_monthly_cents,
    price_annual_cents = EXCLUDED.price_annual_cents,
    features = EXCLUDED.features;

-- Disable RLS for plan_configs (public read)
ALTER TABLE plan_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan configs"
    ON plan_configs FOR SELECT
    USING (true);

-- ============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription data for each organization';
COMMENT ON TABLE subscription_events IS 'Audit log of all subscription-related events';
COMMENT ON TABLE plan_configs IS 'Configuration for each subscription plan tier';
COMMENT ON COLUMN organizations.trial_ends_at IS 'When the free trial expires';
COMMENT ON COLUMN organizations.max_children IS 'Maximum active children allowed by plan';
COMMENT ON COLUMN organizations.max_staff IS 'Maximum staff members allowed by plan';
COMMENT ON COLUMN profiles.is_org_owner IS 'True if this user is the organization owner/admin';
