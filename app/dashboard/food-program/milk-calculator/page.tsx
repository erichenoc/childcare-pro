'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Milk,
  Users,
  Calendar,
  Loader2,
  AlertTriangle,
  Baby,
  Calculator,
  TrendingUp,
  ShoppingCart,
  Info,
  RefreshCw,
  Download,
} from 'lucide-react'
import {
  milkCalculatorService,
  MILK_REQUIREMENTS,
  type ChildMilkRequirement,
  type WeeklyMilkForecast,
} from '@/features/food-program/services/milk-calculator.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
} from '@/shared/components/ui'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getMilkTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    whole: 'Entera',
    '2%': '2%',
    skim: 'Descremada',
    lactose_free: 'Sin Lactosa',
    formula: 'Fórmula',
  }
  return labels[type] || type
}

function getMilkTypeColor(type: string): string {
  const colors: Record<string, string> = {
    whole: 'bg-yellow-100 text-yellow-800',
    '2%': 'bg-blue-100 text-blue-800',
    skim: 'bg-cyan-100 text-cyan-800',
    lactose_free: 'bg-purple-100 text-purple-800',
    formula: 'bg-pink-100 text-pink-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

export default function MilkCalculatorPage() {
  const [requirements, setRequirements] = useState<ChildMilkRequirement[]>([])
  const [forecast, setForecast] = useState<WeeklyMilkForecast | null>(null)
  const [ageGroupSummary, setAgeGroupSummary] = useState<{
    age_group: keyof typeof MILK_REQUIREMENTS
    age_group_label: string
    children_count: number
    milk_type: string
    oz_per_meal: number
    total_daily_oz: number
    notes: string
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'summary' | 'children' | 'forecast'>('summary')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [childReqs, weeklyForecast, ageGroups] = await Promise.all([
        milkCalculatorService.calculateChildrenMilkRequirements(),
        milkCalculatorService.generateWeeklyForecast(getMonday(new Date()).toISOString().split('T')[0]),
        milkCalculatorService.getMilkRequirementsByAgeGroup(),
      ])
      setRequirements(childReqs)
      setForecast(weeklyForecast)
      setAgeGroupSummary(ageGroups)
    } catch (error) {
      console.error('Error loading milk data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function exportShoppingList() {
    if (!forecast) return

    const lines = [
      'LISTA DE COMPRAS DE LECHE - SEMANAL',
      '=====================================',
      `Semana: ${forecast.week_start} al ${forecast.week_end}`,
      `Niños: ${forecast.children_count}`,
      '',
      'CANTIDADES NECESARIAS:',
    ]

    forecast.by_milk_type.forEach(item => {
      lines.push(`  - Leche ${getMilkTypeLabel(item.milk_type)}: ${item.gallons.toFixed(1)} galones (${formatCurrency(item.estimated_cost)})`)
    })

    lines.push('')
    lines.push(`TOTAL: ${forecast.total_gallons.toFixed(1)} galones`)
    lines.push(`COSTO ESTIMADO: ${formatCurrency(forecast.estimated_total_cost)}`)
    lines.push('')
    lines.push('NOTAS:')
    forecast.notes.forEach(note => lines.push(`  * ${note}`))

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista-leche-${forecast.week_start}.txt`
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

  const childrenWithAllergies = requirements.filter(r => r.has_milk_allergy)
  const childrenWithMilk = requirements.filter(r => !r.has_milk_allergy)

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
              <Milk className="w-6 h-6 text-blue-600" />
              Calculadora de Leche
            </h1>
            <p className="text-gray-500">
              Requisitos USDA/CACFP por edad
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <GlassButton variant="secondary" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </GlassButton>
          <GlassButton variant="primary" onClick={exportShoppingList} disabled={!forecast}>
            <Download className="w-4 h-4 mr-2" />
            Lista de Compras
          </GlassButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requirements.length}</p>
              <p className="text-sm text-gray-500">Niños Activos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Milk className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {forecast?.total_gallons.toFixed(1) || 0}
              </p>
              <p className="text-sm text-gray-500">Galones/Semana</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 font-bold">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(forecast?.estimated_total_cost || 0)}
              </p>
              <p className="text-sm text-gray-500">Costo/Semana</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{childrenWithAllergies.length}</p>
              <p className="text-sm text-gray-500">Alergias a Leche</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('summary')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            selectedTab === 'summary'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator className="w-4 h-4 inline mr-2" />
          Por Edad
        </button>
        <button
          onClick={() => setSelectedTab('children')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            selectedTab === 'children'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Baby className="w-4 h-4 inline mr-2" />
          Por Niño
        </button>
        <button
          onClick={() => setSelectedTab('forecast')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            selectedTab === 'forecast'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          Pronóstico
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'summary' && (
        <div className="space-y-6">
          {/* Age Group Summary */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Requisitos por Grupo de Edad</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {ageGroupSummary.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay niños registrados</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ageGroupSummary.map((group) => (
                    <div
                      key={group.age_group}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{group.age_group_label}</h3>
                        <GlassBadge variant="primary">{group.children_count} niños</GlassBadge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo de Leche:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMilkTypeColor(group.milk_type)}`}>
                            {getMilkTypeLabel(group.milk_type)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Oz por Comida:</span>
                          <span className="font-medium">{group.oz_per_meal} oz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Diario:</span>
                          <span className="font-medium">{group.total_daily_oz} oz</span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-gray-400 italic">{group.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* USDA Requirements Reference */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Requisitos USDA/CACFP
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Grupo de Edad</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-500">Tipo de Leche</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-500">Oz/Comida</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-3">0-5 meses</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          Fórmula
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">4 oz</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">Breast milk or formula only</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-3">6-11 meses</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          Fórmula
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">6 oz</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">Breast milk or formula only</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-3">1 año</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Entera
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">4 oz</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">Whole milk required</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-3">2-5 años</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Low-fat
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">6 oz</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">1% or fat-free preferred</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">6+ años</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                          Fat-free
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">8 oz</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">1% or fat-free required</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {selectedTab === 'children' && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Requisitos por Niño</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Niño</GlassTableHead>
                    <GlassTableHead className="text-center">Edad</GlassTableHead>
                    <GlassTableHead className="text-center">Tipo</GlassTableHead>
                    <GlassTableHead className="text-center">Oz/Comida</GlassTableHead>
                    <GlassTableHead className="text-center">Diario</GlassTableHead>
                    <GlassTableHead className="text-center">Semanal</GlassTableHead>
                    <GlassTableHead>Notas</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {requirements.map((child) => (
                    <GlassTableRow key={child.child_id}>
                      <GlassTableCell className="font-medium">
                        {child.child_name}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {child.age_months < 12
                          ? `${child.age_months} meses`
                          : `${Math.floor(child.age_months / 12)} años`}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMilkTypeColor(child.milk_type)}`}>
                          {getMilkTypeLabel(child.milk_type)}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {child.has_milk_allergy ? '-' : `${child.oz_per_meal} oz`}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {child.has_milk_allergy ? '-' : `${child.daily_oz_needed} oz`}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {child.has_milk_allergy ? '-' : `${child.weekly_oz_needed} oz`}
                      </GlassTableCell>
                      <GlassTableCell>
                        {child.has_milk_allergy ? (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Alergia a lácteos
                          </span>
                        ) : child.alternative ? (
                          <span className="text-xs text-purple-600">{child.alternative}</span>
                        ) : (
                          <span className="text-xs text-gray-400">{child.notes}</span>
                        )}
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </GlassTableBody>
              </GlassTable>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {selectedTab === 'forecast' && forecast && (
        <div className="space-y-6">
          {/* Weekly Forecast */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Pronóstico Semanal
                </GlassCardTitle>
                <GlassBadge variant="default">
                  <Calendar className="w-3 h-3 mr-1" />
                  {forecast.week_start} - {forecast.week_end}
                </GlassBadge>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {forecast.by_milk_type.map((item) => (
                  <div
                    key={item.milk_type}
                    className="p-4 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMilkTypeColor(item.milk_type)}`}>
                        Leche {getMilkTypeLabel(item.milk_type)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{item.total_oz}</p>
                        <p className="text-xs text-gray-500">Onzas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{item.gallons.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">Galones</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(item.estimated_cost)}</p>
                        <p className="text-xs text-gray-500">Costo Est.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700">Total Semanal</p>
                    <p className="text-xs text-primary-500">{forecast.children_count} niños × {forecast.operating_days} días</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-700">
                      {forecast.total_gallons.toFixed(1)} <span className="text-lg">galones</span>
                    </p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(forecast.estimated_total_cost)}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Notes */}
          {forecast.notes.length > 0 && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Notas y Consideraciones</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ul className="space-y-2">
                  {forecast.notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {note}
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}
