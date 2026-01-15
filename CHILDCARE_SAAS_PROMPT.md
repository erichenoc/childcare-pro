# 🏫 ChildCare SaaS - Complete Development Prompt for Claude Code

## Project Overview

You are building a multi-tenant SaaS platform for Child Care centers. This is a comprehensive childcare management system that handles enrollment, attendance, billing, parent communication, compliance tracking, and more.

**Target Market:** Child Care centers in Florida, USA (with expansion capability)
**Initial Client:** 2 locations, ~100 children total
**Business Model:** SaaS with tiered pricing (Starter, Professional, Enterprise)

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | Latest |
| UI Components | shadcn/ui | Latest |
| Styling | Tailwind CSS | 3.x |
| Payments | Stripe | Latest |
| Email | Resend | Latest |
| SMS | Twilio | Latest |
| File Storage | Supabase Storage | Latest |
| Forms | React Hook Form + Zod | Latest |
| State Management | Zustand | Latest |
| Tables | TanStack Table | Latest |
| Date Handling | date-fns | Latest |
| Hosting | Vercel | Latest |

---

## Core Requirements

### Multi-Tenant Architecture
- Each organization (Child Care center) is completely isolated
- Organizations can have multiple locations/branches
- White-label support (custom domains, logos, colors)
- Row Level Security (RLS) on all tables
- Subscription-based access control

### User Roles & Permissions
1. **Platform Level:**
   - `superadmin` - Platform administrators (us)
   - `user` - Regular users

2. **Organization Level:**
   - `owner` - Full access, billing management
   - `admin` - Full access except billing
   - `director` - Location management, staff, children
   - `teacher` - Classroom management, daily reports
   - `assistant` - Limited access, attendance
   - `staff` - Basic access only

3. **Parent Portal:**
   - Guardians with linked user accounts
   - Access only to their children's data

---

## Database Schema

### Core Multi-Tenant Tables

```sql
-- Organizations (The Child Care businesses using the SaaS)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#4F46E5',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    subscription_tier VARCHAR(20) DEFAULT 'starter',
    subscription_status VARCHAR(20) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    currency VARCHAR(3) DEFAULT 'USD',
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    max_children INT DEFAULT 30,
    max_staff INT DEFAULT 5,
    max_locations INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations/Branches
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    license_expiry DATE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50) DEFAULT 'FL',
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    phone VARCHAR(20),
    email VARCHAR(255),
    opening_time TIME DEFAULT '06:30',
    closing_time TIME DEFAULT '18:30',
    capacity INT DEFAULT 50,
    dcf_provider_id VARCHAR(50),
    gold_seal_status BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms/Rooms
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(50),
    min_age_months INT,
    max_age_months INT,
    capacity INT NOT NULL,
    required_ratio_children INT,
    required_ratio_staff INT,
    color VARCHAR(7) DEFAULT '#4F46E5',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Users & Staff Management

```sql
-- Users (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    platform_role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '{
        "children": {"view": true, "create": false, "edit": false, "delete": false},
        "staff": {"view": false, "create": false, "edit": false, "delete": false},
        "billing": {"view": false, "create": false, "edit": false, "delete": false},
        "reports": {"view": true, "create": false, "export": false},
        "settings": {"view": false, "edit": false}
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Staff Profiles
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    hire_date DATE,
    termination_date DATE,
    employment_type VARCHAR(20),
    hourly_rate DECIMAL(10,2),
    salary DECIMAL(10,2),
    dcf_training_date DATE,
    dcf_training_expiry DATE,
    cpr_certification_date DATE,
    cpr_expiry DATE,
    first_aid_date DATE,
    first_aid_expiry DATE,
    background_check_date DATE,
    background_check_expiry DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Location Assignments
CREATE TABLE staff_location_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_profile_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Classroom Assignments
CREATE TABLE staff_classroom_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_profile_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    is_lead_teacher BOOLEAN DEFAULT FALSE,
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Children & Families

```sql
-- Families
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    family_name VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    billing_email VARCHAR(255),
    auto_pay_enabled BOOLEAN DEFAULT FALSE,
    stripe_customer_id VARCHAR(255),
    default_payment_method_id VARCHAR(255),
    receives_subsidy BOOLEAN DEFAULT FALSE,
    subsidy_type VARCHAR(50),
    subsidy_case_number VARCHAR(100),
    subsidy_start_date DATE,
    subsidy_end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardians/Parents
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    email VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    phone_work VARCHAR(20),
    employer_name VARCHAR(255),
    employer_phone VARCHAR(20),
    employer_address TEXT,
    can_pickup BOOLEAN DEFAULT TRUE,
    is_emergency_contact BOOLEAN DEFAULT TRUE,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_billing_contact BOOLEAN DEFAULT FALSE,
    receives_communications BOOLEAN DEFAULT TRUE,
    has_portal_access BOOLEAN DEFAULT FALSE,
    portal_pin VARCHAR(10),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    photo_url TEXT,
    enrollment_status VARCHAR(20) DEFAULT 'active',
    enrollment_date DATE,
    expected_start_date DATE,
    actual_start_date DATE,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    schedule_type VARCHAR(20),
    scheduled_days JSONB DEFAULT '[]'::jsonb,
    programs JSONB DEFAULT '[]'::jsonb,
    vpk_certificate_number VARCHAR(100),
    primary_physician VARCHAR(255),
    physician_phone VARCHAR(20),
    medical_conditions TEXT,
    allergies JSONB DEFAULT '[]'::jsonb,
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    special_needs TEXT,
    custody_notes TEXT,
    court_order_on_file BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authorized Pickups
CREATE TABLE authorized_pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    photo_url TEXT,
    id_on_file BOOLEAN DEFAULT FALSE,
    is_temporary BOOLEAN DEFAULT FALSE,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Immunizations
CREATE TABLE child_immunizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(100) NOT NULL,
    dose_number INT DEFAULT 1,
    date_administered DATE,
    expiry_date DATE,
    administered_by VARCHAR(255),
    lot_number VARCHAR(100),
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Documents
CREATE TABLE child_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    document_type VARCHAR(50),
    name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Attendance System

```sql
-- Daily Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ,
    check_in_by UUID REFERENCES users(id),
    check_in_guardian_id UUID REFERENCES guardians(id),
    check_in_method VARCHAR(20),
    check_in_signature TEXT,
    check_in_photo_url TEXT,
    check_in_temperature DECIMAL(4,1),
    check_in_health_screening JSONB,
    check_out_time TIMESTAMPTZ,
    check_out_by UUID REFERENCES users(id),
    check_out_guardian_id UUID REFERENCES guardians(id),
    check_out_authorized_pickup_id UUID REFERENCES authorized_pickups(id),
    check_out_method VARCHAR(20),
    check_out_signature TEXT,
    status VARCHAR(20) DEFAULT 'expected',
    absence_reason VARCHAR(100),
    absence_notes TEXT,
    is_billable BOOLEAN DEFAULT TRUE,
    billable_hours DECIMAL(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, date)
);

-- Staff Time Entries
CREATE TABLE staff_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_profile_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time Ratio Tracking
CREATE TABLE classroom_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    children_count INT NOT NULL,
    staff_count INT NOT NULL,
    current_ratio DECIMAL(4,2),
    required_ratio DECIMAL(4,2),
    is_compliant BOOLEAN,
    children_ids UUID[] DEFAULT '{}',
    staff_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Billing & Payments

```sql
-- Tuition Plans
CREATE TABLE tuition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    billing_frequency VARCHAR(20),
    base_rate DECIMAL(10,2) NOT NULL,
    infant_rate DECIMAL(10,2),
    toddler_rate DECIMAL(10,2),
    preschool_rate DECIMAL(10,2),
    schoolage_rate DECIMAL(10,2),
    full_time_rate DECIMAL(10,2),
    part_time_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    registration_fee DECIMAL(10,2) DEFAULT 0,
    supply_fee DECIMAL(10,2) DEFAULT 0,
    activity_fee DECIMAL(10,2) DEFAULT 0,
    late_pickup_fee_per_minute DECIMAL(5,2) DEFAULT 1.00,
    late_pickup_grace_minutes INT DEFAULT 10,
    late_payment_fee DECIMAL(10,2) DEFAULT 25.00,
    late_payment_fee_type VARCHAR(20) DEFAULT 'flat',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Tuition Assignment
CREATE TABLE child_tuition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    tuition_plan_id UUID REFERENCES tuition_plans(id) ON DELETE SET NULL,
    custom_rate DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_reason VARCHAR(255),
    subsidy_amount DECIMAL(10,2) DEFAULT 0,
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    subsidy_amount DECIMAL(10,2) DEFAULT 0,
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    stripe_invoice_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    item_type VARCHAR(50),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    check_number VARCHAR(50),
    check_date DATE,
    subsidy_reference VARCHAR(100),
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Payment Methods
CREATE TABLE family_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(20),
    card_brand VARCHAR(20),
    card_last4 VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    bank_name VARCHAR(255),
    bank_last4 VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Communication Hub

```sql
-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    recipient_guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    recipient_classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    recipient_location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'message',
    priority VARCHAR(20) DEFAULT 'normal',
    attachments JSONB DEFAULT '[]'::jsonb,
    send_push BOOLEAN DEFAULT TRUE,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Recipients
CREATE TABLE message_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Reports
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activities JSONB DEFAULT '[]'::jsonb,
    meals JSONB DEFAULT '[]'::jsonb,
    naps JSONB DEFAULT '[]'::jsonb,
    bathroom_entries JSONB DEFAULT '[]'::jsonb,
    mood VARCHAR(20),
    mood_notes TEXT,
    learning_activities TEXT,
    milestones TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    sent_to_parents BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, report_date)
);

-- Child Photos
CREATE TABLE child_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    daily_report_id UUID REFERENCES daily_reports(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id),
    is_visible_to_parents BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Compliance, Health & Incidents

```sql
-- Incident Reports
CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT NOT NULL,
    location_description VARCHAR(255),
    injury_type VARCHAR(100),
    body_part_affected VARCHAR(100),
    first_aid_given BOOLEAN DEFAULT FALSE,
    first_aid_description TEXT,
    medical_attention_required BOOLEAN DEFAULT FALSE,
    emergency_services_called BOOLEAN DEFAULT FALSE,
    witnesses JSONB DEFAULT '[]'::jsonb,
    staff_present UUID[],
    reported_by UUID REFERENCES users(id),
    parent_notified BOOLEAN DEFAULT FALSE,
    parent_notified_at TIMESTAMPTZ,
    parent_notified_by UUID REFERENCES users(id),
    parent_notified_method VARCHAR(20),
    staff_signature TEXT,
    parent_signature TEXT,
    parent_signed_at TIMESTAMPTZ,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_completed_at TIMESTAMPTZ,
    photos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Screenings
CREATE TABLE health_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    screening_date DATE DEFAULT CURRENT_DATE,
    screening_time TIMESTAMPTZ DEFAULT NOW(),
    temperature DECIMAL(4,1),
    temperature_unit VARCHAR(1) DEFAULT 'F',
    symptoms JSONB DEFAULT '{
        "fever": false,
        "cough": false,
        "runny_nose": false,
        "sore_throat": false,
        "headache": false,
        "vomiting": false,
        "diarrhea": false,
        "rash": false,
        "eye_discharge": false,
        "unusual_fatigue": false
    }'::jsonb,
    passed_screening BOOLEAN DEFAULT TRUE,
    notes TEXT,
    screened_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Administration Log
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    scheduled_time TIME,
    administered_time TIMESTAMPTZ,
    administered_by UUID REFERENCES users(id),
    witnessed_by UUID REFERENCES users(id),
    notes TEXT,
    parent_authorization_on_file BOOLEAN DEFAULT TRUE,
    authorization_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Meals & CACFP Tracking

```sql
-- Meal Plans
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    meals JSONB DEFAULT '{
        "monday": {"breakfast": null, "am_snack": null, "lunch": null, "pm_snack": null},
        "tuesday": {"breakfast": null, "am_snack": null, "lunch": null, "pm_snack": null},
        "wednesday": {"breakfast": null, "am_snack": null, "lunch": null, "pm_snack": null},
        "thursday": {"breakfast": null, "am_snack": null, "lunch": null, "pm_snack": null},
        "friday": {"breakfast": null, "am_snack": null, "lunch": null, "pm_snack": null}
    }'::jsonb,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CACFP Meal Records
CREATE TABLE cacfp_meal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    free_count INT DEFAULT 0,
    reduced_count INT DEFAULT 0,
    paid_count INT DEFAULT 0,
    total_served INT DEFAULT 0,
    menu_items JSONB DEFAULT '[]'::jsonb,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, meal_date, meal_type)
);

-- Child Meal Records
CREATE TABLE child_meal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    daily_report_id UUID REFERENCES daily_reports(id) ON DELETE SET NULL,
    meal_date DATE DEFAULT CURRENT_DATE,
    meal_type VARCHAR(20) NOT NULL,
    meal_time TIMESTAMPTZ,
    menu_items JSONB DEFAULT '[]'::jsonb,
    amount_eaten VARCHAR(20),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Education & Development

```sql
-- Lesson Plans
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    theme VARCHAR(255),
    objectives JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '{
        "monday": [],
        "tuesday": [],
        "wednesday": [],
        "thursday": [],
        "friday": []
    }'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    standards JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developmental Domains
CREATE TABLE developmental_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developmental Milestones
CREATE TABLE developmental_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES developmental_domains(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_range_start_months INT,
    age_range_end_months INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Assessments
CREATE TABLE child_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    assessment_period VARCHAR(20),
    scores JSONB DEFAULT '{}'::jsonb,
    observations TEXT,
    goals JSONB DEFAULT '[]'::jsonb,
    assessed_by UUID REFERENCES users(id),
    shared_with_parents BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    parent_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Items
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    item_date DATE DEFAULT CURRENT_DATE,
    title VARCHAR(255),
    description TEXT,
    item_type VARCHAR(50),
    file_url TEXT,
    thumbnail_url TEXT,
    domain_id UUID REFERENCES developmental_domains(id),
    milestone_id UUID REFERENCES developmental_milestones(id),
    visible_to_parents BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### SaaS Platform Administration

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    max_children INT,
    max_staff INT,
    max_locations INT,
    features JSONB DEFAULT '{
        "parent_portal": true,
        "auto_billing": false,
        "ratio_tracking": false,
        "dcf_reports": false,
        "curriculum": false,
        "cacfp": false,
        "api_access": false,
        "white_label": false,
        "priority_support": false
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    enabled_for_tiers TEXT[] DEFAULT '{}',
    enabled_for_organizations UUID[] DEFAULT '{}',
    percentage_rollout INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Announcements
CREATE TABLE platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    announcement_type VARCHAR(20) DEFAULT 'info',
    target_tiers TEXT[] DEFAULT '{}',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_dismissible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
-- Enable RLS on ALL other tables

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is guardian
CREATE OR REPLACE FUNCTION is_guardian_of_family(family_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM guardians 
        WHERE family_id = family_uuid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policy
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (id = ANY(get_user_organization_ids()));

CREATE POLICY "Owners can update their organizations" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Children Policy (Staff)
CREATE POLICY "Staff can view children in their org" ON children
    FOR SELECT USING (organization_id = ANY(get_user_organization_ids()));

-- Children Policy (Parents)
CREATE POLICY "Guardians can view their children" ON children
    FOR SELECT USING (is_guardian_of_family(family_id));

-- Attendance Policy
CREATE POLICY "Staff can manage attendance in their org" ON attendance_records
    FOR ALL USING (
        location_id IN (
            SELECT l.id FROM locations l 
            WHERE l.organization_id = ANY(get_user_organization_ids())
        )
    );

-- Create similar policies for ALL tables following this pattern
```

---

## Application Structure

### Directory Structure

```
childcare-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── children/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── [id]/attendance/page.tsx
│   │   │   ├── [id]/billing/page.tsx
│   │   │   ├── [id]/documents/page.tsx
│   │   │   ├── [id]/health/page.tsx
│   │   │   ├── [id]/portfolio/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── families/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── staff/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   ├── time-clock/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── classrooms/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── ratios/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── attendance/
│   │   │   ├── page.tsx
│   │   │   ├── check-in/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   ├── invoices/[id]/page.tsx
│   │   │   ├── invoices/new/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── tuition-plans/page.tsx
│   │   │   └── subsidies/page.tsx
│   │   ├── communication/
│   │   │   ├── page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   └── daily-reports/page.tsx
│   │   ├── meals/
│   │   │   ├── page.tsx
│   │   │   ├── menu-planning/page.tsx
│   │   │   └── cacfp/page.tsx
│   │   ├── curriculum/
│   │   │   ├── page.tsx
│   │   │   ├── lesson-plans/page.tsx
│   │   │   └── assessments/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── financial/page.tsx
│   │   │   ├── compliance/page.tsx
│   │   │   └── dcf/page.tsx
│   │   ├── incidents/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── organization/page.tsx
│   │       ├── locations/page.tsx
│   │       ├── users/page.tsx
│   │       ├── billing/page.tsx
│   │       └── integrations/page.tsx
│   │
│   ├── (parent-portal)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── children/page.tsx
│   │   ├── children/[id]/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── documents/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── (kiosk)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [locationId]/page.tsx
│   │
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── features/page.tsx
│   │   ├── demo/page.tsx
│   │   └── contact/page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── v1/
│   │   │   ├── organizations/route.ts
│   │   │   ├── locations/route.ts
│   │   │   ├── children/route.ts
│   │   │   ├── families/route.ts
│   │   │   ├── staff/route.ts
│   │   │   ├── attendance/route.ts
│   │   │   ├── billing/route.ts
│   │   │   ├── messages/route.ts
│   │   │   └── reports/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── twilio/route.ts
│   │   └── cron/
│   │       ├── generate-invoices/route.ts
│   │       ├── send-reminders/route.ts
│   │       └── ratio-alerts/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav-item.tsx
│   │   └── user-menu.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── activity-feed.tsx
│   │   └── quick-actions.tsx
│   ├── children/
│   │   ├── child-card.tsx
│   │   ├── child-form.tsx
│   │   ├── child-profile.tsx
│   │   └── enrollment-wizard.tsx
│   ├── attendance/
│   │   ├── check-in-form.tsx
│   │   ├── attendance-table.tsx
│   │   ├── ratio-indicator.tsx
│   │   └── kiosk-interface.tsx
│   ├── billing/
│   │   ├── invoice-card.tsx
│   │   ├── payment-form.tsx
│   │   └── tuition-plan-form.tsx
│   ├── communication/
│   │   ├── message-composer.tsx
│   │   ├── daily-report-form.tsx
│   │   └── notification-bell.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── file-upload.tsx
│       ├── search-input.tsx
│       ├── date-picker.tsx
│       └── loading-spinner.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middleware.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── date.ts
│   │   ├── currency.ts
│   │   └── ratios.ts
│   ├── validations/
│   │   ├── child.ts
│   │   ├── family.ts
│   │   ├── staff.ts
│   │   └── billing.ts
│   └── constants/
│       ├── roles.ts
│       ├── age-groups.ts
│       └── florida-ratios.ts
│
├── hooks/
│   ├── use-organization.ts
│   ├── use-location.ts
│   ├── use-children.ts
│   ├── use-attendance.ts
│   ├── use-staff.ts
│   ├── use-billing.ts
│   ├── use-realtime.ts
│   └── use-permissions.ts
│
├── types/
│   ├── database.ts (generated from Supabase)
│   ├── index.ts
│   └── api.ts
│
├── stores/
│   ├── organization-store.ts
│   ├── location-store.ts
│   └── user-store.ts
│
├── middleware.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Feature Implementation Guidelines

### Authentication Flow
1. Use Supabase Auth with email/password
2. Implement Magic Link option for parents
3. Support OAuth (Google) for staff
4. Multi-factor authentication for admins
5. Session management with refresh tokens
6. Password reset flow with email

### Multi-Tenant Routing
1. Use middleware to detect organization from:
   - Subdomain (org-slug.yourdomain.com)
   - Custom domain (mapped in organizations table)
   - URL path (/app/[org-slug]/...)
2. Set organization context in middleware
3. All API routes must validate organization access

### Real-time Features (Supabase Realtime)
1. Attendance updates (check-in/check-out)
2. Ratio alerts when compliance is at risk
3. New messages/notifications
4. Daily report updates

### File Storage (Supabase Storage)
1. Organize by: /organizations/{org_id}/...
2. Buckets:
   - `avatars` - User and child photos
   - `documents` - Child documents, immunization records
   - `photos` - Daily report photos
   - `signatures` - Digital signatures
3. Implement signed URLs for secure access
4. Set up storage policies matching RLS

### Cron Jobs (Vercel Cron)
1. Daily: Generate attendance records for enrolled children
2. Weekly: Generate invoices for auto-billing families
3. Daily: Send payment reminders for overdue invoices
4. Hourly: Check for certification expirations (staff)
5. Daily: Check immunization expiry dates

### API Design
1. RESTful endpoints under /api/v1/
2. Use Next.js API routes with proper error handling
3. Implement rate limiting
4. Return consistent response format:
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

## Florida DCF Compliance Requirements

### Child-to-Staff Ratios (Must be enforced in real-time)
| Age Group | Ratio | Max Group Size |
|-----------|-------|----------------|
| Infants (0-12 months) | 4:1 | 8 |
| 1 year olds | 6:1 | 12 |
| 2 year olds | 11:1 | 22 |
| 3 year olds | 15:1 | 30 |
| 4-5 year olds | 20:1 | 40 |
| School-age (5+) | 25:1 | 50 |

### Required Documents per Child
- Birth certificate
- Immunization record (Form 680)
- Physical examination (within 30 days of enrollment)
- Emergency contact information
- Authorized pickup list with photos
- Custody documentation (if applicable)
- Special health care needs plan (if applicable)

### Staff Requirements
- Background screening (Level 2)
- DCF 40-hour training (within 90 days)
- CPR/First Aid certification
- Annual in-service training (10 hours)

---

## Pricing Tiers Configuration

### Starter - $149/month per location
- Up to 30 children
- Up to 5 staff users
- Basic parent portal
- Check-in/Check-out
- Basic billing (manual invoices)
- Messaging
- Basic reports

### Professional - $299/month per location
- Up to 75 children
- Up to 15 staff users
- Everything in Starter, plus:
- Auto-billing with Stripe/ACH
- Real-time ratio tracking
- DCF compliance reports
- Immunization tracking
- Curriculum & lesson planning
- CACFP meal tracking
- SMS notifications
- API access (read-only)

### Enterprise - $499/month per location
- Unlimited children
- Unlimited staff
- Everything in Professional, plus:
- White-label (custom domain, branding)
- Multi-location dashboard
- Custom reports
- Full API access
- Priority support
- Custom integrations
- Dedicated account manager

### Add-ons
- Additional children beyond limit: +$3/child/month
- Transportation module: +$99/month
- Unlimited SMS: +$49/month
- White-label for lower tiers: +$199/month

---

## Development Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Configure Supabase project
- [ ] Create database migrations for core tables
- [ ] Implement authentication (login, register, password reset)
- [ ] Build multi-tenant middleware
- [ ] Create organization and location management
- [ ] Set up user roles and permissions system
- [ ] Build basic dashboard layout

### Phase 2: Core Modules (Weeks 5-8)
- [ ] Children management (CRUD, profiles, enrollment)
- [ ] Family and guardian management
- [ ] Staff management and profiles
- [ ] Classroom management
- [ ] Document upload and management
- [ ] Basic search and filtering

### Phase 3: Attendance (Weeks 9-10)
- [ ] Daily attendance views
- [ ] Check-in/Check-out functionality
- [ ] Kiosk mode for tablets
- [ ] Digital signatures
- [ ] Real-time ratio tracking
- [ ] Attendance reports

### Phase 4: Billing (Weeks 11-13)
- [ ] Tuition plan configuration
- [ ] Invoice generation (manual and auto)
- [ ] Stripe integration for payments
- [ ] ACH payment support
- [ ] Payment tracking and history
- [ ] Late fee calculations
- [ ] Subsidy tracking
- [ ] Financial reports

### Phase 5: Communication (Weeks 14-15)
- [ ] Messaging system (staff to parents)
- [ ] Daily reports with photos
- [ ] Announcements
- [ ] Push notifications (OneSignal)
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)

### Phase 6: Parent Portal (Weeks 16-17)
- [ ] Parent dashboard
- [ ] Child activity view
- [ ] Photo gallery
- [ ] Online bill pay
- [ ] Document upload
- [ ] Messaging with teachers
- [ ] PWA mobile configuration

### Phase 7: Compliance (Weeks 18-19)
- [ ] Immunization tracking with expiry alerts
- [ ] Incident report management
- [ ] Health screening forms
- [ ] Medication administration log
- [ ] DCF report generation
- [ ] Staff certification tracking
- [ ] Ratio compliance monitoring

### Phase 8: Education (Weeks 20-21)
- [ ] Curriculum management
- [ ] Lesson plan creation
- [ ] Developmental milestones
- [ ] Child assessments
- [ ] Portfolio management
- [ ] Standards alignment (Florida)

### Phase 9: Meals (Week 22)
- [ ] Menu planning
- [ ] CACFP meal tracking
- [ ] Allergy alerts
- [ ] Meal count reports

### Phase 10: SaaS Features (Weeks 23-24)
- [ ] White-label configuration
- [ ] Subscription management
- [ ] Usage analytics
- [ ] Custom domain setup
- [ ] Landing page
- [ ] Onboarding wizard
- [ ] Help documentation

### Phase 11: Polish & Launch (Weeks 25-26)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Training materials
- [ ] Production deployment

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (Email)
RESEND_API_KEY=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Push Notifications
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=ChildCare Pro

# Vercel Cron Secret
CRON_SECRET=
```

---

## Important Notes

1. **Security First**: Always validate user permissions before any database operation
2. **Multi-tenant Isolation**: Never leak data between organizations
3. **Audit Everything**: Log all sensitive operations (billing, attendance, incidents)
4. **Mobile First**: Design all interfaces to work on tablets and phones
5. **Offline Capability**: Consider PWA for parent portal
6. **Performance**: Use pagination, caching, and optimistic updates
7. **Accessibility**: Follow WCAG 2.1 AA guidelines
8. **Compliance**: Always enforce Florida DCF ratios in real-time
9. **Error Handling**: Implement comprehensive error handling with user-friendly messages
10. **Testing**: Write tests for critical paths (billing, attendance, authentication)

---

## Commands to Start

```bash
# Create Next.js project
npx create-next-app@latest childcare-saas --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js resend twilio zustand @tanstack/react-table react-hook-form @hookform/resolvers zod date-fns lucide-react

# Install shadcn/ui
npx shadcn-ui@latest init

# Add shadcn components
npx shadcn-ui@latest add button card input label select textarea dialog dropdown-menu table tabs avatar badge calendar checkbox form popover separator sheet skeleton toast tooltip

# Start development
npm run dev
```

---

**Begin development following the phases outlined above. Start with Phase 1: Foundation.**
