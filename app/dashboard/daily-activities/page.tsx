'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  CalendarDays,
  Baby,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
  FileText,
  Layers,
  Filter,
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
  BulkActivityModal,
  DailyReportModal,
  ChildActivityStatus,
  MissingActivitiesBadge,
} from '@/features/daily-activities/components'
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import type {
  MealRecord,
  NapRecord,
  BathroomRecord,
  ActivityRecord,
  MoodRecord,
  HealthObservation,
} from '@/shared/types/daily-activities'
import type { Child } from '@/shared/types'
import type { Classroom } from '@/features/classrooms/types'
import { useTranslations } from '@/shared/lib/i18n'

interface ChildActivityCounts {
  [childId: string]: {
    meals: number
    naps: number
    bathroom: number
    moods: number
  }
}

export default function DailyActivitiesPage() {
  const t = useTranslations()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('')
  const [children, setChildren] = useState<Child[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [childActivityCounts, setChildActivityCounts] = useState<ChildActivityCounts>({})

  // Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Activity data for selected child
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [naps, setNaps] = useState<NapRecord[]>([])
  const [bathroom, setBathroom] = useState<BathroomRecord[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [moods, setMoods] = useState<MoodRecord[]>([])
  const [healthObs, setHealthObs] = useState<HealthObservation[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadActivities()
  }, [selectedDate, selectedChildId])

  useEffect(() => {
    loadAllChildrenCounts()
  }, [selectedDate, children])

  const loadInitialData = async () => {
    try {
      const [childrenData, classroomsData] = await Promise.all([
        childrenService.getChildren(),
        classroomsService.getAll(),
      ])
      setChildren(childrenData)
      setClassrooms(classroomsData.filter((c) => c.status === 'active'))
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
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

      // Update counts for this child
      setChildActivityCounts((prev) => ({
        ...prev,
        [selectedChildId]: {
          meals: mealsData.length,
          naps: napsData.length,
          bathroom: bathroomData.length,
          moods: moodsData.length,
        },
      }))
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllChildrenCounts = async () => {
    // Load activity counts for all children (for status indicators)
    const counts: ChildActivityCounts = {}

    // Batch load counts - this could be optimized with a single API call
    for (const child of children) {
      try {
        const filters = { child_id: child.id, date: selectedDate }
        const [mealsData, napsData, bathroomData, moodsData] = await Promise.all([
          dailyActivitiesService.getMeals(filters),
          dailyActivitiesService.getNaps(filters),
          dailyActivitiesService.getBathroomRecords(filters),
          dailyActivitiesService.getMoods(filters),
        ])
        counts[child.id] = {
          meals: mealsData.length,
          naps: napsData.length,
          bathroom: bathroomData.length,
          moods: moodsData.length,
        }
      } catch (error) {
        counts[child.id] = { meals: 0, naps: 0, bathroom: 0, moods: 0 }
      }
    }
    setChildActivityCounts(counts)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCompare = new Date(date)
    dateToCompare.setHours(0, 0, 0, 0)

    if (dateToCompare.getTime() === today.getTime()) {
      return t.dashboard.today
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateToCompare.getTime() === yesterday.getTime()) {
      return 'Ayer'
    }

    return date.toLocaleDateString('es', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter children by search and classroom
  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const matchesSearch =
        !searchTerm ||
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesClassroom =
        !selectedClassroomId || child.classroom_id === selectedClassroomId
      return matchesSearch && matchesClassroom && child.status === 'active'
    })
  }, [children, searchTerm, selectedClassroomId])

  const selectedChild = children.find((c) => c.id === selectedChildId)

  // Classroom options for filter
  const classroomOptions = [
    { value: '', label: t.common.allClassrooms },
    ...classrooms.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t.nav.dailyActivities}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Registra comidas, siestas, pañales y más
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton variant="secondary" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </GlassButton>

          <GlassButton
            variant={isToday ? 'primary' : 'secondary'}
            size="sm"
            onClick={goToToday}
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            {t.dashboard.today}
          </GlassButton>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => navigateDate('next')}
            disabled={isToday}
          >
            <ChevronRight className="w-4 h-4" />
          </GlassButton>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-neu dark:shadow-neu-dark text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>

          <GlassInput
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-36"
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
                Niños ({filteredChildren.length})
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <GlassInput
                  type="text"
                  placeholder="Buscar niños..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Classroom Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <GlassSelect
                  options={classroomOptions}
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Children List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {filteredChildren.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Baby className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay niños en este salón</p>
                  </div>
                ) : (
                  filteredChildren.map((child) => {
                    const counts = childActivityCounts[child.id] || {
                      meals: 0,
                      naps: 0,
                      bathroom: 0,
                      moods: 0,
                    }
                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedChildId === child.id
                            ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-50 dark:bg-primary-900/20'
                            : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <Baby className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {child.first_name} {child.last_name}
                            </p>
                            <ChildActivityStatus counts={counts} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {child.classroom?.name || 'Sin salón'}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Bulk Actions */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="w-full"
                  disabled={filteredChildren.length === 0}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Registro en Lote
                </GlassButton>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChild ? (
            <>
              {/* Child Header with Report Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Baby className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedChild.first_name} {selectedChild.last_name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChild.classroom?.name || 'Sin salón asignado'}
                    </p>
                  </div>
                </div>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte Diario
                </GlassButton>
              </div>

              {/* What's Missing Today */}
              {childActivityCounts[selectedChild.id] && (
                <MissingActivitiesBadge counts={childActivityCounts[selectedChild.id]} />
              )}

              {/* Quick Actions */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    Acciones Rápidas
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
                    Línea de Tiempo
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
                  Selecciona un Niño
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Elige un niño de la lista para ver y registrar sus actividades diarias
                </p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Bulk Activity Modal */}
      <BulkActivityModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        children={filteredChildren}
        classroomId={selectedClassroomId || undefined}
        onSuccess={() => {
          loadActivities()
          loadAllChildrenCounts()
        }}
      />

      {/* Daily Report Modal */}
      <DailyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        child={selectedChild || null}
        date={selectedDate}
        meals={meals}
        naps={naps}
        bathroom={bathroom}
        activities={activities}
        moods={moods}
        healthObs={healthObs}
      />
    </div>
  )
}
