-- ============================================
-- CHILDCARE PRO - SCHEMA COMPLETO
-- Sistema SaaS Multi-Tenant para Guarderías
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda fuzzy

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('owner', 'director', 'lead_teacher', 'teacher', 'assistant', 'parent');

-- Estados generales
CREATE TYPE status_type AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Estados de asistencia
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'early_pickup', 'sick');

-- Estados de factura
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled');

-- Tipos de incidente
CREATE TYPE incident_type AS ENUM ('injury', 'illness', 'behavioral', 'accident', 'other');

-- Severidad de incidente
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Tipo de mensaje
CREATE TYPE message_type AS ENUM ('direct', 'announcement', 'alert', 'report');

-- ============================================
-- TABLA: ORGANIZATIONS (Tenants)
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  license_number VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50) DEFAULT 'FL',
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status status_type DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- TABLA: PROFILES (Usuarios del sistema)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role user_role DEFAULT 'teacher',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  hire_date DATE,
  certifications JSONB DEFAULT '[]',
  status status_type DEFAULT 'active',
  preferences JSONB DEFAULT '{"language": "es", "notifications": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- TABLA: CLASSROOMS (Salones/Aulas)
-- ============================================

CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(50), -- 'infants', 'toddlers', 'twos', 'threes', 'fours', 'school_age'
  min_age_months INTEGER DEFAULT 0,
  max_age_months INTEGER DEFAULT 60,
  capacity INTEGER NOT NULL DEFAULT 10,
  dcf_ratio INTEGER NOT NULL DEFAULT 4, -- Required staff:children ratio
  color VARCHAR(7) DEFAULT '#3B82F6', -- Color del salón para UI
  description TEXT,
  status status_type DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classrooms_organization ON classrooms(organization_id);

-- ============================================
-- TABLA: FAMILIES (Familias)
-- ============================================

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  family_code VARCHAR(20) UNIQUE,
  primary_contact_name VARCHAR(200) NOT NULL,
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(20),
  secondary_contact_name VARCHAR(200),
  secondary_contact_email VARCHAR(255),
  secondary_contact_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50) DEFAULT 'FL',
  zip_code VARCHAR(20),
  emergency_contacts JSONB DEFAULT '[]',
  authorized_pickups JSONB DEFAULT '[]',
  notes TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  status status_type DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_families_organization ON families(organization_id);
CREATE INDEX idx_families_code ON families(family_code);

-- ============================================
-- TABLA: CHILDREN (Niños)
-- ============================================

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  photo_url TEXT,
  allergies JSONB DEFAULT '[]',
  medical_conditions JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  dietary_restrictions JSONB DEFAULT '[]',
  special_needs TEXT,
  doctor_name VARCHAR(200),
  doctor_phone VARCHAR(20),
  insurance_info JSONB DEFAULT '{}',
  enrollment_date DATE DEFAULT CURRENT_DATE,
  schedule JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true}',
  status status_type DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_children_organization ON children(organization_id);
CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_children_classroom ON children(classroom_id);
CREATE INDEX idx_children_status ON children(status);

-- ============================================
-- TABLA: STAFF_ASSIGNMENTS (Asignaciones de personal)
-- ============================================

CREATE TABLE staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  schedule JSONB DEFAULT '{}',
  status status_type DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_assignments_profile ON staff_assignments(profile_id);
CREATE INDEX idx_staff_assignments_classroom ON staff_assignments(classroom_id);

-- ============================================
-- TABLA: ATTENDANCE (Asistencia)
-- ============================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  checked_out_by UUID REFERENCES profiles(id),
  status attendance_status DEFAULT 'absent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, date)
);

CREATE INDEX idx_attendance_organization ON attendance(organization_id);
CREATE INDEX idx_attendance_child ON attendance(child_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_classroom ON attendance(classroom_id);

-- ============================================
-- TABLA: STAFF_ATTENDANCE (Asistencia de personal)
-- ============================================

CREATE TABLE staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  status attendance_status DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

CREATE INDEX idx_staff_attendance_profile ON staff_attendance(profile_id);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);

-- ============================================
-- TABLA: INVOICES (Facturas)
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  status invoice_status DEFAULT 'pending',
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  stripe_invoice_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_family ON invoices(family_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- TABLA: PAYMENTS (Pagos)
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50), -- 'card', 'cash', 'check', 'transfer'
  reference_number VARCHAR(100),
  stripe_payment_id VARCHAR(255),
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_family ON payments(family_id);

-- ============================================
-- TABLA: INCIDENTS (Incidentes)
-- ============================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id),
  reported_by UUID REFERENCES profiles(id),
  incident_type incident_type NOT NULL,
  severity incident_severity DEFAULT 'low',
  occurred_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(200),
  description TEXT NOT NULL,
  action_taken TEXT,
  witnesses JSONB DEFAULT '[]',
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  parent_signature TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  attachments JSONB DEFAULT '[]',
  status status_type DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_child ON incidents(child_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_date ON incidents(occurred_at);

-- ============================================
-- TABLA: MESSAGES (Mensajes/Comunicación)
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id), -- NULL si es announcement
  family_id UUID REFERENCES families(id),
  child_id UUID REFERENCES children(id),
  message_type message_type DEFAULT 'direct',
  subject VARCHAR(255),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_organization ON messages(organization_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_family ON messages(family_id);

-- ============================================
-- TABLA: DAILY_REPORTS (Reportes diarios)
-- ============================================

CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  meals JSONB DEFAULT '{"breakfast": null, "lunch": null, "snacks": []}',
  naps JSONB DEFAULT '[]',
  diaper_changes JSONB DEFAULT '[]',
  activities JSONB DEFAULT '[]',
  mood VARCHAR(50),
  notes TEXT,
  photos JSONB DEFAULT '[]',
  sent_to_parents BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, date)
);

CREATE INDEX idx_daily_reports_child ON daily_reports(child_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);

-- ============================================
-- TABLA: ACTIVITY_LOG (Auditoría)
-- ============================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_organization ON activity_log(organization_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para calcular edad en meses
CREATE OR REPLACE FUNCTION calculate_age_months(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date)) * 12 +
         EXTRACT(MONTH FROM age(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el ratio actual de un salón
CREATE OR REPLACE FUNCTION get_classroom_ratio(p_classroom_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(children_count INTEGER, staff_count INTEGER, current_ratio DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH present_children AS (
    SELECT COUNT(*) as cnt
    FROM attendance a
    JOIN children c ON c.id = a.child_id
    WHERE a.classroom_id = p_classroom_id
    AND a.date = p_date
    AND a.status = 'present'
  ),
  present_staff AS (
    SELECT COUNT(*) as cnt
    FROM staff_attendance sa
    JOIN staff_assignments assign ON assign.profile_id = sa.profile_id
    WHERE assign.classroom_id = p_classroom_id
    AND sa.date = p_date
    AND sa.status = 'present'
  )
  SELECT
    pc.cnt::INTEGER,
    ps.cnt::INTEGER,
    CASE WHEN ps.cnt > 0 THEN ROUND(pc.cnt::DECIMAL / ps.cnt, 1) ELSE 0 END
  FROM present_children pc, present_staff ps;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener organization_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Políticas para Profiles
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id = get_user_organization_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Políticas para Classrooms
CREATE POLICY "Users can view classrooms in their organization"
  ON classrooms FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage classrooms"
  ON classrooms FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'director')
    )
  );

-- Políticas para Families
CREATE POLICY "Users can view families in their organization"
  ON families FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage families"
  ON families FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'director', 'lead_teacher')
    )
  );

-- Políticas para Children
CREATE POLICY "Users can view children in their organization"
  ON children FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage children"
  ON children FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'director', 'lead_teacher', 'teacher')
    )
  );

-- Políticas para Attendance
CREATE POLICY "Users can view attendance in their organization"
  ON attendance FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage attendance"
  ON attendance FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role NOT IN ('parent')
    )
  );

-- Políticas para Invoices
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage invoices"
  ON invoices FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'director')
    )
  );

-- Políticas para Messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    organization_id = get_user_organization_id() AND
    (sender_id = auth.uid() OR recipient_id = auth.uid() OR message_type = 'announcement')
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    sender_id = auth.uid()
  );

-- Políticas para Incidents
CREATE POLICY "Users can view incidents in their organization"
  ON incidents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage incidents"
  ON incidents FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role NOT IN ('parent')
    )
  );

-- Políticas para Daily Reports
CREATE POLICY "Users can view daily reports in their organization"
  ON daily_reports FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage daily reports"
  ON daily_reports FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role NOT IN ('parent')
    )
  );

-- ============================================
-- DATOS INICIALES (Seed Data)
-- ============================================

-- Crear organización demo
INSERT INTO organizations (id, name, slug, license_number, address, city, state, zip_code, phone, email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Sunshine Kids Daycare',
  'sunshine-kids',
  'FL-DCF-2024-001234',
  '123 Palm Street',
  'Miami',
  'FL',
  '33101',
  '(305) 555-0100',
  'info@sunshinekids.com'
);

-- Crear salones demo
INSERT INTO classrooms (id, organization_id, name, age_group, min_age_months, max_age_months, capacity, dcf_ratio, color) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sala Bebés', 'infants', 0, 12, 8, 4, '#EC4899'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sala Mariposas', 'toddlers', 12, 24, 12, 6, '#8B5CF6'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sala Estrellas', 'twos', 24, 36, 15, 11, '#3B82F6'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sala Exploradores', 'threes', 36, 48, 20, 15, '#10B981');

COMMIT;
