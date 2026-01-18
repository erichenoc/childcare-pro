'use client'

import { useState } from 'react'
import {
  BarChart3, Download, Calendar, TrendingUp, Users,
  Building2, DollarSign, Baby, FileText
} from 'lucide-react'

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
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

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true)
    setSelectedReport(reportId)

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsGenerating(false)
    alert(`Reporte "${REPORT_TYPES.find(r => r.id === reportId)?.name}" generado exitosamente.`)
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
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={isGenerating && selectedReport === report.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isGenerating && selectedReport === report.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Generar
                    </>
                  )}
                </button>
                <button
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                  title="Descargar último reporte"
                >
                  <Download className="w-4 h-4" />
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
              <p className="text-3xl font-bold text-gray-900">$0</p>
              <p className="text-sm text-gray-500 mt-1">MRR Actual</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-1">Organizaciones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-1">Usuarios Activos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">0%</p>
              <p className="text-sm text-gray-500 mt-1">Crecimiento Mensual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
