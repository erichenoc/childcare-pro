'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3, Download, Calendar, TrendingUp, Users,
  Building2, DollarSign, Baby, FileText, FileSpreadsheet
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
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
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface Stats {
  mrr: number
  organizations: number
  activeUsers: number
  monthlyGrowth: number
  totalChildren: number
  activeOrgs: number
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'revenue',
    name: 'Reporte de Ingresos',
    description: 'MRR, ARR, crecimiento mensual y proyecciones',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'organizations',
    name: 'Reporte de Organizaciones',
    description: 'Nuevas organizaciones, churn rate, retención',
    icon: Building2,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'users',
    name: 'Reporte de Usuarios',
    description: 'Usuarios activos, engagement, actividad por rol',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'children',
    name: 'Reporte de Niños',
    description: 'Total de niños, distribución por edad, asistencia',
    icon: Baby,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'growth',
    name: 'Reporte de Crecimiento',
    description: 'Métricas de crecimiento, conversión, funnel',
    icon: TrendingUp,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'compliance',
    name: 'Reporte de Cumplimiento',
    description: 'Ratios DCF, alertas, historial de cumplimiento',
    icon: FileText,
    color: 'bg-red-100 text-red-600',
  },
]

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 49,
  professional: 99,
  enterprise: 199,
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel')
  const [stats, setStats] = useState<Stats>({
    mrr: 0,
    organizations: 0,
    activeUsers: 0,
    monthlyGrowth: 0,
    totalChildren: 0,
    activeOrgs: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, status, plan_type, created_at')

      const orgList = orgs || []
      const activeOrgs = orgList.filter(o => o.status?.toLowerCase() === 'active')

      // Calculate MRR
      const mrr = activeOrgs.reduce((sum, org) => {
        return sum + (PLAN_PRICES[org.plan_type || 'free'] || 0)
      }, 0)

      // Fetch users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch children
      const { count: childCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })

      // Calculate growth (compare to last month)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const lastMonthOrgs = orgList.filter(o =>
        new Date(o.created_at) < lastMonth
      ).length
      const growth = lastMonthOrgs > 0
        ? ((orgList.length - lastMonthOrgs) / lastMonthOrgs) * 100
        : 0

      setStats({
        mrr,
        organizations: orgList.length,
        activeUsers: userCount || 0,
        monthlyGrowth: growth,
        totalChildren: childCount || 0,
        activeOrgs: activeOrgs.length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const generateRevenueReport = async (): Promise<ReportData> => {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')
      .order('created_at', { ascending: false })

    const rows = (orgs || []).map(org => ({
      name: org.name,
      plan: org.plan_type || 'free',
      status: org.status,
      price: PLAN_PRICES[org.plan_type || 'free'],
      created: formatDate(org.created_at),
    }))

    const totalMRR = rows.reduce((sum, r) => sum + (r.status === 'active' ? r.price : 0), 0)

    return {
      title: 'Reporte de Ingresos',
      subtitle: `Período: ${dateRange.start} a ${dateRange.end}`,
      generatedAt: new Date(),
      columns: [
        { header: 'Organización', key: 'name', width: 25 },
        { header: 'Plan', key: 'plan', width: 15 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Precio Mensual', key: 'price', width: 15 },
        { header: 'Fecha Registro', key: 'created', width: 15 },
      ],
      rows,
      summary: {
        'Total Organizaciones': rows.length,
        'MRR Total': formatCurrency(totalMRR),
        'ARR Proyectado': formatCurrency(totalMRR * 12),
      }
    }
  }

  const generateOrganizationsReport = async (): Promise<ReportData> => {
    const { data: orgs } = await supabase
      .from('organizations')
      .select(`
        *,
        children:children(count),
        staff:profiles(count)
      `)
      .order('created_at', { ascending: false })

    const rows = (orgs || []).map(org => ({
      name: org.name,
      email: org.email || '-',
      city: org.city || '-',
      status: org.status,
      plan: org.plan_type || 'free',
      children: org.children?.[0]?.count || 0,
      staff: org.staff?.[0]?.count || 0,
      created: formatDate(org.created_at),
    }))

    const activeCount = rows.filter(r => r.status === 'active').length
    const trialCount = rows.filter(r => r.status === 'trial').length

    return {
      title: 'Reporte de Organizaciones',
      subtitle: `Total: ${rows.length} organizaciones`,
      generatedAt: new Date(),
      columns: [
        { header: 'Nombre', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Ciudad', key: 'city', width: 15 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Plan', key: 'plan', width: 12 },
        { header: 'Niños', key: 'children', width: 10 },
        { header: 'Staff', key: 'staff', width: 10 },
        { header: 'Registro', key: 'created', width: 12 },
      ],
      rows,
      summary: {
        'Total Organizaciones': rows.length,
        'Activas': activeCount,
        'En Trial': trialCount,
        'Tasa de Activación': formatPercentage((activeCount / rows.length) * 100 || 0),
      }
    }
  }

  const generateUsersReport = async (): Promise<ReportData> => {
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false })

    const rows = (users || []).map(user => ({
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-',
      email: user.email || '-',
      role: user.role || '-',
      organization: user.organization?.name || '-',
      created: formatDate(user.created_at),
    }))

    const roleCount: Record<string, number> = {}
    rows.forEach(r => {
      roleCount[r.role] = (roleCount[r.role] || 0) + 1
    })

    return {
      title: 'Reporte de Usuarios',
      subtitle: `Total: ${rows.length} usuarios`,
      generatedAt: new Date(),
      columns: [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Rol', key: 'role', width: 12 },
        { header: 'Organización', key: 'organization', width: 25 },
        { header: 'Registro', key: 'created', width: 12 },
      ],
      rows,
      summary: {
        'Total Usuarios': rows.length,
        ...Object.fromEntries(Object.entries(roleCount).map(([k, v]) => [`Rol ${k}`, v]))
      }
    }
  }

  const generateChildrenReport = async (): Promise<ReportData> => {
    const { data: children } = await supabase
      .from('children')
      .select(`
        *,
        organization:organizations(name),
        classroom:classrooms(name)
      `)
      .order('created_at', { ascending: false })

    const rows = (children || []).map(child => {
      const birthDate = child.date_of_birth ? new Date(child.date_of_birth) : null
      const age = birthDate
        ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : '-'

      return {
        name: `${child.first_name || ''} ${child.last_name || ''}`.trim() || '-',
        age: age,
        organization: child.organization?.name || '-',
        classroom: child.classroom?.name || '-',
        status: child.status || 'active',
        enrolled: formatDate(child.created_at),
      }
    })

    return {
      title: 'Reporte de Niños',
      subtitle: `Total: ${rows.length} niños registrados`,
      generatedAt: new Date(),
      columns: [
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Edad', key: 'age', width: 8 },
        { header: 'Organización', key: 'organization', width: 25 },
        { header: 'Salón', key: 'classroom', width: 15 },
        { header: 'Estado', key: 'status', width: 10 },
        { header: 'Inscripción', key: 'enrolled', width: 12 },
      ],
      rows,
      summary: {
        'Total Niños': rows.length,
        'Activos': rows.filter(r => r.status === 'active').length,
      }
    }
  }

  const generateGrowthReport = async (): Promise<ReportData> => {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('created_at, status, plan_type')
      .order('created_at', { ascending: true })

    // Group by month
    const monthlyData: Record<string, { new: number; total: number; mrr: number }> = {}
    let runningTotal = 0

    ;(orgs || []).forEach(org => {
      const month = org.created_at.substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { new: 0, total: 0, mrr: 0 }
      }
      monthlyData[month].new++
      runningTotal++
      monthlyData[month].total = runningTotal
      if (org.status === 'active') {
        monthlyData[month].mrr += PLAN_PRICES[org.plan_type || 'free'] || 0
      }
    })

    const rows = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      newOrgs: data.new,
      totalOrgs: data.total,
      mrr: formatCurrency(data.mrr),
    }))

    return {
      title: 'Reporte de Crecimiento',
      subtitle: 'Métricas de crecimiento mensual',
      generatedAt: new Date(),
      columns: [
        { header: 'Mes', key: 'month', width: 12 },
        { header: 'Nuevas Orgs', key: 'newOrgs', width: 12 },
        { header: 'Total Acumulado', key: 'totalOrgs', width: 15 },
        { header: 'MRR', key: 'mrr', width: 15 },
      ],
      rows,
      summary: {
        'Total Meses': rows.length,
        'Crecimiento Promedio': rows.length > 0 ? Math.round(runningTotal / rows.length) + ' orgs/mes' : '0',
      }
    }
  }

  const generateComplianceReport = async (): Promise<ReportData> => {
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select(`
        *,
        organization:organizations(name)
      `)

    const rows = (classrooms || []).map(classroom => {
      const ratio = classroom.current_children && classroom.current_staff
        ? (classroom.current_children / classroom.current_staff).toFixed(1)
        : '-'
      const maxRatio = classroom.max_ratio || 10
      const compliant = classroom.current_children && classroom.current_staff
        ? (classroom.current_children / classroom.current_staff) <= maxRatio
        : true

      return {
        organization: classroom.organization?.name || '-',
        classroom: classroom.name,
        ageGroup: classroom.age_group || '-',
        children: classroom.current_children || 0,
        staff: classroom.current_staff || 0,
        ratio,
        maxRatio,
        status: compliant ? 'Cumple' : 'No Cumple',
      }
    })

    const compliantCount = rows.filter(r => r.status === 'Cumple').length

    return {
      title: 'Reporte de Cumplimiento DCF',
      subtitle: 'Ratios y cumplimiento regulatorio',
      generatedAt: new Date(),
      columns: [
        { header: 'Organización', key: 'organization', width: 25 },
        { header: 'Salón', key: 'classroom', width: 15 },
        { header: 'Grupo Edad', key: 'ageGroup', width: 12 },
        { header: 'Niños', key: 'children', width: 8 },
        { header: 'Staff', key: 'staff', width: 8 },
        { header: 'Ratio', key: 'ratio', width: 8 },
        { header: 'Max Ratio', key: 'maxRatio', width: 10 },
        { header: 'Estado', key: 'status', width: 12 },
      ],
      rows,
      summary: {
        'Total Salones': rows.length,
        'Cumplen': compliantCount,
        'No Cumplen': rows.length - compliantCount,
        'Tasa Cumplimiento': formatPercentage((compliantCount / rows.length) * 100 || 100),
      }
    }
  }

  const handleGenerateReport = async (reportId: string, format: 'excel' | 'csv' | 'pdf') => {
    setIsGenerating(true)
    setSelectedReport(reportId)

    try {
      let reportData: ReportData

      switch (reportId) {
        case 'revenue':
          reportData = await generateRevenueReport()
          break
        case 'organizations':
          reportData = await generateOrganizationsReport()
          break
        case 'users':
          reportData = await generateUsersReport()
          break
        case 'children':
          reportData = await generateChildrenReport()
          break
        case 'growth':
          reportData = await generateGrowthReport()
          break
        case 'compliance':
          reportData = await generateComplianceReport()
          break
        default:
          throw new Error('Tipo de reporte no válido')
      }

      const filename = `${reportId}_report_${new Date().toISOString().split('T')[0]}`

      // Export based on format
      switch (format) {
        case 'excel':
          exportToExcel(reportData, filename)
          break
        case 'csv':
          exportToCSV(reportData, filename)
          break
        case 'pdf':
          exportToPDF(reportData, filename)
          break
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte. Por favor intente de nuevo.')
    } finally {
      setIsGenerating(false)
      setSelectedReport(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Reportes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Genera y descarga reportes del sistema
            </p>
          </div>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Rango de fechas:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">a</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleGenerateReport(report.id, 'excel')}
                  disabled={isGenerating && selectedReport === report.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
                  title="Descargar Excel"
                >
                  {isGenerating && selectedReport === report.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleGenerateReport(report.id, 'csv')}
                  disabled={isGenerating && selectedReport === report.id}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                  title="Descargar CSV"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleGenerateReport(report.id, 'pdf')}
                  disabled={isGenerating && selectedReport === report.id}
                  className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
                  title="Descargar PDF"
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen Rápido</h2>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.mrr)}</p>
              <p className="text-sm text-gray-500 mt-1">MRR Actual</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.organizations}</p>
              <p className="text-sm text-gray-500 mt-1">Organizaciones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-sm text-gray-500 mt-1">Usuarios Activos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{formatPercentage(stats.monthlyGrowth)}</p>
              <p className="text-sm text-gray-500 mt-1">Crecimiento Mensual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
