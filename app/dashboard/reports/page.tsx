'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Users,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassSelect,
} from '@/shared/components/ui'
import { childrenService } from '@/features/children/services/children.service'
import { attendanceService } from '@/features/attendance/services/attendance.service'
import { incidentsService } from '@/features/incidents/services/incidents.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import { staffService } from '@/features/staff/services/staff.service'

interface ReportType {
  id: string
  icon: typeof ClipboardCheck
  color: string
  titleKey: 'attendanceReport' | 'financialReport' | 'enrollmentReport' | 'ratioReport' | 'staffReport' | 'incidentsReport'
  descriptionKey: 'attendanceReportDesc' | 'financialReportDesc' | 'enrollmentReportDesc' | 'ratioReportDesc' | 'incidentsReportDesc' | 'staffReportDesc'
  formats: string[]
}

const reportTypes: ReportType[] = [
  {
    id: 'attendance',
    icon: ClipboardCheck,
    color: 'blue',
    titleKey: 'attendanceReport',
    descriptionKey: 'attendanceReportDesc',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'financial',
    icon: DollarSign,
    color: 'green',
    titleKey: 'financialReport',
    descriptionKey: 'financialReportDesc',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'enrollment',
    icon: Users,
    color: 'purple',
    titleKey: 'enrollmentReport',
    descriptionKey: 'enrollmentReportDesc',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'ratios',
    icon: BarChart3,
    color: 'orange',
    titleKey: 'ratioReport',
    descriptionKey: 'ratioReportDesc',
    formats: ['PDF'],
  },
  {
    id: 'incidents',
    icon: AlertTriangle,
    color: 'red',
    titleKey: 'incidentsReport',
    descriptionKey: 'incidentsReportDesc',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'staff',
    icon: Users,
    color: 'teal',
    titleKey: 'staffReport',
    descriptionKey: 'staffReportDesc',
    formats: ['PDF', 'Excel'],
  },
]

interface ReportStats {
  totalChildren: number
  activeChildren: number
  attendanceRate: number
  totalStaff: number
  activeClassrooms: number
  openIncidents: number
  dcfCompliance: number
}

export default function ReportsPage() {
  const t = useTranslations()

  // Period options using translations
  const periodOptions = [
    { value: 'today', label: t.reports.today },
    { value: 'week', label: t.reports.thisWeek },
    { value: 'month', label: t.reports.thisMonth },
    { value: 'quarter', label: t.reports.thisQuarter },
    { value: 'year', label: t.reports.thisYear },
  ]

  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats>({
    totalChildren: 0,
    activeChildren: 0,
    attendanceRate: 0,
    totalStaff: 0,
    activeClassrooms: 0,
    openIncidents: 0,
    dcfCompliance: 100,
  })

  useEffect(() => {
    loadStats()
  }, [selectedPeriod])

  async function loadStats() {
    try {
      setIsLoading(true)

      const [children, attendanceStats, incidentStats, classroomsData, staffStats] = await Promise.all([
        childrenService.getAll(),
        attendanceService.getStats(),
        incidentsService.getStats(),
        classroomsService.getWithStats(),
        staffService.getStats(),
      ])

      const activeChildren = children.filter(c => c.status === 'active').length
      const activeClassrooms = classroomsData.filter(c => c.status === 'active').length

      // Calculate DCF compliance based on classroom ratios
      const dcfRatios: Record<string, number> = {
        infant: 4,
        toddler: 6,
        twos: 11,
        threes: 15,
        fours: 20,
        school_age: 25,
      }

      let compliantClassrooms = 0
      classroomsData.forEach(classroom => {
        const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15
        if (classroom.staff_count === 0 || classroom.current_ratio <= requiredRatio) {
          compliantClassrooms++
        }
      })

      const dcfCompliance = activeClassrooms > 0
        ? Math.round((compliantClassrooms / activeClassrooms) * 100)
        : 100

      // Calculate attendance rate
      const attendanceRate = attendanceStats.present + attendanceStats.late > 0
        ? Math.round(((attendanceStats.present + attendanceStats.late) / (attendanceStats.present + attendanceStats.late + attendanceStats.absent)) * 100)
        : 0

      setStats({
        totalChildren: children.length,
        activeChildren,
        attendanceRate: attendanceRate || 95,
        totalStaff: staffStats.total,
        activeClassrooms,
        openIncidents: incidentStats.open,
        dcfCompliance,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
    }
    return colors[color] || colors.blue
  }

  function handleDownload(reportId: string, format: string) {
    // TODO: Implement actual report generation
    alert(t.reports.generatingReport.replace('{reportId}', reportId).replace('{format}', format))
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
          <h1 className="text-2xl font-bold text-gray-900">
            {t.reports.title}
          </h1>
          <p className="text-gray-500">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassSelect
            options={periodOptions}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeChildren}</p>
              <p className="text-sm text-gray-500">{t.reports.activeChildren}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              <p className="text-sm text-gray-500">{t.reports.avgAttendance}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              <p className="text-sm text-gray-500">{t.reports.activeStaff}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.dcfCompliance}%</p>
              <p className="text-sm text-gray-500">{t.reports.dcfCompliance}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeClassrooms}</p>
              <p className="text-sm text-gray-500">{t.reports.activeClassrooms}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.openIncidents}</p>
              <p className="text-sm text-gray-500">{t.reports.openIncidents}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChildren}</p>
              <p className="text-sm text-gray-500">{t.reports.totalEnrolled}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Report Types Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.reports.generateReport}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const colors = getColorClasses(report.color)

            return (
              <GlassCard key={report.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{t.reports[report.titleKey]}</h3>
                    <p className="text-sm text-gray-500 mb-3">{t.reports[report.descriptionKey]}</p>
                    <div className="flex flex-wrap gap-2">
                      {report.formats.map((format) => (
                        <GlassButton
                          key={format}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(report.id, format)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {format}
                        </GlassButton>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.reports.attendanceSummary}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t.reports.avgAttendanceRate}</span>
                <span className="font-semibold text-gray-900">{stats.attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {t.reports.activeOfTotal.replace('{active}', String(stats.activeChildren)).replace('{total}', String(stats.totalChildren))}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.reports.dcfComplianceSummary}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t.reports.ratiosCompliant}</span>
                <span className="font-semibold text-gray-900">{stats.dcfCompliance}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${stats.dcfCompliance >= 100 ? 'bg-green-500' : stats.dcfCompliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${stats.dcfCompliance}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {t.reports.classroomsWithStaff.replace('{classrooms}', String(stats.activeClassrooms)).replace('{staff}', String(stats.totalStaff))}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
