// =====================================================
// Shared Types Index
// =====================================================

// Base models
export * from './models'

// Database types (Supabase generated)
export * from './database.types'

// Admin/Super Admin types
export * from './admin'

// Staff certifications (DCF compliance)
export * from './staff-certifications'

// Guardians, emergency contacts, authorized pickups
export * from './guardians'

// Expanded attendance
export * from './attendance-expanded'

// Expanded incidents (with signature) - exclude types already in database.types
export {
  // Exclude IncidentType and IncidentSeverity (already in database.types)
  type IncidentStatus,
  type NotificationMethod,
  type ParentCopySentMethod,
  type IncidentExpanded,
  type IncidentReportView,
  type IncidentFormData,
  type SignatureFormData,
  type RecordSignatureResult,
} from './incidents-expanded'

// Expanded invoices (multi-week) - exclude types already in database.types
export {
  type PaymentPeriodType,
  // Exclude InvoiceStatus (already in database.types)
  type InvoiceExpanded,
  type InvoiceWeek,
  type InvoiceDetailsView,
  type InvoiceWeekDetail,
  type OverdueInvoiceView,
  type CreateWeeklyInvoiceInput,
  type InvoiceWeekInput,
  type CreateInvoiceResult,
} from './invoices-expanded'

// Food program (CACFP) - exports MealType, MilkType, AmountEaten, PaymentMethod
export * from './food-program'

// VPK & School Readiness - exports AssessmentPeriod
export * from './vpk-sr'

// Accounting (no naming conflicts)
export * from './accounting'

// Notifications
export * from './notifications'

// Immunization tracking (DCF compliance)
export * from './immunizations'

// Documents & Forms (DCF compliance)
export * from './documents'

// Daily Activities (meals, naps, activities, etc.)
// Exclude: DailyReport (conflicts with database.types), MealType/AmountEaten/MilkType (conflicts with food-program)
export type { DailyReport as DailyActivityReport } from './daily-activities'
export {
  type NapQuality, type BathroomRecordType,
  type DiaperCondition, type ActivityType, type EngagementLevel, type MoodType,
  type EnergyLevel, type HealthObservationType, type DailyReportStatus,
  type SendVia, type BottleTemperature,
  type MealRecord, type MealRecordFormData,
  type NapRecord, type NapRecordFormData,
  type BathroomRecord, type BathroomRecordFormData,
  type ActivityRecord, type ActivityRecordFormData,
  type MoodRecord, type MoodRecordFormData,
  type HealthObservation, type HealthObservationFormData,
  type DailyReportFormData,
  type BottleFeeding, type BottleFeedingFormData,
  type DailyPhoto, type DailyPhotoFormData,
  type ChildDailySummary, type DailyActivityCounts, type DailyActivityFilters,
  MEAL_TYPE_LABELS, AMOUNT_EATEN_LABELS, NAP_QUALITY_LABELS,
  ACTIVITY_TYPE_LABELS, MOOD_LABELS, MOOD_EMOJIS,
  DIAPER_CONDITION_LABELS, ENGAGEMENT_LEVEL_LABELS,
  MILK_TYPE_LABELS, BOTTLE_TEMPERATURE_LABELS,
} from './daily-activities'

// Learning & Milestones - exclude AssessmentPeriod (conflicts with vpk-sr)
export type { AssessmentPeriod as MilestoneAssessmentPeriod } from './learning-milestones'
export {
  type MilestoneStatus, type SkillLevel, type LearningPlanStatus,
  type GoalStatus, type AssessmentType, type OverallProgress,
  type AssessmentStatus, type MediaType,
  type MilestoneCategory, type MilestoneTemplate,
  type ChildMilestone, type ChildMilestoneFormData,
  type MilestoneObservation, type MilestoneObservationFormData,
  type LearningPlan, type LearningPlanFormData,
  type LearningPlanGoal, type LearningPlanGoalFormData,
  type PortfolioEntry, type PortfolioEntryFormData,
  type AssessmentPeriodFormData,
  type ChildAssessment, type ChildAssessmentFormData,
  type MilestoneSummary, type ChildDevelopmentOverview, type MilestoneFilters,
} from './learning-milestones'

// Billing Plans & Rates
export * from './billing-plans'

// Admissions & Waitlist - exclude EmergencyContact (conflicts with guardians)
export type { EmergencyContact as AdmissionEmergencyContact } from './admissions'
export {
  type InquiryStatus, type LeadSource, type TourStatus,
  type WaitlistPriority, type ApplicationStatus,
  type CommunicationType as AdmissionCommunicationType,
  type AdmissionInquiry, type AdmissionInquiryFormData,
  type AdmissionTour, type AdmissionTourFormData,
  type WaitlistEntry, type WaitlistEntryFormData,
  type ParentInfo, type ChildInfo,
  type DocumentsChecklist, type Authorizations,
  type EnrollmentApplication, type EnrollmentApplicationFormData,
  type AdmissionCommunication, type AdmissionCommunicationFormData,
  type PipelineStats, type WaitlistAgeGroupStats,
} from './admissions'
