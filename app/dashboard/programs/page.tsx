'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  UserPlus,
  FileBarChart,
  Banknote,
} from 'lucide-react'
import {
  programsService,
  type VPKEnrollment,
  type SchoolReadinessEnrollment,
  type VPKHoursSummary,
} from '@/features/programs/services/programs.service'
import { useTranslations } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassWorkflowStepper,
  type WorkflowStep,
  GlassContextualHelp,
  GlassSmartEmptyState,
} from '@/shared/components/ui'

export default function ProgramsDashboardPage() {
  const t = useTranslations()
  const [vpkEnrollments, setVpkEnrollments] = useState<VPKEnrollment[]>([])
  const [srEnrollments, setSrEnrollments] = useState<SchoolReadinessEnrollment[]>([])
  const [vpkSummary, setVpkSummary] = useState<VPKHoursSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [vpkData, srData, summaryData] = await Promise.all([
        programsService.getVPKEnrollments(),
        programsService.getSREnrollments(),
        programsService.getVPKHoursSummary(),
      ])
      setVpkEnrollments(vpkData)
      setSrEnrollments(srData)
      setVpkSummary(summaryData)
    } catch (error) {
      console.error('Error loading programs data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeVPK = vpkEnrollments.filter(e => e.status === 'active')
  const activeSR = srEnrollments.filter(e => e.status === 'active')
  const vpkBehindSchedule = vpkSummary.filter(s => !s.on_track)

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
          <h1 className="text-2xl font-bold text-gray-900">{t.nav.programs}</h1>
          <p className="text-gray-500">
            Gestiona VPK y School Readiness
          </p>
        </div>
      </div>

      {/* Programs Workflow */}
      <GlassWorkflowStepper
        steps={[
          {
            key: 'enroll',
            label: t.workflow.programsEnroll,
            icon: <UserPlus className="w-4 h-4" />,
            status: 'current',
          },
          {
            key: 'hours',
            label: t.workflow.programsTrackHours,
            icon: <Clock className="w-4 h-4" />,
            status: 'upcoming',
          },
          {
            key: 'reports',
            label: t.workflow.programsReports,
            icon: <FileBarChart className="w-4 h-4" />,
            status: 'upcoming',
          },
          {
            key: 'funding',
            label: t.workflow.programsFunding,
            icon: <Banknote className="w-4 h-4" />,
            status: 'upcoming',
          },
        ]}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeVPK.length}</p>
              <p className="text-sm text-gray-500">VPK {t.common.active}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeSR.length}</p>
              <p className="text-sm text-gray-500">School Readiness</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeVPK.length + activeSR.length}
              </p>
              <p className="text-sm text-gray-500">{t.children.totalEnrolled}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              vpkBehindSchedule.length > 0 ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              {vpkBehindSchedule.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vpkBehindSchedule.length}</p>
              <p className="text-sm text-gray-500">VPK Atrasados</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Program Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* VPK Card */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <GlassCardTitle>VPK</GlassCardTitle>
                    <GlassContextualHelp
                      title={t.contextHelp.vpkTitle}
                      content={t.contextHelp.vpkContent}
                      position="bottom"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Voluntary Prekindergarten</p>
                </div>
              </div>
              <Link href="/dashboard/programs/vpk">
                <GlassButton variant="ghost" size="sm">
                  <ChevronRight className="w-5 h-5" />
                </GlassButton>
              </Link>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">{activeVPK.length}</p>
                  <p className="text-xs text-gray-500">{t.common.active}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">
                    {vpkEnrollments.filter(e => e.status === 'completed').length}
                  </p>
                  <p className="text-xs text-gray-500">Completados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">
                    {vpkEnrollments.filter(e => e.schedule_type === 'school_year').length}
                  </p>
                  <p className="text-xs text-gray-500">Escolar</p>
                </div>
              </div>

              {/* VPK Progress List */}
              {vpkSummary.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Progreso de Horas</p>
                  {vpkSummary.slice(0, 3).map((summary) => (
                    <div
                      key={summary.enrollment_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          summary.on_track ? 'bg-green-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-sm font-medium">{summary.child_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              summary.on_track ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(summary.percent_complete, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {summary.percent_complete}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay estudiantes VPK activos
                </p>
              )}

              <Link href="/dashboard/programs/vpk">
                <GlassButton variant="secondary" className="w-full">
                  Ver Todos los VPK
                </GlassButton>
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* School Readiness Card */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <GlassCardTitle>School Readiness</GlassCardTitle>
                    <GlassContextualHelp
                      title={t.contextHelp.srTitle}
                      content={t.contextHelp.srContent}
                      position="bottom"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Subsidio de Cuidado Infantil</p>
                </div>
              </div>
              <Link href="/dashboard/programs/school-readiness">
                <GlassButton variant="ghost" size="sm">
                  <ChevronRight className="w-5 h-5" />
                </GlassButton>
              </Link>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">{activeSR.length}</p>
                  <p className="text-xs text-gray-500">{t.common.active}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">
                    {srEnrollments.filter(e => e.rate_type === 'full_time').length}
                  </p>
                  <p className="text-xs text-gray-500">{t.children.fullTime}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">
                    {srEnrollments.filter(e => e.rate_type === 'part_time').length}
                  </p>
                  <p className="text-xs text-gray-500">{t.children.partTime}</p>
                </div>
              </div>

              {/* SR Enrollments List */}
              {activeSR.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Inscripciones Activas</p>
                  {activeSR.slice(0, 3).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{enrollment.child_name}</p>
                        <p className="text-xs text-gray-500">
                          Caso: {enrollment.case_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {enrollment.authorized_hours_weekly} hrs/sem
                        </p>
                        <p className="text-xs text-gray-500">
                          {enrollment.rate_type === 'full_time' ? t.children.fullTime :
                           enrollment.rate_type === 'part_time' ? t.children.partTime : t.children.srHourly}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay inscripciones SR activas
                </p>
              )}

              <Link href="/dashboard/programs/school-readiness">
                <GlassButton variant="secondary" className="w-full">
                  Ver Todos los SR
                </GlassButton>
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Alerts Section */}
      {vpkBehindSchedule.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <GlassCardTitle>Alertas de Progreso VPK</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {vpkBehindSchedule.map((summary) => (
                <div
                  key={summary.enrollment_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">{summary.child_name}</p>
                      <p className="text-sm text-amber-700">
                        {summary.hours_attended} de {summary.total_required} horas ({summary.percent_complete}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-900">
                      {summary.hours_remaining} horas restantes
                    </p>
                    <p className="text-xs text-amber-700">
                      {summary.schedule_type === 'school_year' ? t.children.vpkSchoolYear : t.children.vpkSummer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">VPK Requirements</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>School Year:</strong> 540 horas (3 hrs/dia x 36 semanas)<br />
                <strong>Summer:</strong> 300 horas (6 hrs/dia x 10 semanas)
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">School Readiness</h3>
              <p className="text-sm text-gray-600 mt-1">
                Subsidio basado en ingresos familiares y situacion laboral/escolar de los padres.
                Administrado por el ELC local.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
