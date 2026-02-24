// =====================================================
// WHATSAPP DATA SERVICE
// Aggregate data for WhatsApp responses
// =====================================================

import { createClient } from '@/shared/lib/supabase/server'
import type {
  ChildSummaryResponse,
  InvoicesResponse,
  PhotosResponse,
  PublicInfoResponse,
} from '../types/whatsapp.types'

interface DataResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Helper para formatear fecha
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Helper para calcular edad
function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())

  if (months < 12) {
    return `${months} meses`
  }
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} año${years > 1 ? 's' : ''}`
  }
  return `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`
}

export const whatsappDataService = {
  /**
   * Obtener resumen diario de un niño
   */
  async getChildSummary(
    organizationId: string,
    childId: string,
    date?: string
  ): Promise<DataResult<ChildSummaryResponse>> {
    const supabase = await createClient()
    const targetDate = date || formatDate(new Date())

    try {
      // 1. Obtener informacion del niño
      const { data: child, error: childError } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          classroom_id,
          classrooms (
            id,
            name
          )
        `)
        .eq('id', childId)
        .eq('organization_id', organizationId)
        .single()

      if (childError || !child) {
        return { success: false, error: 'Child not found' }
      }

      // 2. Obtener registro de asistencia del dia
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)
        .single()

      // 3. Obtener comidas del dia
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)
        .order('time', { ascending: true })

      // 4. Obtener siesta del dia
      const { data: nap } = await supabase
        .from('naps')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)
        .single()

      // 5. Obtener estado de animo
      const { data: mood } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // 6. Obtener actividades del dia
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)
        .order('time', { ascending: true })

      // 7. Obtener incidentes del dia
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('child_id', childId)
        .eq('date', targetDate)

      // 8. Contar fotos del dia
      const { count: photosCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', childId)
        .gte('taken_at', `${targetDate}T00:00:00`)
        .lt('taken_at', `${targetDate}T23:59:59`)

      const classroom = child.classrooms as unknown as { id: string; name: string } | null

      const summary: ChildSummaryResponse = {
        child: {
          id: child.id,
          name: `${child.first_name} ${child.last_name}`,
          classroom: classroom?.name || 'Sin asignar',
          age: child.date_of_birth ? calculateAge(child.date_of_birth) : 'No registrada',
        },
        date: targetDate,
        attendance: {
          status: attendance?.status || 'absent',
          check_in_time: attendance?.check_in_time || null,
          check_out_time: attendance?.check_out_time || null,
          drop_off_person: attendance?.drop_off_person || null,
          pickup_person: attendance?.pickup_person || null,
        },
        meals: (meals || []).map((meal) => ({
          type: meal.meal_type,
          time: meal.time,
          amount: meal.amount_eaten || 'No registrado',
          notes: meal.notes,
        })),
        nap: nap
          ? {
              start_time: nap.start_time,
              end_time: nap.end_time,
              duration_minutes: nap.duration_minutes,
              quality: nap.quality,
            }
          : null,
        mood: mood
          ? {
              overall: mood.mood_level,
              notes: mood.notes,
            }
          : null,
        activities: (activities || []).map((activity) => ({
          name: activity.activity_name,
          time: activity.time,
          notes: activity.notes,
        })),
        incidents: (incidents || []).map((incident) => ({
          id: incident.id,
          type: incident.incident_type,
          severity: incident.severity,
          description: incident.description,
        })),
        photos_count: photosCount || 0,
      }

      return { success: true, data: summary }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting child summary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener facturas de una familia
   */
  async getInvoices(
    organizationId: string,
    familyId: string
  ): Promise<DataResult<InvoicesResponse>> {
    const supabase = await createClient()

    try {
      // 1. Obtener informacion de la familia
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('id', familyId)
        .eq('organization_id', organizationId)
        .single()

      if (familyError || !family) {
        return { success: false, error: 'Family not found' }
      }

      // 2. Obtener facturas pendientes y recientes
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('family_id', familyId)
        .in('status', ['pending', 'overdue', 'partial'])
        .order('due_date', { ascending: true })
        .limit(10)

      const invoiceList = (invoices || []).map((invoice) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        period: invoice.period_description || `${invoice.period_start} - ${invoice.period_end}`,
        total: invoice.total_amount,
        balance: invoice.balance_due,
        status: invoice.status,
        due_date: invoice.due_date,
        payment_url: invoice.payment_url,
      }))

      const totalBalance = invoiceList.reduce((sum, inv) => sum + inv.balance, 0)

      return {
        success: true,
        data: {
          family: {
            id: family.id,
            name: family.name,
          },
          invoices: invoiceList,
          total_balance: totalBalance,
        },
      }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting invoices:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener fotos recientes de un niño
   */
  async getPhotos(
    organizationId: string,
    childId: string,
    date?: string
  ): Promise<DataResult<PhotosResponse>> {
    const supabase = await createClient()
    const targetDate = date || formatDate(new Date())

    try {
      // 1. Obtener informacion del niño
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .eq('id', childId)
        .eq('organization_id', organizationId)
        .single()

      if (childError || !child) {
        return { success: false, error: 'Child not found' }
      }

      // 2. Obtener fotos del dia
      const { data: photos } = await supabase
        .from('photos')
        .select('id, url, caption, taken_at')
        .eq('child_id', childId)
        .gte('taken_at', `${targetDate}T00:00:00`)
        .lt('taken_at', `${targetDate}T23:59:59`)
        .order('taken_at', { ascending: false })
        .limit(10)

      return {
        success: true,
        data: {
          child: {
            id: child.id,
            name: `${child.first_name} ${child.last_name}`,
          },
          date: targetDate,
          photos: (photos || []).map((photo) => ({
            id: photo.id,
            url: photo.url,
            caption: photo.caption,
            taken_at: photo.taken_at,
          })),
        },
      }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting photos:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener informacion publica de la organizacion (para prospectos)
   */
  async getPublicInfo(
    organizationId: string
  ): Promise<DataResult<PublicInfoResponse>> {
    const supabase = await createClient()

    try {
      // 1. Obtener informacion de la organizacion
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return { success: false, error: 'Organization not found' }
      }

      // 2. Obtener programas/tarifas
      const { data: programs } = await supabase
        .from('programs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('age_min', { ascending: true })

      return {
        success: true,
        data: {
          organization: {
            id: org.id,
            name: org.name,
            address: org.address || 'Direccion no disponible',
            phone: org.phone || 'Telefono no disponible',
            email: org.email || 'Email no disponible',
          },
          programs: (programs || []).map((program) => ({
            name: program.name,
            age_range: `${program.age_min}-${program.age_max} años`,
            price: `$${program.monthly_rate}/mes`,
            schedule: program.schedule_description || 'Consultar horarios',
          })),
          hours: {
            open: org.business_hours_start || '6:30 AM',
            close: org.business_hours_end || '6:00 PM',
          },
          features: org.features || [
            'Educacion temprana',
            'Comidas incluidas',
            'Programa VPK',
            'Ambiente bilingue',
          ],
        },
      }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting public info:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener estado de asistencia actual
   */
  async getAttendanceStatus(
    organizationId: string,
    childId: string
  ): Promise<DataResult<{ status: string; check_in_time: string | null; check_out_time: string | null }>> {
    const supabase = await createClient()
    const today = formatDate(new Date())

    try {
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('status, check_in_time, check_out_time')
        .eq('child_id', childId)
        .eq('date', today)
        .single()

      return {
        success: true,
        data: {
          status: attendance?.status || 'not_checked_in',
          check_in_time: attendance?.check_in_time || null,
          check_out_time: attendance?.check_out_time || null,
        },
      }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting attendance:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener incidentes pendientes de notificar
   */
  async getPendingIncidents(
    organizationId: string,
    childId: string
  ): Promise<DataResult<Array<{ id: string; type: string; severity: string; description: string }>>> {
    const supabase = await createClient()

    try {
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id, incident_type, severity, description')
        .eq('child_id', childId)
        .eq('organization_id', organizationId)
        .eq('notified_guardians', false)
        .order('created_at', { ascending: false })

      return {
        success: true,
        data: (incidents || []).map((incident) => ({
          id: incident.id,
          type: incident.incident_type,
          severity: incident.severity,
          description: incident.description,
        })),
      }
    } catch (error) {
      console.error('[WhatsApp Data] Error getting incidents:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
}

export default whatsappDataService
