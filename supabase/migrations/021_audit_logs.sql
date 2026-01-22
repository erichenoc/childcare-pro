-- ============================================================================
-- Migration: 021_audit_logs
-- Description: Create audit_logs, sales_leads, and appointments tables
-- Status: EXECUTED on 2026-01-21
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action_time ON audit_logs(organization_id, action, created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Simple policy: users can view their own audit logs or admins can view all
CREATE POLICY "Users can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Comments
COMMENT ON TABLE audit_logs IS 'Security audit logs for tracking sensitive operations';

-- ============================================================================
-- Create sales_leads table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(200),
    source VARCHAR(50) DEFAULT 'chat_widget',
    status VARCHAR(30) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    score INTEGER DEFAULT 0,
    daycare_size VARCHAR(50),
    location VARCHAR(200),
    current_pain_points TEXT[],
    interested_features TEXT[],
    conversation_history JSONB,
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer_url TEXT,
    landing_page TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_source ON sales_leads(source);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON sales_leads(created_at DESC);

-- ============================================================================
-- Create appointments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES sales_leads(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    appointment_type VARCHAR(50) DEFAULT 'demo',
    status VARCHAR(30) DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    lead_name VARCHAR(100),
    lead_email VARCHAR(255),
    lead_phone VARCHAR(20),
    meeting_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_date, scheduled_time);
