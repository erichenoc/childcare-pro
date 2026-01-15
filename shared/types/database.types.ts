export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          checked_in_by: string | null
          checked_out_by: string | null
          child_id: string
          classroom_id: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["attendance_status"] | null
          updated_at: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          child_id: string
          classroom_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          updated_at?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          child_id?: string
          classroom_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      children: {
        Row: {
          allergies: Json | null
          classroom_id: string | null
          created_at: string | null
          date_of_birth: string
          dietary_restrictions: Json | null
          doctor_name: string | null
          doctor_phone: string | null
          enrollment_date: string | null
          family_id: string
          first_name: string
          gender: string | null
          id: string
          insurance_info: Json | null
          last_name: string
          medical_conditions: Json | null
          medications: Json | null
          notes: string | null
          organization_id: string
          photo_url: string | null
          schedule: Json | null
          special_needs: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          updated_at: string | null
        }
        Insert: {
          allergies?: Json | null
          classroom_id?: string | null
          created_at?: string | null
          date_of_birth: string
          dietary_restrictions?: Json | null
          doctor_name?: string | null
          doctor_phone?: string | null
          enrollment_date?: string | null
          family_id: string
          first_name: string
          gender?: string | null
          id?: string
          insurance_info?: Json | null
          last_name: string
          medical_conditions?: Json | null
          medications?: Json | null
          notes?: string | null
          organization_id: string
          photo_url?: string | null
          schedule?: Json | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Update: {
          allergies?: Json | null
          classroom_id?: string | null
          created_at?: string | null
          date_of_birth?: string
          dietary_restrictions?: Json | null
          doctor_name?: string | null
          doctor_phone?: string | null
          enrollment_date?: string | null
          family_id?: string
          first_name?: string
          gender?: string | null
          id?: string
          insurance_info?: Json | null
          last_name?: string
          medical_conditions?: Json | null
          medications?: Json | null
          notes?: string | null
          organization_id?: string
          photo_url?: string | null
          schedule?: Json | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          age_group: string | null
          capacity: number
          color: string | null
          created_at: string | null
          dcf_ratio: number
          description: string | null
          id: string
          max_age_months: number | null
          min_age_months: number | null
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["status_type"] | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          capacity?: number
          color?: string | null
          created_at?: string | null
          dcf_ratio?: number
          description?: string | null
          id?: string
          max_age_months?: number | null
          min_age_months?: number | null
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          capacity?: number
          color?: string | null
          created_at?: string | null
          dcf_ratio?: number
          description?: string | null
          id?: string
          max_age_months?: number | null
          min_age_months?: number | null
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          address: string | null
          authorized_pickups: Json | null
          balance: number | null
          city: string | null
          created_at: string | null
          emergency_contacts: Json | null
          family_code: string | null
          id: string
          notes: string | null
          organization_id: string
          primary_contact_email: string | null
          primary_contact_name: string
          primary_contact_phone: string | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          stripe_customer_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          authorized_pickups?: Json | null
          balance?: number | null
          city?: string | null
          created_at?: string | null
          emergency_contacts?: Json | null
          family_code?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          primary_contact_email?: string | null
          primary_contact_name: string
          primary_contact_phone?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          authorized_pickups?: Json | null
          balance?: number | null
          city?: string | null
          created_at?: string | null
          emergency_contacts?: Json | null
          family_code?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          primary_contact_email?: string | null
          primary_contact_name?: string
          primary_contact_phone?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          action_taken: string | null
          attachments: Json | null
          child_id: string
          classroom_id: string | null
          created_at: string | null
          description: string
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          location: string | null
          occurred_at: string
          organization_id: string
          parent_notified: boolean | null
          parent_notified_at: string | null
          parent_signature: string | null
          reported_by: string | null
          severity: Database["public"]["Enums"]["incident_severity"] | null
          status: Database["public"]["Enums"]["status_type"] | null
          updated_at: string | null
          witnesses: Json | null
        }
        Insert: {
          action_taken?: string | null
          attachments?: Json | null
          child_id: string
          classroom_id?: string | null
          created_at?: string | null
          description: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          location?: string | null
          occurred_at: string
          organization_id: string
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          parent_signature?: string | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
          witnesses?: Json | null
        }
        Update: {
          action_taken?: string | null
          attachments?: Json | null
          child_id?: string
          classroom_id?: string | null
          created_at?: string | null
          description?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          location?: string | null
          occurred_at?: string
          organization_id?: string
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          parent_signature?: string | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
          witnesses?: Json | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance: number | null
          created_at: string | null
          discount: number | null
          due_date: string
          family_id: string
          id: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"] | null
          stripe_invoice_id: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance?: number | null
          created_at?: string | null
          discount?: number | null
          due_date: string
          family_id: string
          id?: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          stripe_invoice_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance?: number | null
          created_at?: string | null
          discount?: number | null
          due_date?: string
          family_id?: string
          id?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          stripe_invoice_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          child_id: string | null
          content: string
          created_at: string | null
          family_id: string | null
          id: string
          is_read: boolean | null
          is_urgent: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          organization_id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachments?: Json | null
          child_id?: string | null
          content: string
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          organization_id: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachments?: Json | null
          child_id?: string | null
          content?: string
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          organization_id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          state: string | null
          stripe_customer_id: string | null
          subscription_plan: string | null
          subscription_status: Database["public"]["Enums"]["status_type"] | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          family_id: string
          id: string
          invoice_id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          reference_number: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          family_id: string
          id?: string
          invoice_id: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          reference_number?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          family_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          reference_number?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          certifications: Json | null
          created_at: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          organization_id: string | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["status_type"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          certifications?: Json | null
          created_at?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          hire_date?: string | null
          id: string
          last_name: string
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          certifications?: Json | null
          created_at?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["status_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          classroom_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_lead: boolean | null
          organization_id: string
          profile_id: string
          schedule: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_lead?: boolean | null
          organization_id: string
          profile_id: string
          schedule?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_lead?: boolean | null
          organization_id?: string
          profile_id?: string
          schedule?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          organization_id: string
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"] | null
        }
        Insert: {
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id: string
          profile_id: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
        }
        Update: {
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          activities: Json | null
          child_id: string
          classroom_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          diaper_changes: Json | null
          id: string
          meals: Json | null
          mood: string | null
          naps: Json | null
          notes: string | null
          organization_id: string
          photos: Json | null
          sent_at: string | null
          sent_to_parents: boolean | null
          updated_at: string | null
        }
        Insert: {
          activities?: Json | null
          child_id: string
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          diaper_changes?: Json | null
          id?: string
          meals?: Json | null
          mood?: string | null
          naps?: Json | null
          notes?: string | null
          organization_id: string
          photos?: Json | null
          sent_at?: string | null
          sent_to_parents?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activities?: Json | null
          child_id?: string
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          diaper_changes?: Json | null
          id?: string
          meals?: Json | null
          mood?: string | null
          naps?: Json | null
          notes?: string | null
          organization_id?: string
          photos?: Json | null
          sent_at?: string | null
          sent_to_parents?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age_months: { Args: { birth_date: string }; Returns: number }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "early_pickup" | "sick"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_type: "injury" | "illness" | "behavioral" | "accident" | "other"
      invoice_status: "draft" | "pending" | "paid" | "partial" | "overdue" | "cancelled"
      message_type: "direct" | "announcement" | "alert" | "report"
      status_type: "active" | "inactive" | "pending" | "suspended"
      user_role: "owner" | "director" | "lead_teacher" | "teacher" | "assistant" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Alias types for easier use
export type Organization = Tables<'organizations'>
export type Profile = Tables<'profiles'>
export type Classroom = Tables<'classrooms'>
export type Family = Tables<'families'>
export type Child = Tables<'children'>
export type Attendance = Tables<'attendance'>
export type StaffAttendance = Tables<'staff_attendance'>
export type StaffAssignment = Tables<'staff_assignments'>
export type Invoice = Tables<'invoices'>
export type Payment = Tables<'payments'>
export type Incident = Tables<'incidents'>
export type Message = Tables<'messages'>
export type DailyReport = Tables<'daily_reports'>
export type ActivityLog = Tables<'activity_log'>

// Enum types
export type UserRole = Enums<'user_role'>
export type StatusType = Enums<'status_type'>
export type AttendanceStatus = Enums<'attendance_status'>
export type InvoiceStatus = Enums<'invoice_status'>
export type IncidentType = Enums<'incident_type'>
export type IncidentSeverity = Enums<'incident_severity'>
export type MessageType = Enums<'message_type'>

// Extended types with relations
export type ChildWithFamily = Child & {
  family: Family
  classroom: Classroom | null
}

export type FamilyWithChildren = Family & {
  children: Child[]
}

export type InvoiceWithFamily = Invoice & {
  family: Family
}

export type AttendanceWithChild = Attendance & {
  child: Child
  classroom: Classroom | null
}
