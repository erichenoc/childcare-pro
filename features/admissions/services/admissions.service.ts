import { createClient } from '@/shared/lib/supabase/client'
import type {
  AdmissionInquiry,
  AdmissionInquiryFormData,
  AdmissionTour,
  AdmissionTourFormData,
  WaitlistEntry,
  WaitlistEntryFormData,
  EnrollmentApplication,
  EnrollmentApplicationFormData,
  AdmissionCommunication,
  AdmissionCommunicationFormData,
  InquiryStatus,
  TourStatus,
  PipelineStats,
} from '@/shared/types/admissions'

// ==================== Inquiries ====================

export async function getInquiries(status?: InquiryStatus): Promise<AdmissionInquiry[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('admission_inquiries')
    .select(`
      *,
      assigned_staff:staff!admission_inquiries_assigned_to_fkey(id, first_name, last_name),
      requested_classroom:classrooms(id, name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getInquiryById(id: string): Promise<AdmissionInquiry | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admission_inquiries')
    .select(`
      *,
      assigned_staff:staff!admission_inquiries_assigned_to_fkey(id, first_name, last_name),
      requested_classroom:classrooms(id, name),
      tours:admission_tours(
        *,
        tour_guide:staff(id, first_name, last_name)
      ),
      waitlist_entry:waitlist_entries(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createInquiry(formData: AdmissionInquiryFormData): Promise<AdmissionInquiry> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('admission_inquiries')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      status: 'new',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateInquiry(id: string, formData: Partial<AdmissionInquiryFormData>): Promise<AdmissionInquiry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admission_inquiries')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<AdmissionInquiry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admission_inquiries')
    .update({
      status,
      last_contacted_at: ['contacted', 'tour_scheduled', 'application_sent', 'offered'].includes(status)
        ? new Date().toISOString()
        : undefined,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteInquiry(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('admission_inquiries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Tours ====================

export async function getTours(status?: TourStatus): Promise<AdmissionTour[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('admission_tours')
    .select(`
      *,
      inquiry:admission_inquiries(
        id, parent_first_name, parent_last_name, child_first_name, child_last_name, email, phone
      ),
      tour_guide:staff(id, first_name, last_name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getUpcomingTours(): Promise<AdmissionTour[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('admission_tours')
    .select(`
      *,
      inquiry:admission_inquiries(
        id, parent_first_name, parent_last_name, child_first_name, child_last_name, email, phone
      ),
      tour_guide:staff(id, first_name, last_name)
    `)
    .eq('organization_id', staff.organization_id)
    .gte('scheduled_date', today)
    .in('status', ['scheduled', 'confirmed'])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(10)

  if (error) throw error
  return data || []
}

export async function createTour(formData: AdmissionTourFormData): Promise<AdmissionTour> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('admission_tours')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) throw error

  // Update inquiry status
  await updateInquiryStatus(formData.inquiry_id, 'tour_scheduled')

  return data
}

export async function updateTourStatus(id: string, status: TourStatus, notes?: string): Promise<AdmissionTour> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    if (notes) updateData.post_tour_notes = notes
  }

  const { data, error } = await supabase
    .from('admission_tours')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Update inquiry status if tour completed
  if (status === 'completed' && data.inquiry_id) {
    await updateInquiryStatus(data.inquiry_id, 'tour_completed')
  }

  return data
}

// ==================== Waitlist ====================

export async function getWaitlist(activeOnly = true): Promise<WaitlistEntry[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('waitlist_entries')
    .select(`
      *,
      inquiry:admission_inquiries(
        id, parent_first_name, parent_last_name, child_first_name, child_last_name,
        child_date_of_birth, email, phone
      ),
      requested_classroom:classrooms(id, name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('position', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function addToWaitlist(formData: WaitlistEntryFormData): Promise<WaitlistEntry> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  // Get next position
  const { data: positionData } = await supabase
    .rpc('get_next_waitlist_position', {
      p_organization_id: staff.organization_id,
      p_classroom_id: formData.requested_classroom_id || null,
    })

  const { data, error } = await supabase
    .from('waitlist_entries')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      position: positionData || 1,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error

  // Update inquiry status
  await updateInquiryStatus(formData.inquiry_id, 'waitlisted')

  return data
}

export async function updateWaitlistPriority(id: string, priority: string, reason?: string): Promise<WaitlistEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('waitlist_entries')
    .update({
      priority,
      priority_reason: reason,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function offerSpot(id: string, expiresInDays = 7): Promise<WaitlistEntry> {
  const supabase = createClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { data, error } = await supabase
    .from('waitlist_entries')
    .update({
      offered_spot_at: new Date().toISOString(),
      offer_expires_at: expiresAt.toISOString(),
    })
    .eq('id', id)
    .select(`*, inquiry:admission_inquiries(id)`)
    .single()

  if (error) throw error

  // Update inquiry status
  if (data.inquiry?.id) {
    await updateInquiryStatus(data.inquiry.id, 'offered')
  }

  return data
}

export async function removeFromWaitlist(id: string, reason?: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('waitlist_entries')
    .update({
      is_active: false,
      offer_response: reason || 'removed',
    })
    .eq('id', id)

  if (error) throw error
}

// ==================== Applications ====================

export async function getApplications(status?: string): Promise<EnrollmentApplication[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('enrollment_applications')
    .select(`
      *,
      inquiry:admission_inquiries(
        id, parent_first_name, parent_last_name, child_first_name, child_last_name, email
      ),
      reviewer:staff(id, first_name, last_name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getApplicationById(id: string): Promise<EnrollmentApplication | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollment_applications')
    .select(`
      *,
      inquiry:admission_inquiries(*),
      reviewer:staff(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createApplication(formData: EnrollmentApplicationFormData): Promise<EnrollmentApplication> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  // Generate application number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('enrollment_applications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', staff.organization_id)

  const appNumber = `APP-${year}-${String((count || 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('enrollment_applications')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      application_number: appNumber,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function submitApplication(id: string): Promise<EnrollmentApplication> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('enrollment_applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`*, inquiry:admission_inquiries(id)`)
    .single()

  if (error) throw error

  // Update inquiry status
  if (data.inquiry?.id) {
    await updateInquiryStatus(data.inquiry.id, 'application_received')
  }

  return data
}

export async function reviewApplication(id: string, approved: boolean, notes?: string, startDate?: string): Promise<EnrollmentApplication> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('enrollment_applications')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      approved_start_date: approved ? startDate : null,
    })
    .eq('id', id)
    .select(`*, inquiry:admission_inquiries(id)`)
    .single()

  if (error) throw error

  // Update inquiry status
  if (data.inquiry?.id && approved) {
    await updateInquiryStatus(data.inquiry.id, 'accepted')
  }

  return data
}

// ==================== Communications ====================

export async function getCommunications(inquiryId: string): Promise<AdmissionCommunication[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('admission_communications')
    .select(`
      *,
      staff:staff(id, first_name, last_name)
    `)
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function logCommunication(formData: AdmissionCommunicationFormData): Promise<AdmissionCommunication> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('admission_communications')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      staff_id: staff.id,
    })
    .select()
    .single()

  if (error) throw error

  // Update last_contacted_at on inquiry if outbound
  if (formData.direction === 'outbound') {
    await supabase
      .from('admission_inquiries')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', formData.inquiry_id)
  }

  return data
}

// ==================== Stats ====================

export async function getPipelineStats(): Promise<PipelineStats[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .rpc('get_admission_pipeline_stats', { p_organization_id: staff.organization_id })

  if (error) throw error
  return data || []
}

// Export service object
export const admissionsService = {
  // Inquiries
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  updateInquiryStatus,
  deleteInquiry,
  // Tours
  getTours,
  getUpcomingTours,
  createTour,
  updateTourStatus,
  // Waitlist
  getWaitlist,
  addToWaitlist,
  updateWaitlistPriority,
  offerSpot,
  removeFromWaitlist,
  // Applications
  getApplications,
  getApplicationById,
  createApplication,
  submitApplication,
  reviewApplication,
  // Communications
  getCommunications,
  logCommunication,
  // Stats
  getPipelineStats,
}
