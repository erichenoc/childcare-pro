// =====================================================
// Daily Activities Types - Child Daily Tracking
// =====================================================

// ==================== Enums ====================

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
export type AmountEaten = 'all' | 'most' | 'some' | 'little' | 'none' | 'refused'
export type NapQuality = 'restful' | 'light' | 'restless' | 'did_not_sleep'
export type BathroomRecordType = 'diaper' | 'potty' | 'bathroom'
export type DiaperCondition = 'wet' | 'dirty' | 'both' | 'dry'
export type ActivityType =
  | 'art'
  | 'music'
  | 'outdoor_play'
  | 'indoor_play'
  | 'reading'
  | 'circle_time'
  | 'sensory'
  | 'gross_motor'
  | 'fine_motor'
  | 'social'
  | 'science'
  | 'math'
  | 'language'
  | 'dramatic_play'
  | 'free_play'
  | 'other'
export type EngagementLevel = 'highly_engaged' | 'engaged' | 'somewhat_engaged' | 'not_interested'
export type MoodType =
  | 'happy'
  | 'content'
  | 'excited'
  | 'calm'
  | 'tired'
  | 'fussy'
  | 'sad'
  | 'frustrated'
  | 'anxious'
  | 'unwell'
export type EnergyLevel = 'high' | 'normal' | 'low' | 'very_low'
export type HealthObservationType =
  | 'temperature'
  | 'injury'
  | 'illness_symptoms'
  | 'medication'
  | 'allergic_reaction'
  | 'behavior_change'
  | 'other'
export type DailyReportStatus = 'draft' | 'completed' | 'sent'
export type SendVia = 'email' | 'app' | 'both'

// ==================== Meal Records ====================

export interface MealRecord {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  meal_type: MealType
  meal_time: string
  food_served: string | null
  amount_eaten: AmountEaten | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  recorder?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface MealRecordFormData {
  child_id: string
  meal_type: MealType
  meal_time?: string
  food_served?: string
  amount_eaten?: AmountEaten
  notes?: string
}

// ==================== Nap Records ====================

export interface NapRecord {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  quality: NapQuality | null
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface NapRecordFormData {
  child_id: string
  start_time: string
  end_time?: string
  quality?: NapQuality
  location?: string
  notes?: string
}

// ==================== Bathroom Records ====================

export interface BathroomRecord {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  record_type: BathroomRecordType
  record_time: string
  diaper_condition: DiaperCondition | null
  potty_success: boolean | null
  has_rash: boolean
  unusual_observation: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface BathroomRecordFormData {
  child_id: string
  record_type: BathroomRecordType
  record_time?: string
  diaper_condition?: DiaperCondition
  potty_success?: boolean
  has_rash?: boolean
  unusual_observation?: string
  notes?: string
}

// ==================== Activity Records ====================

export interface ActivityRecord {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  activity_type: ActivityType
  activity_time: string
  activity_name: string
  description: string | null
  engagement_level: EngagementLevel | null
  duration_minutes: number | null
  learning_areas: string[] | null
  photos: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ActivityRecordFormData {
  child_id: string
  activity_type: ActivityType
  activity_time?: string
  activity_name: string
  description?: string
  engagement_level?: EngagementLevel
  duration_minutes?: number
  learning_areas?: string[]
  photos?: string[]
  notes?: string
}

// ==================== Mood Records ====================

export interface MoodRecord {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  record_time: string
  mood: MoodType
  energy_level: EnergyLevel | null
  trigger_event: string | null
  comfort_measures: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface MoodRecordFormData {
  child_id: string
  record_time?: string
  mood: MoodType
  energy_level?: EnergyLevel
  trigger_event?: string
  comfort_measures?: string
  notes?: string
}

// ==================== Health Observations ====================

export interface HealthObservation {
  id: string
  organization_id: string
  child_id: string
  recorded_by: string | null
  observation_time: string
  observation_type: HealthObservationType
  temperature_value: number | null
  medication_name: string | null
  medication_dosage: string | null
  medication_time: string | null
  description: string
  action_taken: string | null
  parent_notified: boolean
  parent_notified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface HealthObservationFormData {
  child_id: string
  observation_time?: string
  observation_type: HealthObservationType
  temperature_value?: number
  medication_name?: string
  medication_dosage?: string
  medication_time?: string
  description: string
  action_taken?: string
  parent_notified?: boolean
  notes?: string
}

// ==================== Daily Reports ====================

export interface DailyReport {
  id: string
  organization_id: string
  child_id: string
  report_date: string
  status: DailyReportStatus
  overall_day_summary: string | null
  highlights: string | null
  reminders_for_parents: string | null
  photos: string[] | null
  sent_at: string | null
  sent_by: string | null
  sent_via: SendVia | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface DailyReportFormData {
  child_id: string
  report_date: string
  status?: DailyReportStatus
  overall_day_summary?: string
  highlights?: string
  reminders_for_parents?: string
  photos?: string[]
}

// ==================== Daily Summary ====================

export interface ChildDailySummary {
  date: string
  meals: MealRecord[]
  naps: NapRecord[]
  bathroom: BathroomRecord[]
  activities: ActivityRecord[]
  moods: MoodRecord[]
  health_observations: HealthObservation[]
}

export interface DailyActivityCounts {
  organization_id: string
  classroom_id: string | null
  report_date: string
  meals_recorded: number
  naps_recorded: number
  bathroom_records: number
  activities_recorded: number
  moods_recorded: number
}

// ==================== Filters ====================

export interface DailyActivityFilters {
  child_id?: string
  classroom_id?: string
  date?: string
  date_from?: string
  date_to?: string
}

// ==================== UI Labels ====================

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
}

export const AMOUNT_EATEN_LABELS: Record<AmountEaten, string> = {
  all: 'All',
  most: 'Most',
  some: 'Some',
  little: 'A Little',
  none: 'None',
  refused: 'Refused',
}

export const NAP_QUALITY_LABELS: Record<NapQuality, string> = {
  restful: 'Restful',
  light: 'Light',
  restless: 'Restless',
  did_not_sleep: 'Did Not Sleep',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  art: 'Art',
  music: 'Music',
  outdoor_play: 'Outdoor Play',
  indoor_play: 'Indoor Play',
  reading: 'Reading',
  circle_time: 'Circle Time',
  sensory: 'Sensory',
  gross_motor: 'Gross Motor',
  fine_motor: 'Fine Motor',
  social: 'Social',
  science: 'Science',
  math: 'Math',
  language: 'Language',
  dramatic_play: 'Dramatic Play',
  free_play: 'Free Play',
  other: 'Other',
}

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: 'Happy',
  content: 'Content',
  excited: 'Excited',
  calm: 'Calm',
  tired: 'Tired',
  fussy: 'Fussy',
  sad: 'Sad',
  frustrated: 'Frustrated',
  anxious: 'Anxious',
  unwell: 'Unwell',
}

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  content: '🙂',
  excited: '🤩',
  calm: '😌',
  tired: '😴',
  fussy: '😣',
  sad: '😢',
  frustrated: '😤',
  anxious: '😰',
  unwell: '🤒',
}

export const DIAPER_CONDITION_LABELS: Record<DiaperCondition, string> = {
  wet: 'Wet',
  dirty: 'Dirty',
  both: 'Both',
  dry: 'Dry',
}

export const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  highly_engaged: 'Highly Engaged',
  engaged: 'Engaged',
  somewhat_engaged: 'Somewhat Engaged',
  not_interested: 'Not Interested',
}
