'use client'

import { useState, useEffect } from 'react'
import {
  X,
  FileText,
  Send,
  Mail,
  Smartphone,
  Loader2,
  Check,
  AlertCircle,
  UtensilsCrossed,
  Moon,
  Baby,
  Smile,
  Activity,
  Heart,
  Download,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  GlassButton,
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassInput,
} from '@/shared/components/ui'
import { dailyActivitiesService } from '../services/daily-activities.service'
import { useTranslations } from '@/shared/lib/i18n'
import type {
  MealRecord,
  NapRecord,
  BathroomRecord,
  ActivityRecord,
  MoodRecord,
  HealthObservation,
  DailyReport,
} from '@/shared/types/daily-activities'
import {
  MEAL_TYPE_LABELS,
  AMOUNT_EATEN_LABELS,
  NAP_QUALITY_LABELS,
  MOOD_LABELS,
  MOOD_EMOJIS,
} from '@/shared/types/daily-activities'
import type { Child } from '@/shared/types'

interface DailyReportModalProps {
  isOpen: boolean
  onClose: () => void
  child: Child | null
  date: string
  meals: MealRecord[]
  naps: NapRecord[]
  bathroom: BathroomRecord[]
  activities: ActivityRecord[]
  moods: MoodRecord[]
  healthObs: HealthObservation[]
}

export function DailyReportModal({
  isOpen,
  onClose,
  child,
  date,
  meals,
  naps,
  bathroom,
  activities,
  moods,
  healthObs,
}: DailyReportModalProps) {
  const t = useTranslations()
  const [summary, setSummary] = useState('')
  const [sendVia, setSendVia] = useState<'email' | 'app' | 'both'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null)

  useEffect(() => {
    if (isOpen && child) {
      loadExistingReport()
      generateAutoSummary()
    }
  }, [isOpen, child, date])

  const loadExistingReport = async () => {
    if (!child) return
    try {
      const report = await dailyActivitiesService.getDailyReport(child.id, date)
      if (report) {
        setExistingReport(report)
        if (report.overall_day_summary) {
          setSummary(report.overall_day_summary)
        }
        if (report.status === 'sent') {
          setIsSent(true)
        }
      }
    } catch (error) {
      console.error('Error loading existing report:', error)
    }
  }

  const generateAutoSummary = () => {
    if (summary) return // Don't override existing summary

    const parts: string[] = []

    // Meals summary
    if (meals.length > 0) {
      const goodMeals = meals.filter((m) => ['all', 'most'].includes(m.amount_eaten || ''))
      parts.push(
        `Comidas: ${meals.length} registradas, ${goodMeals.length} con buen apetito`
      )
    }

    // Naps summary
    if (naps.length > 0) {
      const totalNapMinutes = naps.reduce((sum, n) => sum + (n.duration_minutes || 0), 0)
      const hours = Math.floor(totalNapMinutes / 60)
      const minutes = totalNapMinutes % 60
      parts.push(
        `Siestas: ${naps.length} (${hours > 0 ? `${hours}h ` : ''}${minutes}min total)`
      )
    }

    // Bathroom summary
    if (bathroom.length > 0) {
      parts.push(`Cambios de pañal: ${bathroom.length}`)
    }

    // Activities summary
    if (activities.length > 0) {
      parts.push(`Actividades: ${activities.length}`)
    }

    // Mood summary
    if (moods.length > 0) {
      const latestMood = moods[0]
      if (latestMood) {
        parts.push(`Estado general: ${MOOD_LABELS[latestMood.mood]} ${MOOD_EMOJIS[latestMood.mood]}`)
      }
    }

    // Health observations
    if (healthObs.length > 0) {
      parts.push(`Observaciones de salud: ${healthObs.length}`)
    }

    setSummary(parts.join('. ') + '.')
  }

  const handleSendReport = async () => {
    if (!child) return

    setIsLoading(true)
    try {
      // Create or update the report
      await dailyActivitiesService.createOrUpdateDailyReport({
        child_id: child.id,
        report_date: date,
        overall_day_summary: summary,
        status: 'completed',
      })

      // Send the report
      await dailyActivitiesService.sendDailyReport(child.id, date, sendVia)

      setIsSent(true)
    } catch (error) {
      console.error('Error sending report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!child) return

    setIsLoading(true)
    try {
      await dailyActivitiesService.createOrUpdateDailyReport({
        child_id: child.id,
        report_date: date,
        overall_day_summary: summary,
        status: 'draft',
      })
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return '-'
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen || !child) return null

  const hasActivities =
    meals.length > 0 ||
    naps.length > 0 ||
    bathroom.length > 0 ||
    activities.length > 0 ||
    moods.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <GlassCardHeader className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            {t.dailyActivities.dailyReportFor} {child.first_name} {child.last_name}
          </GlassCardTitle>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>

        <GlassCardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Success message */}
          {isSent && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span>{t.success.sent}</span>
            </div>
          )}

          {/* Date */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t.common.date}: {new Date(date).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Activities Summary */}
          {hasActivities ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Meals */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">{t.communication.meals}</span>
                </div>
                {meals.length > 0 ? (
                  <div className="space-y-1">
                    {meals.map((meal) => (
                      <div key={meal.id} className="text-xs text-gray-600 dark:text-gray-400">
                        {MEAL_TYPE_LABELS[meal.meal_type]}: {AMOUNT_EATEN_LABELS[meal.amount_eaten || 'some']}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>

              {/* Naps */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">{t.communication.naps}</span>
                </div>
                {naps.length > 0 ? (
                  <div className="space-y-1">
                    {naps.map((nap) => (
                      <div key={nap.id} className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(nap.start_time)} - {formatTime(nap.end_time)}
                        {nap.duration_minutes && ` (${nap.duration_minutes}min)`}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>

              {/* Bathroom */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{t.dailyActivities.diaper}</span>
                </div>
                {bathroom.length > 0 ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {bathroom.length} {t.dailyActivities.diaper.toLowerCase()}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>

              {/* Activities */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{t.dailyActivities.activity}</span>
                </div>
                {activities.length > 0 ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {activities.length} {t.dailyActivities.activity.toLowerCase()}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>

              {/* Mood */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{t.dailyActivities.mood}</span>
                </div>
                {moods.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-xl">{MOOD_EMOJIS[moods[0].mood]}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {MOOD_LABELS[moods[0].mood]}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>

              {/* Health */}
              <div className="p-3 rounded-xl shadow-neu dark:shadow-neu-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">{t.dailyActivities.healthObservation}</span>
                </div>
                {healthObs.length > 0 ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {healthObs.length} {t.dailyActivities.healthObservation.toLowerCase()}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{t.dailyActivities.noRecords}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay actividades registradas para este día
              </p>
            </div>
          )}

          {/* Summary text */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.dailyActivities.reportSummary}
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t.dailyActivities.autoGeneratedSummary}
              rows={4}
              className="w-full p-3 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Send options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.dailyActivities.deliveryMethod}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSendVia('email')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  sendVia === 'email'
                    ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                )}
              >
                <Mail className="w-4 h-4" />
                {t.dailyActivities.emailOnly}
              </button>
              <button
                onClick={() => setSendVia('app')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  sendVia === 'app'
                    ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                )}
              >
                <Smartphone className="w-4 h-4" />
                {t.dailyActivities.appOnly}
              </button>
              <button
                onClick={() => setSendVia('both')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  sendVia === 'both'
                    ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                )}
              >
                {t.dailyActivities.emailAndApp}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <GlassButton variant="secondary" onClick={handleSaveDraft} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              {t.common.save}
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSendReport}
              disabled={isLoading || isSent || !hasActivities}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.dailyActivities.sendingReport}
                </>
              ) : isSent ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.success.sent}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t.dailyActivities.sendReport}
                </>
              )}
            </GlassButton>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
