import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { emailService } from '@/features/notifications/services/email.service'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface SendReportRequest {
  child_id: string
  date: string
  parent_email: string
  parent_name: string
  child_name: string
  center_name: string
  notes?: string
}

// Labels for display
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  am_snack: 'Merienda AM',
  lunch: 'Almuerzo',
  pm_snack: 'Merienda PM',
  dinner: 'Cena',
}

const AMOUNT_LABELS: Record<string, string> = {
  none: 'Nada',
  little: 'Poco',
  half: 'Mitad',
  most: 'Casi todo',
  all: 'Todo',
}

const NAP_QUALITY_LABELS: Record<string, string> = {
  poor: 'Mal',
  fair: 'Regular',
  good: 'Bien',
  excellent: 'Excelente',
}

const BATHROOM_TYPE_LABELS: Record<string, string> = {
  diaper: 'Panal',
  potty: 'Entrenamiento',
  toilet: 'Bano',
  accident: 'Accidente',
}

const DIAPER_LABELS: Record<string, string> = {
  wet: 'Mojado',
  dirty: 'Sucio',
  both: 'Ambos',
  dry: 'Seco',
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'Feliz',
  content: 'Contento',
  neutral: 'Neutral',
  fussy: 'Inquieto',
  sad: 'Triste',
  tired: 'Cansado',
  energetic: 'Energetico',
}

const MILK_TYPE_LABELS: Record<string, string> = {
  breast_milk: 'Leche Materna',
  formula: 'Formula',
  whole_milk: 'Leche Entera',
  cow_milk: 'Leche de Vaca',
  soy_milk: 'Leche de Soya',
  almond_milk: 'Leche de Almendra',
  oat_milk: 'Leche de Avena',
  other: 'Otro',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendReportRequest
    const { child_id, date, parent_email, parent_name, child_name, center_name, notes } = body

    if (!child_id || !date || !parent_email || !parent_name || !child_name || !center_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Fetch all daily activities for this child and date
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    // Fetch meals
    const { data: mealsData } = await supabase
      .from('meal_records')
      .select('*')
      .eq('child_id', child_id)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true })

    // Fetch naps
    const { data: napsData } = await supabase
      .from('nap_records')
      .select('*')
      .eq('child_id', child_id)
      .gte('start_time', startOfDay)
      .lt('start_time', endOfDay)
      .order('start_time', { ascending: true })

    // Fetch bathroom records
    const { data: bathroomData } = await supabase
      .from('bathroom_records')
      .select('*')
      .eq('child_id', child_id)
      .gte('record_time', startOfDay)
      .lt('record_time', endOfDay)
      .order('record_time', { ascending: true })

    // Fetch activities
    const { data: activitiesData } = await supabase
      .from('activity_records')
      .select('*')
      .eq('child_id', child_id)
      .gte('activity_time', startOfDay)
      .lt('activity_time', endOfDay)
      .order('activity_time', { ascending: true })

    // Fetch moods
    const { data: moodsData } = await supabase
      .from('mood_records')
      .select('*')
      .eq('child_id', child_id)
      .gte('record_time', startOfDay)
      .lt('record_time', endOfDay)
      .order('record_time', { ascending: true })

    // Fetch bottle feedings
    const { data: bottleFeedingsData } = await supabase
      .from('bottle_feedings')
      .select('*')
      .eq('child_id', child_id)
      .gte('feeding_time', startOfDay)
      .lt('feeding_time', endOfDay)
      .order('feeding_time', { ascending: true })

    // Fetch photos (only shared ones)
    const { data: photosData } = await supabase
      .from('daily_photos')
      .select('*')
      .eq('child_id', child_id)
      .eq('shared_with_parents', true)
      .gte('photo_time', startOfDay)
      .lt('photo_time', endOfDay)
      .order('photo_time', { ascending: true })

    // Format the data for the email
    const formatTime = (isoString: string) => {
      try {
        return format(parseISO(isoString), 'h:mm a', { locale: es })
      } catch {
        return isoString
      }
    }

    const meals = (mealsData || []).map(m => ({
      time: formatTime(m.meal_time),
      type: MEAL_TYPE_LABELS[m.meal_type] || m.meal_type,
      amount: AMOUNT_LABELS[m.amount_eaten] || m.amount_eaten,
    }))

    const naps = (napsData || []).map(n => ({
      startTime: formatTime(n.start_time),
      endTime: n.end_time ? formatTime(n.end_time) : 'En progreso',
      quality: NAP_QUALITY_LABELS[n.quality] || n.quality || 'N/A',
    }))

    const bathroom = (bathroomData || []).map(b => ({
      time: formatTime(b.record_time),
      type: b.record_type === 'diaper'
        ? `${BATHROOM_TYPE_LABELS[b.record_type]} - ${DIAPER_LABELS[b.diaper_condition] || b.diaper_condition}`
        : BATHROOM_TYPE_LABELS[b.record_type] || b.record_type,
    }))

    const activities = (activitiesData || []).map(a => ({
      time: formatTime(a.activity_time),
      name: a.activity_name,
    }))

    const moods = (moodsData || []).map(m => ({
      time: formatTime(m.record_time),
      mood: MOOD_LABELS[m.mood] || m.mood,
    }))

    const bottleFeedings = (bottleFeedingsData || []).map(b => ({
      time: formatTime(b.feeding_time),
      amount: b.amount_oz.toString(),
      type: MILK_TYPE_LABELS[b.milk_type] || b.milk_type,
    }))

    const photos = (photosData || []).map(p => ({
      url: p.photo_url,
      caption: p.caption || undefined,
    }))

    // Format the date for display
    const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

    // Send the email
    const result = await emailService.sendDailyActivityReport(parent_email, {
      parentName: parent_name,
      childName: child_name,
      date: formattedDate,
      centerName: center_name,
      meals,
      naps,
      bathroom,
      activities,
      moods,
      bottleFeedings: bottleFeedings.length > 0 ? bottleFeedings : undefined,
      photos: photos.length > 0 ? photos : undefined,
      notes,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Daily report sent successfully',
      email_id: result.id,
    })

  } catch (error) {
    console.error('Error sending daily report email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
