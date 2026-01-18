-- =====================================================
-- MIGRATION 003: System Admins (Super Admin Dashboard)
-- =====================================================
-- Separates SaaS owner (super_admin) from tenant admins

-- Table for SaaS system administrators (you)
CREATE TABLE IF NOT EXISTS system_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'super_admin', -- super_admin, support, sales
  permissions JSONB DEFAULT '["all"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the primary super admin
INSERT INTO system_admins (email, name, role, permissions)
VALUES ('erichenoc@gmail.com', 'Eric Henoc', 'super_admin', '["all"]'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- Function to check if current user is a system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email from the JWT token
  user_email := auth.jwt() ->> 'email';

  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM system_admins
    WHERE email = user_email
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system admin role
CREATE OR REPLACE FUNCTION get_system_admin_role()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  admin_role TEXT;
BEGIN
  user_email := auth.jwt() ->> 'email';

  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO admin_role
  FROM system_admins
  WHERE email = user_email AND is_active = true;

  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login for system admin
CREATE OR REPLACE FUNCTION update_system_admin_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE system_admins
  SET
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE email = auth.jwt() ->> 'email';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for system_admins table
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Only system admins can view the system_admins table
CREATE POLICY "System admins can view all system admins"
  ON system_admins FOR SELECT
  USING (is_system_admin());

-- Only super_admin role can modify system_admins
CREATE POLICY "Super admins can insert system admins"
  ON system_admins FOR INSERT
  WITH CHECK (get_system_admin_role() = 'super_admin');

CREATE POLICY "Super admins can update system admins"
  ON system_admins FOR UPDATE
  USING (get_system_admin_role() = 'super_admin');

CREATE POLICY "Super admins can delete system admins"
  ON system_admins FOR DELETE
  USING (get_system_admin_role() = 'super_admin');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_admins_email ON system_admins(email);
CREATE INDEX IF NOT EXISTS idx_system_admins_role ON system_admins(role);

-- Trigger for updated_at
CREATE TRIGGER update_system_admins_updated_at
  BEFORE UPDATE ON system_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Views for Super Admin Dashboard (Cross-Tenant Access)
-- =====================================================

-- View: All organizations with subscription info
CREATE OR REPLACE VIEW admin_organizations_view AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.email,
  o.phone,
  o.license_number,
  o.city,
  o.state,
  o.subscription_plan,
  o.subscription_status,
  o.stripe_customer_id,
  o.trial_ends_at,
  o.current_period_start,
  o.current_period_end,
  o.max_children,
  o.max_staff,
  o.created_at,
  o.updated_at,
  (SELECT COUNT(*) FROM children c WHERE c.organization_id = o.id AND c.status = 'active') as children_count,
  (SELECT COUNT(*) FROM profiles p WHERE p.organization_id = o.id AND p.status = 'active') as staff_count,
  (SELECT COUNT(*) FROM families f WHERE f.organization_id = o.id AND f.status = 'active') as families_count,
  (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.organization_id = o.id AND i.status = 'paid') as total_revenue
FROM organizations o
WHERE is_system_admin(); -- Only accessible to system admins

-- View: Revenue analytics
CREATE OR REPLACE VIEW admin_revenue_view AS
SELECT
  DATE_TRUNC('month', p.paid_at) as month,
  COUNT(DISTINCT p.invoice_id) as invoice_count,
  SUM(p.amount) as total_revenue,
  COUNT(DISTINCT p.family_id) as unique_families,
  o.subscription_plan
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN organizations o ON i.organization_id = o.id
WHERE is_system_admin()
GROUP BY DATE_TRUNC('month', p.paid_at), o.subscription_plan
ORDER BY month DESC;

-- View: Subscription metrics
CREATE OR REPLACE VIEW admin_subscription_metrics_view AS
SELECT
  subscription_plan,
  subscription_status,
  COUNT(*) as org_count,
  SUM(max_children) as total_children_capacity,
  SUM(max_staff) as total_staff_capacity
FROM organizations
WHERE is_system_admin()
GROUP BY subscription_plan, subscription_status;

COMMENT ON TABLE system_admins IS 'SaaS platform administrators (separate from tenant users)';
COMMENT ON FUNCTION is_system_admin() IS 'Check if current authenticated user is a system admin';
