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
  FileSpreadsheet,
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
import { billingService } from '@/features/billing/services/billing.service'
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  formatCurrency,
  formatDate,
  formatPercentage,
  ReportData
} from '@/shared/utils/report-export'

interface ReportType {
  id: string
  icon: typeof ClipboardCheck
  color: string
  titleKey: 'attendanceReport' | 'financialReport' | 'enrollmentReport' | 'ratioReport' | 'staffReport' | 'incidentsReport'
  descriptionKey: 'attendanceReportDesc' | 'financialReportDesc' | 'enrollmentReportDesc' | 'ratioReportDesc' | 'incidentsReportDesc' | 'staffReportDesc'
  formats: ('PDF' | 'Excel')[]
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
    formats: ['PDF', 'Excel'],
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
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
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

  // Report generation functions
  const generateAttendanceReport = async (): Promise<ReportData> => {
    // Get today's attendance records as a starting point
    const today = new Date().toISOString().split('T')[0]
    const records = await attendanceService.getByDate(today)
    const rows = records.slice(0, 100).map((record: { child?: { first_name: string; last_name: string } | null; date: string; check_in_time: string | null; check_out_time: string | null; status: string | null; notes: string | null }) => ({
      child: record.child ? `${record.child.first_name} ${record.child.last_name}` : '-',
      date: formatDate(record.date),
      checkIn: record.check_in_time || '-',
      checkOut: record.check_out_time || '-',
      status: record.status || 'unknown',
      notes: record.notes || '-',
    }))

    const stats = await attendanceService.getStats()

    return {
      title: 'Reporte de Asistencia',
      subtitle: `Período: ${selectedPeriod}`,
      generatedAt: new Date(),
      columns: [
        { header: 'Niño', key: 'child', width: 20 },
        { header: 'Fecha', key: 'date', width: 12 },
        { header: 'Entrada', key: 'checkIn', width: 10 },
        { header: 'Salida', key: 'checkOut', width: 10 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Notas', key: 'notes', width: 25 },
      ],
      rows,
      summary: {
        'Total Registros': rows.length,
        'Presentes': stats.present,
        'Ausentes': stats.absent,
        'Tardanzas': stats.late,
        'Tasa Asistencia': formatPercentage(stats.present > 0 ? (stats.present / (stats.present + stats.absent)) * 100 : 0),
      }
    }
  }

  const generateFinancialReport = async (): Promise<ReportData> => {
    const invoices = await billingService.getInvoices()
    const rows = invoices.map((inv: { invoice_number: string; family?: { primary_contact_name: string } | null; total: number; amount_paid: number | null; status: string | null; due_date: string }) => ({
      number: inv.invoice_number || '-',
      family: inv.family?.primary_contact_name || '-',
      amount: formatCurrency(inv.total),
      paid: formatCurrency(inv.amount_paid || 0),
      balance: formatCurrency(inv.total - (inv.amount_paid || 0)),
      status: inv.status || '-',
      dueDate: formatDate(inv.due_date),
    }))

    const totalAmount = invoices.reduce((sum: number, inv: { total: number }) => sum + inv.total, 0)
    const totalPaid = invoices.reduce((sum: number, inv: { amount_paid: number | null }) => sum + (inv.amount_paid || 0), 0)

    return {
      title: 'Reporte Financiero',
      subtitle: `Período: ${selectedPeriod}`,
      generatedAt: new Date(),
      columns: [
        { header: '# Factura', key: 'number', width: 15 },
        { header: 'Familia', key: 'family', width: 20 },
        { header: 'Total', key: 'amount', width: 12 },
        { header: 'Pagado', key: 'paid', width: 12 },
        { header: 'Balance', key: 'balance', width: 12 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Vencimiento', key: 'dueDate', width: 12 },
      ],
      rows,
      summary: {
        'Total Facturas': rows.length,
        'Monto Total': formatCurrency(totalAmount),
        'Total Cobrado': formatCurrency(totalPaid),
        'Por Cobrar': formatCurrency(totalAmount - totalPaid),
        'Tasa Cobro': formatPercentage(totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0),
      }
    }
  }

  const generateEnrollmentReport = async (): Promise<ReportData> => {
    const children = await childrenService.getAll()
    const rows = children.map(child => {
      const birthDate = child.date_of_birth ? new Date(child.date_of_birth) : null
      const age = birthDate
        ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : '-'

      // Get classroom name from nested object if available
      const classroomData = child.classroom as { name?: string } | null | undefined
      const classroomName = classroomData?.name || '-'

      // Get guardian name from nested object if available
      const familyData = child.family as { primary_contact_name?: string } | null | undefined
      const guardianName = familyData?.primary_contact_name || '-'

      return {
        name: `${child.first_name} ${child.last_name}`,
        age: age,
        classroom: classroomName,
        status: child.status,
        enrollDate: formatDate(child.created_at || new Date().toISOString()),
        guardian: guardianName,
      }
    })

    const active = rows.filter(r => r.status === 'active').length

    return {
      title: 'Reporte de Inscripciones',
      subtitle: `Total: ${rows.length} niños`,
      generatedAt: new Date(),
      columns: [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Edad', key: 'age', width: 8 },
        { header: 'Salón', key: 'classroom', width: 15 },
        { header: 'Estado', key: 'status', width: 10 },
        { header: 'Inscripción', key: 'enrollDate', width: 12 },
        { header: 'Tutor', key: 'guardian', width: 20 },
      ],
      rows,
      summary: {
        'Total Inscritos': rows.length,
        'Activos': active,
        'Inactivos': rows.length - active,
        'Tasa Retención': formatPercentage(rows.length > 0 ? (active / rows.length) * 100 : 0),
      }
    }
  }

  const generateRatiosReport = async (): Promise<ReportData> => {
    const classrooms = await classroomsService.getWithStats()

    const dcfRatios: Record<string, number> = {
      infant: 4,
      toddler: 6,
      twos: 11,
      threes: 15,
      fours: 20,
      school_age: 25,
    }

    const rows = classrooms.map(classroom => {
      const maxRatio = dcfRatios[classroom.age_group || 'threes'] || 15
      const currentRatio = classroom.current_ratio || 0
      const compliant = currentRatio <= maxRatio || classroom.staff_count === 0

      return {
        classroom: classroom.name,
        ageGroup: classroom.age_group || '-',
        children: classroom.children_count || 0,
        staff: classroom.staff_count || 0,
        currentRatio: currentRatio.toFixed(1),
        maxRatio: maxRatio,
        status: compliant ? 'Cumple' : 'No Cumple',
      }
    })

    const compliant = rows.filter(r => r.status === 'Cumple').length

    return {
      title: 'Reporte de Ratios DCF',
      subtitle: 'Cumplimiento de ratios de Florida DCF',
      generatedAt: new Date(),
      columns: [
        { header: 'Salón', key: 'classroom', width: 18 },
        { header: 'Grupo Edad', key: 'ageGroup', width: 12 },
        { header: 'Niños', key: 'children', width: 8 },
        { header: 'Staff', key: 'staff', width: 8 },
        { header: 'Ratio Actual', key: 'currentRatio', width: 12 },
        { header: 'Ratio Máx', key: 'maxRatio', width: 10 },
        { header: 'Estado', key: 'status', width: 12 },
      ],
      rows,
      summary: {
        'Total Salones': rows.length,
        'Cumplen': compliant,
        'No Cumplen': rows.length - compliant,
        'Tasa Cumplimiento': formatPercentage(rows.length > 0 ? (compliant / rows.length) * 100 : 100),
      }
    }
  }

  const generateIncidentsReport = async (): Promise<ReportData> => {
    const incidents = await incidentsService.getAll()
    const rows = incidents.map(inc => {
      // Get child name from nested child object
      const childData = inc.child as { first_name?: string; last_name?: string } | null | undefined
      const childName = childData ? `${childData.first_name || ''} ${childData.last_name || ''}`.trim() : '-'

      return {
        date: formatDate(inc.occurred_at || new Date().toISOString()),
        child: childName,
        type: inc.incident_type || '-',
        severity: inc.severity || 'low',
        status: inc.status,
        description: (inc.description || '-').substring(0, 50) + '...',
      }
    })

    const stats = await incidentsService.getStats()

    return {
      title: 'Reporte de Incidentes',
      subtitle: `Total: ${rows.length} incidentes`,
      generatedAt: new Date(),
      columns: [
        { header: 'Fecha', key: 'date', width: 12 },
        { header: 'Niño', key: 'child', width: 18 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Severidad', key: 'severity', width: 12 },
        { header: 'Estado', key: 'status', width: 10 },
        { header: 'Descripción', key: 'description', width: 30 },
      ],
      rows,
      summary: {
        'Total Incidentes': rows.length,
        'Abiertos': stats.open,
        'Resueltos': stats.resolved,
        'Severidad Alta': rows.filter(r => r.severity === 'high').length,
      }
    }
  }

  const generateStaffReport = async (): Promise<ReportData> => {
    const staff = await staffService.getAll()
    const rows = staff.map(s => {
      // Get classroom name from nested classroom object if available
      const classroomData = (s as { classroom?: { name?: string } | null }).classroom
      const classroomName = classroomData?.name || '-'

      return {
        name: `${s.first_name} ${s.last_name}`,
        email: s.email || '-',
        role: s.role || '-',
        classroom: classroomName,
        status: s.status || 'active',
        hireDate: formatDate(s.created_at || new Date().toISOString()),
      }
    })

    const active = rows.filter(r => r.status === 'active').length

    return {
      title: 'Reporte de Personal',
      subtitle: `Total: ${rows.length} empleados`,
      generatedAt: new Date(),
      columns: [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Rol', key: 'role', width: 15 },
        { header: 'Salón', key: 'classroom', width: 15 },
        { header: 'Estado', key: 'status', width: 10 },
        { header: 'Contratación', key: 'hireDate', width: 12 },
      ],
      rows,
      summary: {
        'Total Personal': rows.length,
        'Activos': active,
        'Inactivos': rows.length - active,
      }
    }
  }

  async function handleDownload(reportId: string, format: string) {
    setIsGenerating(reportId + format)

    try {
      let reportData: ReportData

      switch (reportId) {
        case 'attendance':
          reportData = await generateAttendanceReport()
          break
        case 'financial':
          reportData = await generateFinancialReport()
          break
        case 'enrollment':
          reportData = await generateEnrollmentReport()
          break
        case 'ratios':
          reportData = await generateRatiosReport()
          break
        case 'incidents':
          reportData = await generateIncidentsReport()
          break
        case 'staff':
          reportData = await generateStaffReport()
          break
        default:
          throw new Error('Tipo de reporte no válido')
      }

      const filename = `${reportId}_report_${new Date().toISOString().split('T')[0]}`

      // Export based on format
      if (format === 'Excel') {
        exportToExcel(reportData, filename)
      } else {
        exportToPDF(reportData, filename)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte. Por favor intente de nuevo.')
    } finally {
      setIsGenerating(null)
    }
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
                          disabled={isGenerating === report.id + format}
                        >
                          {isGenerating === report.id + format ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : format === 'Excel' ? (
                            <FileSpreadsheet className="w-3 h-3 mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
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
