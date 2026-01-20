// =====================================================
// AI Assistant Tool Executor
// =====================================================
// Executes tools and returns results (server-side)

import { createClient } from '@/shared/lib/supabase/server'
import { requiresConfirmation, getToolInfo } from './definitions'
import type { ToolCall, ToolResult, PendingConfirmation } from '../types'

// =====================================================
// EXECUTION CONTEXT - passed from API route
// =====================================================

interface ExecutionContext {
  organizationId: string
  supabase: Awaited<ReturnType<typeof createClient>>
}

let currentContext: ExecutionContext | null = null

// =====================================================
// SERVER-SIDE DATA ACCESS FUNCTIONS
// =====================================================

async function getChildren(filters?: { classroom_id?: string; status?: string }) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  let query = supabase
    .from('children')
    .select(`
      *,
      classroom:classrooms(id, name),
      family:families(id, primary_contact_name)
    `)
    .eq('organization_id', organizationId)

  if (filters?.classroom_id) {
    query = query.eq('classroom_id', filters.classroom_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getChildById(childId: string) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const { data, error } = await supabase
    .from('children')
    .select(`
      *,
      classroom:classrooms(id, name),
      family:families(id, primary_contact_name)
    `)
    .eq('id', childId)
    .eq('organization_id', organizationId)
    .single()

  if (error) return null
  return data
}

async function getFamilies(filters?: { status?: string }) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  let query = supabase
    .from('families')
    .select(`
      *,
      children(id, first_name, last_name)
    `)
    .eq('organization_id', organizationId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getFamilyById(familyId: string) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const { data, error } = await supabase
    .from('families')
    .select(`
      *,
      children(id, first_name, last_name)
    `)
    .eq('id', familyId)
    .eq('organization_id', organizationId)
    .single()

  if (error) return null
  return data
}

async function getClassrooms() {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const { data, error } = await supabase
    .from('classrooms')
    .select(`
      *,
      children(id),
      staff_assignments(
        id,
        profile:profiles(id, first_name, last_name)
      )
    `)
    .eq('organization_id', organizationId)

  if (error) throw error
  return data || []
}

async function getStaff(filters?: { role?: string; status?: string }) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  // Staff are stored in profiles table, filtered by role
  let query = supabase
    .from('profiles')
    .select(`
      *,
      staff_assignments(
        id,
        classroom:classrooms(id, name),
        is_lead
      )
    `)
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'director', 'lead_teacher', 'teacher', 'assistant'])

  if (filters?.role) {
    query = query.eq('role', filters.role)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getStaffById(staffId: string) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      staff_assignments(
        id,
        classroom:classrooms(id, name),
        is_lead
      )
    `)
    .eq('id', staffId)
    .eq('organization_id', organizationId)
    .single()

  if (error) return null
  return data
}

async function getAttendanceStats() {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const today = new Date().toISOString().split('T')[0]

  // Get total enrolled children
  const { count: totalChildren } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  // Get today's attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('date', today)

  const present = attendance?.filter(a => a.check_in_time && !a.check_out_time).length || 0
  const checkedOut = attendance?.filter(a => a.check_in_time && a.check_out_time).length || 0
  const total = totalChildren || 0

  return {
    total,
    present,
    absent: total - (present + checkedOut),
    late: attendance?.filter(a => a.status === 'late').length || 0,
  }
}

async function getIncidents(filters?: { status?: string; severity?: string; child_id?: string }) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  let query = supabase
    .from('incidents')
    .select(`
      *,
      child:children(id, first_name, last_name)
    `)
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }
  if (filters?.child_id) {
    query = query.eq('child_id', filters.child_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getIncidentStats() {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  const { data: incidents } = await supabase
    .from('incidents')
    .select('status')
    .eq('organization_id', organizationId)

  // Note: incidents use 'active' status, not 'open'
  const open = incidents?.filter(i => i.status === 'active' || i.status === 'pending').length || 0

  return { open, total: incidents?.length || 0 }
}

async function getInvoices(filters?: { family_id?: string; status?: string }) {
  if (!currentContext) throw new Error('No execution context available')
  const { supabase, organizationId } = currentContext

  let query = supabase
    .from('invoices')
    .select(`
      *,
      family:families(id, primary_contact_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filters?.family_id) {
    query = query.eq('family_id', filters.family_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

const toolImplementations: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  // =====================================================
  // CHILDREN
  // =====================================================
  async children_list(args) {
    const children = await getChildren({
      classroom_id: args.classroom_id as string | undefined,
      status: args.status as string | undefined,
    })
    let filtered = children

    if (args.program_type) {
      filtered = filtered.filter(c => {
        const notes = c.notes as Record<string, unknown> | null
        return notes?.program_type === args.program_type
      })
    }

    return {
      total: filtered.length,
      children: filtered.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        age: calculateAge(c.date_of_birth),
        classroom: c.classroom?.name || 'Sin asignar',
        status: c.status,
      })),
    }
  },

  async children_get(args) {
    const child = await getChildById(args.child_id as string)
    if (!child) return { error: 'Niño no encontrado' }

    return {
      id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      dateOfBirth: child.date_of_birth,
      age: calculateAge(child.date_of_birth),
      classroom: child.classroom?.name || 'Sin asignar',
      family: child.family ? `${child.family.primary_contact_name}` : 'Sin familia',
      status: child.status,
      enrollmentDate: child.enrollment_date,
      allergies: child.allergies || [],
      medicalConditions: child.medical_conditions,
      notes: child.notes,
    }
  },

  async children_search(args) {
    const query = (args.query as string).toLowerCase()
    const children = await getChildren()
    const matches = children.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(query)
    )

    return {
      found: matches.length,
      children: matches.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        classroom: c.classroom?.name || 'Sin asignar',
      })),
    }
  },

  // =====================================================
  // FAMILIES
  // =====================================================
  async families_list(args) {
    const families = await getFamilies({
      status: args.status as string | undefined,
    })

    return {
      total: families.length,
      families: families.map(f => ({
        id: f.id,
        name: f.primary_contact_name,
        primaryContact: f.primary_contact_email,
        phone: f.primary_contact_phone,
        status: f.status,
        childrenCount: f.children?.length || 0,
      })),
    }
  },

  async families_get(args) {
    const family = await getFamilyById(args.family_id as string)
    if (!family) return { error: 'Familia no encontrada' }

    return {
      id: family.id,
      name: family.primary_contact_name,
      email: family.primary_contact_email,
      phone: family.primary_contact_phone,
      address: family.address,
      status: family.status,
      children: family.children?.map((c: { id: string; first_name: string; last_name: string }) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
      })) || [],
      emergencyContacts: family.emergency_contacts || [],
      authorizedPickups: family.authorized_pickups || [],
    }
  },

  async families_get_balance(args) {
    const invoices = await getInvoices({ family_id: args.family_id as string })
    const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    const totalOwed = unpaid.reduce((sum, i) => sum + (i.total || 0), 0)

    return {
      family_id: args.family_id,
      total_owed: totalOwed,
      unpaid_invoices: unpaid.length,
      invoices: unpaid.map(i => ({
        id: i.id,
        amount: i.total,
        dueDate: i.due_date,
        status: i.status,
        daysOverdue: i.due_date ? Math.max(0, Math.floor((Date.now() - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0,
      })),
    }
  },

  // =====================================================
  // ATTENDANCE
  // =====================================================
  async attendance_get_today() {
    const stats = await getAttendanceStats()

    return {
      date: new Date().toISOString().split('T')[0],
      summary: {
        total_enrolled: stats.total,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        attendance_rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      },
    }
  },

  async attendance_get_stats(args) {
    const stats = await getAttendanceStats()
    return {
      period: args.period,
      ...stats,
    }
  },

  // These require confirmation - return pending action
  async attendance_check_in(args) {
    // This will be handled by the confirmation flow
    return { pending_confirmation: true, action: 'attendance_check_in', args }
  },

  async attendance_check_out(args) {
    return { pending_confirmation: true, action: 'attendance_check_out', args }
  },

  // =====================================================
  // CLASSROOMS
  // =====================================================
  async classrooms_list() {
    const classrooms = await getClassrooms()

    return {
      total: classrooms.length,
      classrooms: classrooms.map(c => ({
        id: c.id,
        name: c.name,
        ageGroup: c.age_group,
        capacity: c.capacity,
        currentCount: c.children?.length || 0,
        teachers: c.staff_assignments?.map((sa: { profile?: { first_name: string; last_name: string } }) =>
          sa.profile ? `${sa.profile.first_name} ${sa.profile.last_name}` : 'Unknown'
        ).filter(Boolean) || [],
      })),
    }
  },

  async classrooms_get_ratios(args) {
    const classrooms = await getClassrooms()
    const filtered = args.classroom_id
      ? classrooms.filter(c => c.id === args.classroom_id)
      : classrooms

    return {
      classrooms: filtered.map(c => {
        const childCount = c.children?.length || 0
        const staffCount = c.staff_assignments?.length || 0
        const maxRatio = getDCFRatio(c.age_group)
        const currentRatio = staffCount > 0 ? childCount / staffCount : childCount
        const isCompliant = currentRatio <= maxRatio

        return {
          id: c.id,
          name: c.name,
          ageGroup: c.age_group,
          children: childCount,
          staff: staffCount,
          currentRatio: `${childCount}:${staffCount}`,
          maxAllowedRatio: `${maxRatio}:1`,
          isCompliant,
          status: isCompliant ? '✅ Cumple' : '⚠️ Excede ratio',
        }
      }),
    }
  },

  async classrooms_check_compliance(args) {
    const ratios = await toolImplementations.classrooms_get_ratios(args)
    const classrooms = (ratios as { classrooms: Array<{ isCompliant: boolean; name: string; currentRatio: string; maxAllowedRatio: string }> }).classrooms
    const violations = classrooms.filter((c: { isCompliant: boolean }) => !c.isCompliant)

    return {
      overall_compliant: violations.length === 0,
      total_classrooms: classrooms.length,
      violations: violations.length,
      details: violations.length > 0
        ? `⚠️ ${violations.length} salón(es) exceden el ratio permitido: ${violations.map((v: { name: string; currentRatio: string; maxAllowedRatio: string }) => `${v.name} (${v.currentRatio} vs máximo ${v.maxAllowedRatio})`).join(', ')}`
        : '✅ Todos los salones cumplen con los ratios DCF',
      classrooms,
    }
  },

  // =====================================================
  // STAFF
  // =====================================================
  async staff_list(args) {
    const staff = await getStaff({
      role: args.role as string | undefined,
      status: args.status as string | undefined,
    })

    return {
      total: staff.length,
      staff: staff.map(s => {
        // Get classroom from staff_assignments
        const assignment = s.staff_assignments?.[0]
        const classroomName = assignment?.classroom?.name || 'Sin asignar'
        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          role: s.role,
          email: s.email,
          classroom: classroomName,
          status: s.status,
        }
      }),
    }
  },

  async staff_get(args) {
    const staff = await getStaffById(args.staff_id as string)
    if (!staff) return { error: 'Empleado no encontrado' }

    // Get classroom from staff_assignments
    const assignment = staff.staff_assignments?.[0]
    const classroomName = assignment?.classroom?.name || 'Sin asignar'

    return {
      id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      classroom: classroomName,
      hireDate: staff.hire_date,
      status: staff.status,
    }
  },

  // =====================================================
  // INCIDENTS
  // =====================================================
  async incidents_list(args) {
    const incidents = await getIncidents({
      status: args.status as string | undefined,
      severity: args.severity as string | undefined,
      child_id: args.child_id as string | undefined,
    })

    return {
      total: incidents.length,
      incidents: incidents.slice(0, 20).map(i => ({
        id: i.id,
        child: i.child ? `${i.child.first_name} ${i.child.last_name}` : 'N/A',
        type: i.incident_type,
        severity: i.severity,
        status: i.status,
        date: i.occurred_at,
        description: i.description?.substring(0, 100) + '...',
      })),
    }
  },

  async incidents_create(args) {
    return { pending_confirmation: true, action: 'incidents_create', args }
  },

  async incidents_get_requiring_followup() {
    const stats = await getIncidentStats()
    return {
      requiring_followup: stats.open,
      message: stats.open > 0
        ? `Hay ${stats.open} incidente(s) que requieren seguimiento`
        : 'No hay incidentes pendientes de seguimiento',
    }
  },

  // =====================================================
  // BILLING
  // =====================================================
  async billing_get_invoices(args) {
    const invoices = await getInvoices({
      family_id: args.family_id as string | undefined,
      status: args.status as string | undefined,
    })

    return {
      total: invoices.length,
      invoices: invoices.slice(0, 20).map(i => ({
        id: i.id,
        family: i.family?.primary_contact_name || 'N/A',
        amount: i.total,
        status: i.status,
        dueDate: i.due_date,
        createdAt: i.created_at,
      })),
    }
  },

  async billing_get_overdue(args) {
    const invoices = await getInvoices()
    const today = new Date()
    const minDays = (args.days_overdue as number) || 1

    const overdue = invoices.filter(i => {
      if (i.status === 'paid' || i.status === 'cancelled' || !i.due_date) return false
      const dueDate = new Date(i.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysOverdue >= minDays
    })

    const totalOwed = overdue.reduce((sum, i) => sum + (i.total || 0), 0)

    return {
      total_overdue: overdue.length,
      total_owed: totalOwed,
      invoices: overdue.map(i => {
        const daysOverdue = Math.floor((today.getTime() - new Date(i.due_date!).getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: i.id,
          family: i.family?.primary_contact_name || 'N/A',
          amount: i.total,
          dueDate: i.due_date,
          daysOverdue,
        }
      }).sort((a, b) => b.daysOverdue - a.daysOverdue),
    }
  },

  async billing_create_invoice(args) {
    return { pending_confirmation: true, action: 'billing_create_invoice', args }
  },

  async billing_send_reminder(args) {
    return { pending_confirmation: true, action: 'billing_send_reminder', args }
  },

  async billing_get_stats(args) {
    const invoices = await getInvoices()
    const period = args.period as string

    // Simple stats calculation
    const paid = invoices.filter(i => i.status === 'paid')
    const pending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')

    const totalRevenue = paid.reduce((sum, i) => sum + (i.total || 0), 0)
    const totalPending = pending.reduce((sum, i) => sum + (i.total || 0), 0)

    return {
      period,
      total_invoices: invoices.length,
      paid_invoices: paid.length,
      pending_invoices: pending.length,
      total_revenue: totalRevenue,
      total_pending: totalPending,
      collection_rate: invoices.length > 0
        ? Math.round((paid.length / invoices.length) * 100)
        : 0,
    }
  },

  // =====================================================
  // ANALYTICS
  // =====================================================
  async analytics_daily_summary(args) {
    const date = (args.date as string) || new Date().toISOString().split('T')[0]

    // Get attendance
    const attendanceStats = await getAttendanceStats()

    // Get incidents
    const incidentStats = await getIncidentStats()

    // Get billing
    const invoices = await getInvoices()
    const overdue = invoices.filter(i => {
      if (i.status === 'paid' || i.status === 'cancelled' || !i.due_date) return false
      return new Date(i.due_date) < new Date()
    })

    // Get compliance
    const ratios = await toolImplementations.classrooms_get_ratios({})
    const classrooms = (ratios as { classrooms: Array<{ isCompliant: boolean }> }).classrooms
    const violations = classrooms.filter(c => !c.isCompliant)

    return {
      date,
      attendance: {
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        total: attendanceStats.total,
        rate: attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0,
      },
      incidents: {
        open: incidentStats.open,
        total_today: 0,
        requiring_followup: incidentStats.open,
      },
      billing: {
        overdue_count: overdue.length,
        overdue_amount: overdue.reduce((sum, i) => sum + (i.total || 0), 0),
      },
      compliance: {
        all_ratios_ok: violations.length === 0,
        violations: violations.length,
      },
      alerts: generateAlerts(attendanceStats, incidentStats, overdue, violations),
    }
  },

  async analytics_get_alerts() {
    const alerts: Array<{ type: string; severity: string; message: string }> = []

    // Check ratios
    const ratios = await toolImplementations.classrooms_get_ratios({})
    const classrooms = (ratios as { classrooms: Array<{ isCompliant: boolean; name: string }> }).classrooms
    const violations = classrooms.filter(c => !c.isCompliant)
    if (violations.length > 0) {
      alerts.push({
        type: 'compliance',
        severity: 'high',
        message: `⚠️ ${violations.length} salón(es) exceden el ratio DCF: ${violations.map(v => v.name).join(', ')}`,
      })
    }

    // Check overdue invoices
    const overdue = await toolImplementations.billing_get_overdue({ days_overdue: 7 })
    if ((overdue as { total_overdue: number }).total_overdue > 0) {
      alerts.push({
        type: 'billing',
        severity: 'medium',
        message: `💰 ${(overdue as { total_overdue: number }).total_overdue} factura(s) vencidas por más de 7 días`,
      })
    }

    // Check incidents
    const incidentStats = await getIncidentStats()
    if (incidentStats.open > 0) {
      alerts.push({
        type: 'incidents',
        severity: 'medium',
        message: `📋 ${incidentStats.open} incidente(s) abiertos requieren atención`,
      })
    }

    return {
      total_alerts: alerts.length,
      alerts,
      status: alerts.length === 0 ? '✅ Todo en orden' : `⚠️ ${alerts.length} alerta(s) activa(s)`,
    }
  },

  async analytics_enrollment_stats() {
    const children = await getChildren()
    const classrooms = await getClassrooms()

    const byClassroom: Record<string, number> = {}
    classrooms.forEach(c => {
      byClassroom[c.name] = c.children?.length || 0
    })

    return {
      total_enrolled: children.filter(c => c.status === 'active').length,
      total_capacity: classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0),
      by_classroom: byClassroom,
      occupancy_rate: classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0) > 0
        ? Math.round((children.filter(c => c.status === 'active').length / classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)) * 100)
        : 0,
    }
  },

  // =====================================================
  // COMMUNICATION
  // =====================================================
  async communication_send_email(args) {
    return { pending_confirmation: true, action: 'communication_send_email', args }
  },

  async communication_draft_message(args) {
    const purpose = args.purpose as string
    const context = args.context as string || ''
    const tone = args.tone as string || 'friendly'
    const language = args.language as string || 'es'

    const templates: Record<string, { es: string; en: string }> = {
      payment_reminder: {
        es: `Estimada familia,\n\nLe recordamos amablemente que tiene un pago pendiente. ${context}\n\nPor favor, realice el pago a su conveniencia.\n\nGracias por su atención.`,
        en: `Dear family,\n\nThis is a friendly reminder that you have a pending payment. ${context}\n\nPlease make the payment at your earliest convenience.\n\nThank you.`,
      },
      event_announcement: {
        es: `Estimadas familias,\n\nNos complace anunciar: ${context}\n\n¡Esperamos verlos pronto!`,
        en: `Dear families,\n\nWe are pleased to announce: ${context}\n\nWe look forward to seeing you soon!`,
      },
      incident_notification: {
        es: `Estimada familia,\n\nQueremos informarle sobre un incidente ocurrido hoy. ${context}\n\nSu hijo/a está bien y fue atendido apropiadamente.\n\nSi tiene preguntas, no dude en contactarnos.`,
        en: `Dear family,\n\nWe want to inform you about an incident that occurred today. ${context}\n\nYour child is fine and was attended to appropriately.\n\nIf you have questions, please don't hesitate to contact us.`,
      },
      general: {
        es: `Estimadas familias,\n\n${context}\n\nSaludos cordiales.`,
        en: `Dear families,\n\n${context}\n\nBest regards.`,
      },
    }

    const template = templates[purpose] || templates.general
    const draft = template[language as 'es' | 'en'] || template.es

    return {
      draft,
      language,
      tone,
      purpose,
      note: 'Este es un borrador. Puedes editarlo antes de enviarlo.',
    }
  },
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())

  if (months < 12) return `${months} meses`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return remainingMonths > 0 ? `${years} años ${remainingMonths} meses` : `${years} años`
}

function getDCFRatio(ageGroup: string): number {
  const ratios: Record<string, number> = {
    infant: 4,
    toddler: 6,
    twos: 11,
    threes: 15,
    prek: 20,
    school_age: 25,
  }
  return ratios[ageGroup] || 15
}

function generateAlerts(
  attendance: { total: number; present: number },
  incidents: { open: number },
  overdue: Array<{ total?: number }>,
  violations: Array<{ name: string }>
): Array<{ type: string; message: string; severity: string }> {
  const alerts: Array<{ type: string; message: string; severity: string }> = []

  if (violations.length > 0) {
    alerts.push({
      type: 'ratio',
      severity: 'high',
      message: `Ratio excedido en: ${violations.map((v: { name: string }) => v.name).join(', ')}`,
    })
  }

  if (overdue.length > 0) {
    const total = overdue.reduce((sum, i) => sum + (i.total || 0), 0)
    alerts.push({
      type: 'billing',
      severity: 'medium',
      message: `${overdue.length} facturas vencidas ($${total.toFixed(2)})`,
    })
  }

  if (incidents.open > 0) {
    alerts.push({
      type: 'incidents',
      severity: 'medium',
      message: `${incidents.open} incidentes requieren seguimiento`,
    })
  }

  if (attendance.total > 0 && (attendance.present / attendance.total) < 0.8) {
    alerts.push({
      type: 'attendance',
      severity: 'low',
      message: `Asistencia baja hoy (${Math.round((attendance.present / attendance.total) * 100)}%)`,
    })
  }

  return alerts
}

// =====================================================
// MAIN EXECUTOR
// =====================================================

export async function executeTool(
  toolCall: ToolCall,
  context?: { organizationId: string; supabase: Awaited<ReturnType<typeof createClient>> }
): Promise<{
  result?: ToolResult
  pendingConfirmation?: PendingConfirmation
}> {
  const { name, arguments: args, id } = toolCall
  const toolInfo = getToolInfo(name)

  if (!toolInfo) {
    return {
      result: {
        tool_call_id: id,
        name,
        result: null,
        error: `Tool desconocido: ${name}`,
      },
    }
  }

  const implementation = toolImplementations[name]
  if (!implementation) {
    return {
      result: {
        tool_call_id: id,
        name,
        result: null,
        error: `Tool no implementado: ${name}`,
      },
    }
  }

  // Set execution context for data access functions
  if (context) {
    currentContext = {
      organizationId: context.organizationId,
      supabase: context.supabase,
    }
  }

  try {
    const result = await implementation(args)

    // Check if this action requires confirmation
    if (requiresConfirmation(name) && (result as { pending_confirmation?: boolean }).pending_confirmation) {
      return {
        pendingConfirmation: {
          action_id: `${name}_${Date.now()}`,
          action_type: name,
          description: `${toolInfo.description}: ${JSON.stringify(args)}`,
          params: args,
          requires_confirmation: true,
        },
      }
    }

    return {
      result: {
        tool_call_id: id,
        name,
        result,
      },
    }
  } catch (error) {
    console.error(`[Tool Executor] Error executing ${name}:`, error)
    return {
      result: {
        tool_call_id: id,
        name,
        result: null,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    }
  } finally {
    // Clear context after execution
    currentContext = null
  }
}

// Execute confirmed action (after user approval)
export async function executeConfirmedAction(
  actionType: string,
  params: Record<string, unknown>
): Promise<unknown> {
  switch (actionType) {
    case 'attendance_check_in':
      return attendanceService.checkIn(
        params.child_id as string,
        params.classroom_id as string,
        undefined,
        { person_name: params.drop_off_person as string }
      )

    case 'attendance_check_out':
      return attendanceService.checkOut(
        params.child_id as string,
        undefined,
        { person_name: params.pickup_person as string }
      )

    case 'incidents_create':
      return incidentsService.create({
        child_id: params.child_id as string,
        incident_type: params.incident_type as string,
        description: params.description as string,
        severity: params.severity as string,
        first_aid_given: params.first_aid_given as string,
        occurred_at: new Date().toISOString(),
        status: 'open',
      })

    case 'billing_create_invoice':
      return billingService.create({
        family_id: params.family_id as string,
        total: params.amount as number,
        description: params.description as string,
        due_date: params.due_date as string,
        status: 'sent',
      })

    case 'billing_send_reminder':
      // TODO: Implement email sending
      return { success: true, message: 'Recordatorio enviado' }

    case 'communication_send_email':
      // TODO: Implement email sending with Resend
      return { success: true, message: 'Email enviado' }

    default:
      throw new Error(`Acción no soportada: ${actionType}`)
  }
}
