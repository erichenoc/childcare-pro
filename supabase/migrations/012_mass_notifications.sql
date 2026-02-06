-- =====================================================
-- MIGRATION 012: Mass Notifications Module
-- =====================================================
-- Segmented bulk messaging system

-- =====================================================
-- Notification Templates
-- =====================================================

-- Reusable notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Content
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL, -- Plain text version
  body_html TEXT, -- HTML version (optional)

  -- Template variables supported
  -- {{child_name}}, {{parent_name}}, {{classroom_name}}, {{date}}, etc.
  variables TEXT[], -- List of variables used in template

  -- Type
  template_type TEXT NOT NULL, -- 'general', 'emergency', 'reminder', 'announcement', 'billing'

  -- Usage
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_org ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);

-- =====================================================
-- Mass Notifications
-- =====================================================

-- Mass notification campaigns
CREATE TABLE IF NOT EXISTS mass_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Content
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  template_id UUID REFERENCES notification_templates(id),

  -- Targeting/Segmentation
  target_type TEXT NOT NULL, -- 'all', 'classroom', 'family', 'custom'
  target_classroom_ids UUID[], -- If targeting specific classrooms
  target_family_ids UUID[], -- If targeting specific families
  target_filters JSONB, -- Custom filters: {status: 'active', program: 'vpk', etc.}

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  is_scheduled BOOLEAN DEFAULT false,

  -- Delivery stats
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  error_message TEXT,

  -- Tracking
  sent_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mass_notifications_org ON mass_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_mass_notifications_status ON mass_notifications(status);
CREATE INDEX IF NOT EXISTS idx_mass_notifications_scheduled ON mass_notifications(scheduled_at) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_mass_notifications_type ON mass_notifications(notification_type);

-- Individual notification recipients
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES mass_notifications(id) ON DELETE CASCADE,

  -- Recipient info
  family_id UUID REFERENCES families(id),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Personalized content (with variables replaced)
  personalized_subject TEXT,
  personalized_body TEXT,

  -- Delivery status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Tracking
  email_message_id TEXT, -- External email provider ID
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,

  -- Click tracking
  links_clicked TEXT[], -- URLs that were clicked

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_family ON notification_recipients(family_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_status ON notification_recipients(status);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_email ON notification_recipients(recipient_email);

-- =====================================================
-- In-App Notifications
-- =====================================================

-- In-app notifications (shown in dashboard)
CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Target user
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'reminder'

  -- Link (optional)
  action_url TEXT,
  action_label TEXT,

  -- Source
  source_type TEXT, -- 'mass_notification', 'system', 'incident', 'billing', etc.
  source_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,

  -- Expiration
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user ON app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_read ON app_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_app_notifications_created ON app_notifications(created_at);

-- =====================================================
-- Notification Preferences
-- =====================================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Email preferences
  email_enabled BOOLEAN DEFAULT true,
  email_daily_summary BOOLEAN DEFAULT false,
  email_immediate_alerts BOOLEAN DEFAULT true,

  -- SMS preferences
  sms_enabled BOOLEAN DEFAULT false,
  sms_emergencies_only BOOLEAN DEFAULT true,

  -- Push preferences
  push_enabled BOOLEAN DEFAULT true,
  push_sound_enabled BOOLEAN DEFAULT true,

  -- In-app preferences
  in_app_enabled BOOLEAN DEFAULT true,

  -- Category preferences
  receive_billing BOOLEAN DEFAULT true,
  receive_attendance BOOLEAN DEFAULT true,
  receive_incidents BOOLEAN DEFAULT true,
  receive_announcements BOOLEAN DEFAULT true,
  receive_reminders BOOLEAN DEFAULT true,
  receive_marketing BOOLEAN DEFAULT false,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notification Templates policies
CREATE POLICY "Users can view notification templates in their organization"
  ON notification_templates FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage notification templates"
  ON notification_templates FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Mass Notifications policies
CREATE POLICY "Staff can view mass notifications in their organization"
  ON mass_notifications FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage mass notifications"
  ON mass_notifications FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Notification Recipients policies
CREATE POLICY "Staff can view notification recipients in their organization"
  ON notification_recipients FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "System can manage notification recipients"
  ON notification_recipients FOR ALL
  USING (organization_id = get_user_organization_id());

-- App Notifications policies
CREATE POLICY "Users can view their own app notifications"
  ON app_notifications FOR SELECT
  USING (user_id = auth.uid() OR is_system_admin());

CREATE POLICY "Users can update their own app notifications"
  ON app_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Notification Preferences policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get recipients for a mass notification based on targeting
CREATE OR REPLACE FUNCTION get_notification_recipients(
  p_organization_id UUID,
  p_target_type TEXT,
  p_target_classroom_ids UUID[] DEFAULT NULL,
  p_target_family_ids UUID[] DEFAULT NULL,
  p_target_filters JSONB DEFAULT NULL
)
RETURNS TABLE (
  family_id UUID,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id as family_id,
    f.primary_contact_name as recipient_name,
    f.primary_contact_email as recipient_email,
    f.primary_contact_phone as recipient_phone
  FROM families f
  LEFT JOIN children c ON c.family_id = f.id
  WHERE f.organization_id = p_organization_id
    AND f.status = 'active'
    AND f.primary_contact_email IS NOT NULL
    AND (
      -- All families
      p_target_type = 'all'
      -- By classroom
      OR (p_target_type = 'classroom' AND c.classroom_id = ANY(p_target_classroom_ids))
      -- By specific families
      OR (p_target_type = 'family' AND f.id = ANY(p_target_family_ids))
      -- Custom filters could be added here
    );
END;
$$ LANGUAGE plpgsql;

-- Function to replace template variables
CREATE OR REPLACE FUNCTION replace_template_variables(
  p_template TEXT,
  p_family_id UUID,
  p_child_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT := p_template;
  v_family RECORD;
  v_child RECORD;
  v_org RECORD;
BEGIN
  -- Get family info
  SELECT * INTO v_family FROM families WHERE id = p_family_id;

  -- Get organization info
  SELECT * INTO v_org FROM organizations WHERE id = v_family.organization_id;

  -- Replace family variables
  v_result := REPLACE(v_result, '{{parent_name}}', COALESCE(v_family.primary_contact_name, ''));
  v_result := REPLACE(v_result, '{{family_name}}', COALESCE(v_family.primary_contact_name, ''));
  v_result := REPLACE(v_result, '{{family_email}}', COALESCE(v_family.primary_contact_email, ''));

  -- Replace organization variables
  v_result := REPLACE(v_result, '{{organization_name}}', COALESCE(v_org.name, ''));
  v_result := REPLACE(v_result, '{{organization_phone}}', COALESCE(v_org.phone, ''));
  v_result := REPLACE(v_result, '{{organization_email}}', COALESCE(v_org.email, ''));

  -- Get child info if provided
  IF p_child_id IS NOT NULL THEN
    SELECT * INTO v_child FROM children WHERE id = p_child_id;
    v_result := REPLACE(v_result, '{{child_name}}', COALESCE(v_child.first_name || ' ' || v_child.last_name, ''));
    v_result := REPLACE(v_result, '{{child_first_name}}', COALESCE(v_child.first_name, ''));
  END IF;

  -- Replace date variables
  v_result := REPLACE(v_result, '{{date}}', TO_CHAR(CURRENT_DATE, 'Month DD, YYYY'));
  v_result := REPLACE(v_result, '{{time}}', TO_CHAR(CURRENT_TIMESTAMP, 'HH:MI AM'));

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to send mass notification (creates recipient records)
CREATE OR REPLACE FUNCTION send_mass_notification(p_notification_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  recipients_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_notification RECORD;
  v_recipient RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Get notification
  SELECT * INTO v_notification FROM mass_notifications WHERE id = p_notification_id;

  IF v_notification IS NULL THEN
    success := false;
    recipients_count := 0;
    message := 'Notification not found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_notification.status NOT IN ('draft', 'scheduled') THEN
    success := false;
    recipients_count := 0;
    message := 'Notification already sent or cancelled';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Update status to sending
  UPDATE mass_notifications SET
    status = 'sending',
    started_at = NOW()
  WHERE id = p_notification_id;

  -- Create recipient records
  FOR v_recipient IN
    SELECT * FROM get_notification_recipients(
      v_notification.organization_id,
      v_notification.target_type,
      v_notification.target_classroom_ids,
      v_notification.target_family_ids,
      v_notification.target_filters
    )
  LOOP
    INSERT INTO notification_recipients (
      organization_id,
      notification_id,
      family_id,
      recipient_name,
      recipient_email,
      recipient_phone,
      personalized_subject,
      personalized_body,
      status
    ) VALUES (
      v_notification.organization_id,
      p_notification_id,
      v_recipient.family_id,
      v_recipient.recipient_name,
      v_recipient.recipient_email,
      v_recipient.recipient_phone,
      replace_template_variables(v_notification.subject, v_recipient.family_id),
      replace_template_variables(v_notification.body_text, v_recipient.family_id),
      'pending'
    );
    v_count := v_count + 1;
  END LOOP;

  -- Update notification with recipient count
  UPDATE mass_notifications SET
    total_recipients = v_count,
    status = CASE WHEN v_count > 0 THEN 'sending' ELSE 'failed' END,
    error_message = CASE WHEN v_count = 0 THEN 'No recipients found' ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_notification_id;

  success := v_count > 0;
  recipients_count := v_count;
  message := CASE WHEN v_count > 0 THEN 'Recipients created successfully' ELSE 'No recipients found' END;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE app_notifications SET
    is_read = true,
    read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create in-app notification for multiple users
CREATE OR REPLACE FUNCTION create_app_notifications(
  p_organization_id UUID,
  p_user_ids UUID[],
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_user_id IN ARRAY p_user_ids LOOP
    INSERT INTO app_notifications (
      organization_id,
      user_id,
      title,
      message,
      notification_type,
      action_url,
      source_type,
      source_id
    ) VALUES (
      p_organization_id,
      v_user_id,
      p_title,
      p_message,
      p_notification_type,
      p_action_url,
      p_source_type,
      p_source_id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Views
-- =====================================================

-- View: Recent notifications summary
CREATE OR REPLACE VIEW notification_summary AS
SELECT
  mn.id,
  mn.organization_id,
  mn.title,
  mn.notification_type,
  mn.priority,
  mn.target_type,
  mn.status,
  mn.total_recipients,
  mn.delivered_count,
  mn.opened_count,
  mn.failed_count,
  CASE
    WHEN mn.total_recipients > 0
    THEN (mn.delivered_count::DECIMAL / mn.total_recipients::DECIMAL) * 100
    ELSE 0
  END as delivery_rate,
  CASE
    WHEN mn.delivered_count > 0
    THEN (mn.opened_count::DECIMAL / mn.delivered_count::DECIMAL) * 100
    ELSE 0
  END as open_rate,
  mn.scheduled_at,
  mn.started_at,
  mn.completed_at,
  mn.created_at,
  p.first_name || ' ' || p.last_name as sent_by_name
FROM mass_notifications mn
LEFT JOIN profiles p ON mn.sent_by = p.id;

-- View: Unread notification count by user
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  user_id,
  COUNT(*) as unread_count,
  COUNT(*) FILTER (WHERE notification_type = 'warning' OR notification_type = 'error') as urgent_count,
  MAX(created_at) as latest_notification_at
FROM app_notifications
WHERE is_read = false
  AND is_archived = false
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_id;

COMMENT ON TABLE notification_templates IS 'Reusable notification templates with variable support';
COMMENT ON TABLE mass_notifications IS 'Mass notification campaigns with targeting and delivery tracking';
COMMENT ON TABLE notification_recipients IS 'Individual recipients of mass notifications';
COMMENT ON TABLE app_notifications IS 'In-app notifications shown in user dashboard';
COMMENT ON TABLE notification_preferences IS 'User notification channel and category preferences';
COMMENT ON FUNCTION send_mass_notification IS 'Creates recipient records for a mass notification';
COMMENT ON FUNCTION replace_template_variables IS 'Replaces template variables with actual values';
