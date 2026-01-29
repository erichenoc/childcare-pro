'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Users,
  Utensils,
  GraduationCap,
  Sun,
  Calendar,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassSelect,
} from '@/shared/components/ui'
import {
  programIncomeService,
  type MonthlyIncomeBreakdown,
  type CACFPMonthlyReport,
  type SummerCampWeek,
  CACFP_REIMBURSEMENT_RATES,
} from '@/features/accounting/services/program-income.service'

export default function ProgramIncomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [incomeBreakdown, setIncomeBreakdown] = useState<MonthlyIncomeBreakdown | null>(null)
  const [cacfpReport, setCacfpReport] = useState<CACFPMonthlyReport | null>(null)
  const [summerWeeks, setSummerWeeks] = useState<SummerCampWeek[]>([])

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState({
    tuition: true,
    cacfp: true,
    sr: true,
    summerCamp: false,
  })

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedMonth])

  async function loadData() {
    setIsLoading(true)
    try {
      const [breakdown, cacfp, weeks] = await Promise.all([
        programIncomeService.getMonthlyIncomeBreakdown(selectedYear, selectedMonth),
        programIncomeService.calculateCACFPMonthlyReimbursement(selectedYear, selectedMonth),
        programIncomeService.getSummerCampWeeks(selectedYear),
      ])
      setIncomeBreakdown(breakdown)
      setCacfpReport(cacfp)
      setSummerWeeks(weeks)
    } catch (error) {
      console.error('Error loading program income data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ]

  const years = [2024, 2025, 2026, 2027]

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
        <div className="flex items-center gap-3">
          <Link href="/dashboard/accounting">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingresos por Programa</h1>
            <p className="text-gray-500">
              Cálculo detallado de ingresos por cada programa
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={months.map(m => ({ value: String(m.value), label: m.label }))}
            className="w-36"
          />
          <GlassSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={years.map(y => ({ value: String(y), label: String(y) }))}
            className="w-28"
          />
        </div>
      </div>

      {/* Grand Total Summary */}
      <GlassCard variant="primary" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <GlassCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Ingresos Proyectados</p>
              <p className="text-4xl font-bold mt-1">
                {formatCurrency(incomeBreakdown?.grand_total || 0)}
              </p>
              <p className="text-emerald-100 text-sm mt-2">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Income Source Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(incomeBreakdown?.fixed_tuition.total || 0)}
              </p>
              <p className="text-xs text-gray-500">Tuition Fijo</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(incomeBreakdown?.cacfp.total || 0)}
              </p>
              <p className="text-xs text-gray-500">CACFP</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(incomeBreakdown?.school_readiness.total || 0)}
              </p>
              <p className="text-xs text-gray-500">School Readiness</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Sun className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(incomeBreakdown?.summer_camp.total || 0)}
              </p>
              <p className="text-xs text-gray-500">Summer Camp</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Fixed Tuition Section */}
      <GlassCard>
        <GlassCardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('tuition')}
        >
          <div className="flex items-center justify-between w-full">
            <GlassCardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Tuition Fijo Mensual
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({incomeBreakdown?.fixed_tuition.children_count || 0} niños)
              </span>
            </GlassCardTitle>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(incomeBreakdown?.fixed_tuition.total || 0)}
              </span>
              {expandedSections.tuition ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </GlassCardHeader>
        {expandedSections.tuition && (
          <GlassCardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Ingresos fijos calculados basado en la tarifa semanal de cada niño × 4.33 semanas promedio por mes.
              </p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Tipo de Programa</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Niños</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeBreakdown?.fixed_tuition.by_program.map((program, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900 capitalize">{program.program.replace('_', ' ')}</td>
                      <td className="py-3 text-right text-gray-600">{program.count}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(program.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCardContent>
        )}
      </GlassCard>

      {/* CACFP Section */}
      <GlassCard>
        <GlassCardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('cacfp')}
        >
          <div className="flex items-center justify-between w-full">
            <GlassCardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              CACFP Food Program
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({cacfpReport?.days_open || 0} días operados)
              </span>
            </GlassCardTitle>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(cacfpReport?.total_reimbursement || 0)}
              </span>
              {expandedSections.cacfp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </GlassCardHeader>
        {expandedSections.cacfp && (
          <GlassCardContent>
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Nota:</strong> El reembolso CACFP se calcula basado en los conteos diarios de comidas servidas.
                  Tasas actuales: Tier I (zonas de bajos ingresos).
                </p>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Comida</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Total Servido</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Tasa/Unidad</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Reembolso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">Desayuno</td>
                    <td className="py-3 text-right text-gray-600">{cacfpReport?.total_breakfast || 0}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(CACFP_REIMBURSEMENT_RATES.tier1.breakfast)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(cacfpReport?.reimbursement_breakfast || 0)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">Merienda AM</td>
                    <td className="py-3 text-right text-gray-600">{cacfpReport?.total_am_snack || 0}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(CACFP_REIMBURSEMENT_RATES.tier1.am_snack)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(cacfpReport?.reimbursement_am_snack || 0)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">Almuerzo</td>
                    <td className="py-3 text-right text-gray-600">{cacfpReport?.total_lunch || 0}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(CACFP_REIMBURSEMENT_RATES.tier1.lunch)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(cacfpReport?.reimbursement_lunch || 0)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">Merienda PM</td>
                    <td className="py-3 text-right text-gray-600">{cacfpReport?.total_pm_snack || 0}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(CACFP_REIMBURSEMENT_RATES.tier1.pm_snack)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(cacfpReport?.reimbursement_pm_snack || 0)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">Cena</td>
                    <td className="py-3 text-right text-gray-600">{cacfpReport?.total_supper || 0}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(CACFP_REIMBURSEMENT_RATES.tier1.supper)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(cacfpReport?.reimbursement_supper || 0)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-orange-50">
                    <td className="py-3 font-semibold text-gray-900">Total</td>
                    <td className="py-3 text-right font-medium text-gray-600">
                      {(cacfpReport?.total_breakfast || 0) + (cacfpReport?.total_am_snack || 0) +
                       (cacfpReport?.total_lunch || 0) + (cacfpReport?.total_pm_snack || 0) +
                       (cacfpReport?.total_supper || 0)} comidas
                    </td>
                    <td></td>
                    <td className="py-3 text-right font-bold text-orange-600">{formatCurrency(cacfpReport?.total_reimbursement || 0)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Promedio Diario de Asistencia:</strong> {cacfpReport?.average_daily_attendance || 0} niños
                </p>
              </div>
            </div>
          </GlassCardContent>
        )}
      </GlassCard>

      {/* School Readiness Section */}
      <GlassCard>
        <GlassCardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('sr')}
        >
          <div className="flex items-center justify-between w-full">
            <GlassCardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              School Readiness
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({incomeBreakdown?.school_readiness.children_count || 0} niños)
              </span>
            </GlassCardTitle>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(incomeBreakdown?.school_readiness.total || 0)}
              </span>
              {expandedSections.sr ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </GlassCardHeader>
        {expandedSections.sr && (
          <GlassCardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800">
                  <strong>Lógica SR:</strong> Los niños after-school se facturan a tarifa regular durante el año escolar.
                  Durante vacaciones (Navidad, Spring Break, Verano), se facturan a tarifa full-time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Facturación Regular</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(incomeBreakdown?.school_readiness.regular_billing || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Período escolar normal</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Facturación Vacaciones</p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(incomeBreakdown?.school_readiness.holiday_billing || 0)}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Full-time durante breaks</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Períodos de Facturación Full-Time:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Christmas Break: Dic 20 - Ene 5</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Spring Break: Mar 15 - Mar 22</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Verano: Jun 1 - Ago 10</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCardContent>
        )}
      </GlassCard>

      {/* Summer Camp Section */}
      <GlassCard>
        <GlassCardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('summerCamp')}
        >
          <div className="flex items-center justify-between w-full">
            <GlassCardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-600" />
              Summer Camp
              <span className="ml-2 text-sm font-normal text-gray-500">
                (10 semanas)
              </span>
            </GlassCardTitle>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-yellow-600">
                {formatCurrency(incomeBreakdown?.summer_camp.total || 0)}
              </span>
              {expandedSections.summerCamp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </GlassCardHeader>
        {expandedSections.summerCamp && (
          <GlassCardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Summer Camp:</strong> Programa de 10 semanas (Junio - Agosto) con actividades temáticas diarias.
                  Los niños pueden inscribirse por semana individual o el verano completo.
                </p>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Semana</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Tema</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-500">Fechas</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Inscritos</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Tarifa</th>
                  </tr>
                </thead>
                <tbody>
                  {summerWeeks.map((week) => (
                    <tr key={week.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">Semana {week.week_number}</td>
                      <td className="py-3 text-gray-700">{week.theme}</td>
                      <td className="py-3 text-center text-gray-600 text-sm">
                        {new Date(week.start_date).toLocaleDateString('es-US', { month: 'short', day: 'numeric' })} -
                        {new Date(week.end_date).toLocaleDateString('es-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          week.current_enrollment >= week.max_capacity * 0.9
                            ? 'bg-red-100 text-red-700'
                            : week.current_enrollment >= week.max_capacity * 0.7
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {week.current_enrollment}/{week.max_capacity}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(week.weekly_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex gap-4 mt-4">
                <Link href="/dashboard/accounting/summer-camp">
                  <GlassButton variant="primary">
                    <Sun className="w-4 h-4 mr-2" />
                    Gestionar Summer Camp
                  </GlassButton>
                </Link>
              </div>
            </div>
          </GlassCardContent>
        )}
      </GlassCard>
    </div>
  )
}
