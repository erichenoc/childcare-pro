'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Baby,
  MessageSquare,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassStatCard,
  GlassAvatar,
  GlassBadge,
  GlassRatioIndicator,
} from '@/shared/components/ui'
import { childrenService } from '@/features/children/services/children.service'
import { staffService } from '@/features/staff/services/staff.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import { billingService } from '@/features/billing/services/billing.service'

// DCF Florida ratios by age group
const dcfRatios: Record<string, number> = {
  'infants': 4,
  'ones': 6,
  'twos': 11,
  'threes': 15,
  'fours': 20,
  'school_age': 25,
}

// Age group labels will be loaded from translations
function getAgeGroupLabels(t: ReturnType<typeof useTranslations>): Record<string, string> {
  return {
    'infants': t.dcfRatios.infant,
    'ones': t.dcfRatios.oneYear,
    'twos': t.dcfRatios.twoYears,
    'threes': t.dcfRatios.threeYears,
    'fours': t.dcfRatios.fourFiveYears,
    'school_age': t.dcfRatios.schoolAge,
  }
}

interface DashboardStats {
  totalChildren: number
  presentToday: number
  absentToday: number
  staffOnDuty: number
  revenue: number
  revenueGrowth: number
}

interface RatioData {
  ageGroup: string
  currentRatio: string
  requiredRatio: string
  status: 'compliant' | 'warning' | 'non-compliant'
  children: number
  staff: number
}

export default function DashboardPage() {
  const t = useTranslations()
  const { formatCurrency } = useI18n()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    presentToday: 0,
    absentToday: 0,
    staffOnDuty: 0,
    revenue: 0,
    revenueGrowth: 0,
  })
  const [ratios, setRatios] = useState<RatioData[]>([])
  const [staffList, setStaffList] = useState<{ id: string; first_name: string; last_name: string }[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setIsLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Load all data in parallel
      const [childrenStats, staffStats, classrooms, billingStats] = await Promise.all([
        childrenService.getStats(today),
        staffService.getStats(),
        classroomsService.getWithStats(),
        billingService.getStats().catch(() => ({ totalCollected: 0, totalPending: 0, paidCount: 0, overdueCount: 0 })),
      ])

      // Calculate stats
      setStats({
        totalChildren: childrenStats.total,
        presentToday: childrenStats.present,
        absentToday: childrenStats.absent,
        staffOnDuty: staffStats.active,
        revenue: billingStats.totalCollected || 0,
        revenueGrowth: 0,
      })

      // Calculate ratio data from classrooms
      const ageLabels = getAgeGroupLabels(t)
      const ratioData = classrooms
        .filter(c => c.children_count > 0 || c.staff_count > 0)
        .map(classroom => {
          const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15
          const currentRatioNum = classroom.staff_count > 0
            ? classroom.children_count / classroom.staff_count
            : classroom.children_count

          let status: 'compliant' | 'warning' | 'non-compliant' = 'compliant'
          if (classroom.staff_count === 0 && classroom.children_count > 0) {
            status = 'non-compliant'
          } else if (currentRatioNum > requiredRatio) {
            status = 'non-compliant'
          } else if (currentRatioNum > requiredRatio * 0.9) {
            status = 'warning'
          }

          return {
            ageGroup: ageLabels[classroom.age_group || 'threes'] || classroom.name,
            currentRatio: `${Math.round(currentRatioNum)}:1`,
            requiredRatio: `${requiredRatio}:1`,
            status,
            children: classroom.children_count,
            staff: classroom.staff_count,
          }
        })

      setRatios(ratioData.length > 0 ? ratioData : getDefaultRatios())

      // Load staff for avatars
      const allStaff = await staffService.getAll()
      setStaffList(allStaff
        .filter(s => s.status === 'active')
        .slice(0, 10)
        .map(s => ({ id: s.id, first_name: s.first_name, last_name: s.last_name }))
      )

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setRatios(getDefaultRatios())
    } finally {
      setIsLoading(false)
    }
  }

  function getDefaultRatios(): RatioData[] {
    return [
      { ageGroup: t.dcfRatios.infant, currentRatio: '0:1', requiredRatio: '4:1', status: 'compliant', children: 0, staff: 0 },
      { ageGroup: t.dcfRatios.oneYear, currentRatio: '0:1', requiredRatio: '6:1', status: 'compliant', children: 0, staff: 0 },
      { ageGroup: t.dcfRatios.twoYears, currentRatio: '0:1', requiredRatio: '11:1', status: 'compliant', children: 0, staff: 0 },
      { ageGroup: t.dcfRatios.threeYears, currentRatio: '0:1', requiredRatio: '15:1', status: 'compliant', children: 0, staff: 0 },
    ]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.dashboard.welcomeBack}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/attendance">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.dashboard.checkInChild}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          label={t.dashboard.totalChildren}
          value={stats.totalChildren}
          icon={<Baby className="w-6 h-6" />}
          variant="primary"
        />
        <GlassStatCard
          label={t.dashboard.presentToday}
          value={stats.presentToday}
          icon={<UserCheck className="w-6 h-6" />}
          variant="success"
        />
        <GlassStatCard
          label={t.dashboard.absentToday}
          value={stats.absentToday}
          icon={<UserX className="w-6 h-6" />}
          variant="warning"
        />
        <GlassStatCard
          label={t.dashboard.revenue}
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={stats.revenueGrowth > 0 ? { value: stats.revenueGrowth, label: t.dashboard.thisMonth } : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ratio Status & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ratio Status */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.ratioStatus}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {ratios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratios.map((ratio, index) => (
                    <GlassRatioIndicator
                      key={index}
                      ageGroup={ratio.ageGroup}
                      currentRatio={ratio.currentRatio}
                      requiredRatio={ratio.requiredRatio}
                      status={ratio.status}
                      childrenCount={ratio.children}
                      staffCount={ratio.staff}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t.common.noResults}
                </p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.quickActions}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickActionButton
                  icon={<UserCheck className="w-5 h-5" />}
                  label={t.dashboard.checkInChild}
                  variant="success"
                  href="/dashboard/attendance"
                />
                <QuickActionButton
                  icon={<MessageSquare className="w-5 h-5" />}
                  label={t.dashboard.newMessage}
                  variant="primary"
                  href="/dashboard/communication"
                />
                <QuickActionButton
                  icon={<FileText className="w-5 h-5" />}
                  label={t.dashboard.createReport}
                  variant="secondary"
                  href="/dashboard/reports"
                />
                <QuickActionButton
                  icon={<Clock className="w-5 h-5" />}
                  label={t.dashboard.viewAttendance}
                  variant="default"
                  href="/dashboard/attendance"
                />
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.todaysSummary}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.dashboard.totalChildren}</span>
                  <span className="font-semibold text-gray-900">{stats.totalChildren}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.dashboard.presentToday}</span>
                  <span className="font-semibold text-green-600">{stats.presentToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.dashboard.absentToday}</span>
                  <span className="font-semibold text-amber-600">{stats.absentToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t.common.attendanceRate}</span>
                  <span className="font-semibold text-primary-600">
                    {stats.totalChildren > 0
                      ? `${Math.round((stats.presentToday / stats.totalChildren) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Staff On Duty */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>{t.dashboard.staffOnDuty}</GlassCardTitle>
                <GlassBadge variant="success" dot>
                  {stats.staffOnDuty} {t.common.active}
                </GlassBadge>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              {staffList.length > 0 ? (
                <div className="flex -space-x-2">
                  {staffList.slice(0, 6).map((staff) => (
                    <GlassAvatar
                      key={staff.id}
                      name={`${staff.first_name} ${staff.last_name}`}
                      size="sm"
                    />
                  ))}
                  {stats.staffOnDuty > 6 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900">
                      +{stats.staffOnDuty - 6}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t.staff.noStaffFound}</p>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'primary' | 'secondary' | 'success'
  href?: string
}

function QuickActionButton({ icon, label, variant = 'default', href }: QuickActionButtonProps) {
  const variantClasses = {
    default: 'bg-neu-bg dark:bg-neu-bg-dark shadow-neu-sm dark:shadow-neu-dark-sm hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-gray-700 dark:text-gray-300',
    primary: 'bg-primary-500/10 shadow-neu-sm dark:shadow-neu-dark-sm hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-500/10 shadow-neu-sm dark:shadow-neu-dark-sm hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-secondary-600 dark:text-secondary-400',
    success: 'bg-success/10 shadow-neu-sm dark:shadow-neu-dark-sm hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-success',
  }

  const Component = href ? Link : 'button'

  return (
    <Component
      href={href || ''}
      className={`
        flex flex-col items-center justify-center gap-2 p-4 rounded-xl
        transition-all duration-200 border border-gray-200 dark:border-gray-700
        ${variantClasses[variant]}
      `}
    >
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
    </Component>
  )
}
