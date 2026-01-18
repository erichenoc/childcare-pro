// =====================================================
// Super Admin Types
// =====================================================

export interface SystemAdmin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'support'
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminOrganizationView {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
  created_at: string
  owner_name: string
  owner_email: string
  total_children: number
  total_staff: number
  total_classrooms: number
  monthly_revenue: number
}

export interface AdminRevenueView {
  organization_id: string
  organization_name: string
  year: number
  month: number
  total_invoiced: number
  total_collected: number
  pending_amount: number
  collection_rate: number
}

export interface AdminDashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  totalRevenue: number
  monthlyRevenue: number
  totalLeads: number
  pendingLeads: number
  conversionRate: number
}
