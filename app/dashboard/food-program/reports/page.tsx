'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import {
  foodProgramService,
  MEAL_TYPES,
  CACFP_RATES,
  type MealType,
  type CACFPReport,
} from '@/features/food-program/services/food-program.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
} from '@/shared/components/ui'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function CACFPReportsPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [reports, setReports] = useState<CACFPReport[]>([])
  const [summary, setSummary] = useState<{
    total_meals_served: number
    meals_by_type: { meal_type: MealType; count: number }[]
    total_children_served: number
    estimated_reimbursement: number
    daily_average: number
    operating_days: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedMonth])

  async function loadData() {
    try {
      setIsLoading(true)
      const [reportsData, summaryData] = await Promise.all([
        foodProgramService.getMonthlyReport(selectedYear, selectedMonth),
        foodProgramService.getCACFPSummary(selectedYear, selectedMonth),
      ])
      setReports(reportsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function navigateMonth(direction: number) {
    let newMonth = selectedMonth + direction
    let newYear = selectedYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  function exportToCSV() {
    if (reports.length === 0) return

    // Create CSV headers
    const headers = [
      'Fecha',
      'Total Niños',
      'Desayuno',
      'Merienda AM',
      'Almuerzo',
      'Merienda PM',
      'Cena',
      'Reembolso Est.'
    ]

    // Create CSV rows
    const rows = reports.map(report => {
      const getMealCount = (type: MealType) => {
        const meal = report.meals_by_type.find(m => m.meal_type === type)
        return meal?.total_served || 0
      }

      return [
        report.report_date,
        report.total_children,
        getMealCount('breakfast'),
        getMealCount('am_snack'),
        getMealCount('lunch'),
        getMealCount('pm_snack'),
        getMealCount('supper'),
        report.reimbursement_estimate.toFixed(2)
      ]
    })

    // Add totals row
    if (summary) {
      const getMealTotal = (type: MealType) => {
        const meal = summary.meals_by_type.find(m => m.meal_type === type)
        return meal?.count || 0
      }

      rows.push([
        'TOTAL',
        summary.total_children_served,
        getMealTotal('breakfast'),
        getMealTotal('am_snack'),
        getMealTotal('lunch'),
        getMealTotal('pm_snack'),
        getMealTotal('supper'),
        summary.estimated_reimbursement.toFixed(2)
      ])
    }

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cacfp_report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        <div className="flex items-center gap-4">
          <Link href="/dashboard/food-program">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              Reportes CACFP
            </h1>
            <p className="text-gray-500">
              USDA Child and Adult Care Food Program
            </p>
          </div>
        </div>

        <GlassButton
          variant="secondary"
          onClick={exportToCSV}
          leftIcon={<Download className="w-4 h-4" />}
          disabled={reports.length === 0}
        >
          Exportar CSV
        </GlassButton>
      </div>

      {/* Month Navigation */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex items-center justify-between">
            <GlassButton variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </GlassButton>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-semibold text-gray-900">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            <GlassButton variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </GlassButton>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <GlassCard variant="clear" className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.operating_days}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Días Operados</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.total_meals_served}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Comidas Servidas</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.total_children_served}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Niños Servidos</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 font-bold text-sm">$</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {formatCurrency(summary.estimated_reimbursement)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Reembolso Est.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Meals by Type Summary */}
      {summary && summary.meals_by_type.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Comidas por Tipo</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {MEAL_TYPES.map(({ value, label }) => {
                const meal = summary.meals_by_type.find(m => m.meal_type === value)
                const count = meal?.count || 0
                const rate = CACFP_RATES[value].free
                const reimbursement = count * rate

                return (
                  <div key={value} className="p-4 rounded-xl bg-gray-50 text-center">
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 my-1">{count}</p>
                    <p className="text-xs text-emerald-600">
                      {formatCurrency(reimbursement)}
                    </p>
                  </div>
                )
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Daily Detail Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Detalle Diario</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay datos para este mes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Fecha</GlassTableHead>
                    <GlassTableHead className="text-center">Niños</GlassTableHead>
                    <GlassTableHead className="text-center">Desayuno</GlassTableHead>
                    <GlassTableHead className="text-center">Mer. AM</GlassTableHead>
                    <GlassTableHead className="text-center">Almuerzo</GlassTableHead>
                    <GlassTableHead className="text-center">Mer. PM</GlassTableHead>
                    <GlassTableHead className="text-center">Cena</GlassTableHead>
                    <GlassTableHead className="text-right">Reembolso</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {reports.map((report) => {
                    const getMealCount = (type: MealType) => {
                      const meal = report.meals_by_type.find(m => m.meal_type === type)
                      return meal?.total_served || 0
                    }

                    return (
                      <GlassTableRow key={report.report_date}>
                        <GlassTableCell className="font-medium">
                          {new Date(report.report_date + 'T12:00:00').toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                          })}
                        </GlassTableCell>
                        <GlassTableCell className="text-center">{report.total_children}</GlassTableCell>
                        <GlassTableCell className="text-center">{getMealCount('breakfast') || '-'}</GlassTableCell>
                        <GlassTableCell className="text-center">{getMealCount('am_snack') || '-'}</GlassTableCell>
                        <GlassTableCell className="text-center">{getMealCount('lunch') || '-'}</GlassTableCell>
                        <GlassTableCell className="text-center">{getMealCount('pm_snack') || '-'}</GlassTableCell>
                        <GlassTableCell className="text-center">{getMealCount('supper') || '-'}</GlassTableCell>
                        <GlassTableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(report.reimbursement_estimate)}
                        </GlassTableCell>
                      </GlassTableRow>
                    )
                  })}

                  {/* Totals Row */}
                  {summary && (
                    <GlassTableRow className="bg-gray-50 font-semibold">
                      <GlassTableCell>TOTAL</GlassTableCell>
                      <GlassTableCell className="text-center">{summary.total_children_served}</GlassTableCell>
                      {MEAL_TYPES.map(({ value }) => {
                        const meal = summary.meals_by_type.find(m => m.meal_type === value)
                        return (
                          <GlassTableCell key={value} className="text-center">
                            {meal?.count || '-'}
                          </GlassTableCell>
                        )
                      })}
                      <GlassTableCell className="text-right text-emerald-600">
                        {formatCurrency(summary.estimated_reimbursement)}
                      </GlassTableCell>
                    </GlassTableRow>
                  )}
                </GlassTableBody>
              </GlassTable>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* CACFP Rates Reference */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Tasas de Reembolso CACFP (Tier Free)</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            {MEAL_TYPES.map(({ value, label }) => (
              <div key={value} className="text-center">
                <p className="text-gray-500">{label}</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(CACFP_RATES[value].free)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            * Tasas basadas en USDA CACFP 2024-2025. Los valores reales pueden variar.
          </p>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
