'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Baby,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import { dailyActivitiesService } from '@/features/daily-activities/services/daily-activities.service'
import {
  QuickActionButtons,
  ActivityTimeline,
  DailySummaryStats,
} from '@/features/daily-activities/components'
import { childrenService } from '@/features/children/services/children.service'
import type {
  MealRecord,
  NapRecord,
  BathroomRecord,
  ActivityRecord,
  MoodRecord,
  HealthObservation,
} from '@/shared/types/daily-activities'
import type { Child } from '@/shared/types'
import { useTranslations } from '@/shared/lib/i18n'

export default function DailyActivitiesPage() {
  const t = useTranslations()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Activity data
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [naps, setNaps] = useState<NapRecord[]>([])
  const [bathroom, setBathroom] = useState<BathroomRecord[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [moods, setMoods] = useState<MoodRecord[]>([])
  const [healthObs, setHealthObs] = useState<HealthObservation[]>([])

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    loadActivities()
  }, [selectedDate, selectedChildId])

  const loadChildren = async () => {
    try {
      const data = await childrenService.getChildren()
      setChildren(data)
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  const loadActivities = async () => {
    if (!selectedChildId) return

    setIsLoading(true)
    try {
      const filters = { child_id: selectedChildId, date: selectedDate }
      const [mealsData, napsData, bathroomData, activitiesData, moodsData, healthData] =
        await Promise.all([
          dailyActivitiesService.getMeals(filters),
          dailyActivitiesService.getNaps(filters),
          dailyActivitiesService.getBathroomRecords(filters),
          dailyActivitiesService.getActivities(filters),
          dailyActivitiesService.getMoods(filters),
          dailyActivitiesService.getHealthObservations(filters),
        ])

      setMeals(mealsData)
      setNaps(napsData)
      setBathroom(bathroomData)
      setActivities(activitiesData)
      setMoods(moodsData)
      setHealthObs(healthData)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCompare = new Date(date)
    dateToCompare.setHours(0, 0, 0, 0)

    if (dateToCompare.getTime() === today.getTime()) {
      return 'Today'
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateToCompare.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }

    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredChildren = children.filter(
    (child) =>
      !searchTerm ||
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedChild = children.find((c) => c.id === selectedChildId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t.nav.dailyActivities || 'Daily Activities'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track meals, naps, activities and more
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </GlassButton>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-neu dark:shadow-neu-dark">
            <CalendarDays className="w-4 h-4 text-primary-500" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => navigateDate('next')}
            disabled={selectedDate === new Date().toISOString().split('T')[0]}
          >
            <ChevronRight className="w-4 h-4" />
          </GlassButton>
          <GlassInput
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Children List */}
        <div className="lg:col-span-1">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Children
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <GlassInput
                  type="text"
                  placeholder="Search children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedChildId === child.id
                        ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-50 dark:bg-primary-900/20'
                        : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {child.classroom?.name || 'No classroom'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChild ? (
            <>
              {/* Quick Actions */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    Quick Actions
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <QuickActionButtons
                    childId={selectedChild.id}
                    childName={`${selectedChild.first_name} ${selectedChild.last_name}`}
                    onSuccess={loadActivities}
                  />
                </GlassCardContent>
              </GlassCard>

              {/* Daily Summary Stats */}
              <DailySummaryStats
                mealsCount={meals.length}
                napsCount={naps.length}
                bathroomCount={bathroom.length}
                activitiesCount={activities.length}
                moodsCount={moods.length}
                healthCount={healthObs.length}
              />

              {/* Activity Timeline */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary-500" />
                    Today&apos;s Timeline
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ActivityTimeline
                      meals={meals}
                      naps={naps}
                      bathroom={bathroom}
                      activities={activities}
                      moods={moods}
                      healthObservations={healthObs}
                    />
                  )}
                </GlassCardContent>
              </GlassCard>
            </>
          ) : (
            <GlassCard>
              <GlassCardContent className="py-12 text-center">
                <Baby className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a Child
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a child from the list to view and record their daily activities
                </p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
