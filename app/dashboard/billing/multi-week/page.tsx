'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  Save,
  Plus,
  Trash2,
  CalendarDays,
  Users,
  Baby,
  Calculator,
  CheckCircle,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { billingService } from '@/features/billing/services/billing.service'
import { billingEnhancedService, RATE_TEMPLATES, type RateTemplate } from '@/features/billing/services/billing-enhanced.service'
import { familiesService } from '@/features/families/services/families.service'
import type { Family, FamilyWithChildren } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassBadge,
} from '@/shared/components/ui'

interface WeekEntry {
  id: string
  weekStart: string
  weekEnd: string
  days: number
}

interface ChildRate {
  childId: string
  childName: string
  rateType: keyof typeof RATE_TEMPLATES | 'custom'
  weeklyRate: number
  daysPerWeek: number
}

export default function MultiWeekInvoicePage() {
  const t = useTranslations()
  const { formatCurrency } = useI18n()
  const router = useRouter()

  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamily, setSelectedFamily] = useState<FamilyWithChildren | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)

  // Multi-week entries
  const [weeks, setWeeks] = useState<WeekEntry[]>([])

  // Child rates
  const [childRates, setChildRates] = useState<ChildRate[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedFamilyId) {
      loadFamily(selectedFamilyId)
    } else {
      setSelectedFamily(null)
      setChildRates([])
    }
  }, [selectedFamilyId])

  async function loadData() {
    try {
      setIsLoading(true)
      const [familiesData, nextNumber] = await Promise.all([
        familiesService.getAll(),
        billingService.getNextInvoiceNumber(),
      ])
      setFamilies(familiesData)
      setInvoiceNumber(nextNumber)

      // Set default due date (15 days from now)
      const dueDay = new Date()
      dueDay.setDate(dueDay.getDate() + 15)
      setDueDate(dueDay.toISOString().split('T')[0])

      // Initialize with one week (current week)
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
      const friday = new Date(monday)
      friday.setDate(monday.getDate() + 4)

      setWeeks([{
        id: crypto.randomUUID(),
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: friday.toISOString().split('T')[0],
        days: 5,
      }])
    } catch (err) {
      console.error('Error loading data:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadFamily(familyId: string) {
    try {
      const family = await familiesService.getById(familyId)
      if (family) {
        setSelectedFamily(family)
        // Initialize child rates
        const rates: ChildRate[] = (family.children || []).map(child => {
          // Determine default rate based on child age
          const birthDate = child.date_of_birth ? new Date(child.date_of_birth) : null
          let defaultRate: keyof typeof RATE_TEMPLATES = 'preschool_fulltime'

          if (birthDate) {
            const ageInMonths = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
            if (ageInMonths < 12) {
              defaultRate = 'infant_fulltime'
            } else if (ageInMonths < 24) {
              defaultRate = 'toddler_fulltime'
            } else if (ageInMonths < 36) {
              defaultRate = 'twos_fulltime'
            } else {
              defaultRate = 'preschool_fulltime'
            }
          }

          const template = RATE_TEMPLATES[defaultRate]
          return {
            childId: child.id,
            childName: `${child.first_name} ${child.last_name}`,
            rateType: defaultRate,
            weeklyRate: template.weekly_rate,
            daysPerWeek: template.days_per_week,
          }
        })
        setChildRates(rates)
      }
    } catch (err) {
      console.error('Error loading family:', err)
    }
  }

  function addWeek() {
    // Add next week based on last entry
    const lastWeek = weeks[weeks.length - 1]
    let nextMonday: Date

    if (lastWeek) {
      nextMonday = new Date(lastWeek.weekEnd)
      nextMonday.setDate(nextMonday.getDate() + 3) // Friday + 3 = Monday
    } else {
      const today = new Date()
      const dayOfWeek = today.getDay()
      nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    }

    const nextFriday = new Date(nextMonday)
    nextFriday.setDate(nextMonday.getDate() + 4)

    setWeeks([...weeks, {
      id: crypto.randomUUID(),
      weekStart: nextMonday.toISOString().split('T')[0],
      weekEnd: nextFriday.toISOString().split('T')[0],
      days: 5,
    }])
  }

  function removeWeek(id: string) {
    if (weeks.length > 1) {
      setWeeks(weeks.filter(w => w.id !== id))
    }
  }

  function updateWeek(id: string, field: keyof WeekEntry, value: string | number) {
    setWeeks(weeks.map(week => {
      if (week.id === id) {
        return { ...week, [field]: value }
      }
      return week
    }))
  }

  function updateChildRate(childId: string, field: keyof ChildRate, value: string | number) {
    setChildRates(childRates.map(rate => {
      if (rate.childId === childId) {
        if (field === 'rateType' && value !== 'custom') {
          const template = RATE_TEMPLATES[value as keyof typeof RATE_TEMPLATES]
          return {
            ...rate,
            rateType: value as keyof typeof RATE_TEMPLATES,
            weeklyRate: template.weekly_rate,
            daysPerWeek: template.days_per_week,
          }
        }
        return { ...rate, [field]: value }
      }
      return rate
    }))
  }

  // Calculate totals
  const totalWeeks = weeks.length
  const totalDays = weeks.reduce((sum, w) => sum + w.days, 0)

  const subtotalByChild = childRates.map(rate => {
    // Calculate per-day rate and multiply by total days
    const dailyRate = rate.weeklyRate / rate.daysPerWeek
    const totalForChild = weeks.reduce((sum, week) => {
      return sum + (dailyRate * week.days)
    }, 0)
    return {
      childId: rate.childId,
      childName: rate.childName,
      total: totalForChild,
    }
  })

  const subtotal = subtotalByChild.reduce((sum, c) => sum + c.total, 0)
  const total = subtotal - discount

  // Get period start/end
  const periodStart = weeks.length > 0 ? weeks[0].weekStart : ''
  const periodEnd = weeks.length > 0 ? weeks[weeks.length - 1].weekEnd : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFamilyId) {
      setError('Por favor selecciona una familia')
      return
    }

    if (childRates.length === 0) {
      setError('La familia debe tener al menos un niño')
      return
    }

    if (weeks.length === 0) {
      setError('Agrega al menos una semana')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Build child rates for service
      const childRatesData = childRates.map(rate => ({
        child_id: rate.childId,
        weekly_rate: rate.weeklyRate,
        days_per_week: rate.daysPerWeek,
      }))

      // Build billing periods
      const billingPeriods = weeks.map(week => ({
        week_start: week.weekStart,
        week_end: week.weekEnd,
        days_attended: week.days,
      }))

      await billingEnhancedService.generateMultiWeekInvoice({
        family_id: selectedFamilyId,
        child_rates: childRatesData,
        billing_periods: billingPeriods,
        discount: discount,
        notes: notes || undefined,
        due_date: dueDate,
      })

      setSuccess('Factura creada exitosamente')
      setTimeout(() => {
        router.push('/dashboard/billing')
      }, 1500)
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const familyOptions = [
    { value: '', label: 'Seleccionar familia...' },
    ...families.map(f => ({
      value: f.id,
      label: f.primary_contact_name || 'Sin nombre',
    }))
  ]

  const rateOptions = [
    { value: 'infant_fulltime', label: `Infante Tiempo Completo (${formatCurrency(RATE_TEMPLATES.infant_fulltime.weekly_rate)}/sem)` },
    { value: 'infant_parttime', label: `Infante Medio Tiempo (${formatCurrency(RATE_TEMPLATES.infant_parttime.weekly_rate)}/sem)` },
    { value: 'toddler_fulltime', label: `Toddler Tiempo Completo (${formatCurrency(RATE_TEMPLATES.toddler_fulltime.weekly_rate)}/sem)` },
    { value: 'toddler_parttime', label: `Toddler Medio Tiempo (${formatCurrency(RATE_TEMPLATES.toddler_parttime.weekly_rate)}/sem)` },
    { value: 'twos_fulltime', label: `2 Años Tiempo Completo (${formatCurrency(RATE_TEMPLATES.twos_fulltime.weekly_rate)}/sem)` },
    { value: 'twos_parttime', label: `2 Años Medio Tiempo (${formatCurrency(RATE_TEMPLATES.twos_parttime.weekly_rate)}/sem)` },
    { value: 'preschool_fulltime', label: `Preescolar Tiempo Completo (${formatCurrency(RATE_TEMPLATES.preschool_fulltime.weekly_rate)}/sem)` },
    { value: 'preschool_parttime', label: `Preescolar Medio Tiempo (${formatCurrency(RATE_TEMPLATES.preschool_parttime.weekly_rate)}/sem)` },
    { value: 'schoolage_fulltime', label: `Edad Escolar Tiempo Completo (${formatCurrency(RATE_TEMPLATES.schoolage_fulltime.weekly_rate)}/sem)` },
    { value: 'schoolage_parttime', label: `Edad Escolar Medio Tiempo (${formatCurrency(RATE_TEMPLATES.schoolage_parttime.weekly_rate)}/sem)` },
    { value: 'custom', label: 'Tarifa Personalizada' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Factura Multi-Semana
          </h1>
          <p className="text-gray-500">Genera facturas para múltiples semanas de servicio</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family Selection */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Seleccionar Familia
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <GlassSelect
                  label="Familia"
                  options={familyOptions}
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  required
                />
              </GlassCardContent>
            </GlassCard>

            {/* Child Rates */}
            {selectedFamily && childRates.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5" />
                    Tarifas por Niño
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  {childRates.map((rate) => (
                    <div
                      key={rate.childId}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{rate.childName}</span>
                        <GlassBadge variant="default">
                          {formatCurrency(rate.weeklyRate)}/semana
                        </GlassBadge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <GlassSelect
                            label="Tipo de Tarifa"
                            options={rateOptions}
                            value={rate.rateType}
                            onChange={(e) => updateChildRate(rate.childId, 'rateType', e.target.value)}
                          />
                        </div>
                        <div>
                          <GlassInput
                            type="number"
                            label="Días/Semana"
                            min={1}
                            max={7}
                            value={rate.daysPerWeek}
                            onChange={(e) => updateChildRate(rate.childId, 'daysPerWeek', parseInt(e.target.value) || 5)}
                          />
                        </div>
                      </div>

                      {rate.rateType === 'custom' && (
                        <GlassInput
                          type="number"
                          label="Tarifa Semanal Personalizada"
                          min={0}
                          step={0.01}
                          value={rate.weeklyRate}
                          onChange={(e) => updateChildRate(rate.childId, 'weeklyRate', parseFloat(e.target.value) || 0)}
                          leftIcon={<DollarSign className="w-4 h-4" />}
                        />
                      )}
                    </div>
                  ))}
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Week Entries */}
            <GlassCard>
              <GlassCardHeader className="flex flex-row items-center justify-between">
                <GlassCardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Semanas a Facturar
                </GlassCardTitle>
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addWeek}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Agregar Semana
                </GlassButton>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {weeks.map((week, index) => (
                  <div
                    key={week.id}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">Semana {index + 1}</span>
                      {weeks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeek(week.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <GlassInput
                        type="date"
                        label="Inicio"
                        value={week.weekStart}
                        onChange={(e) => updateWeek(week.id, 'weekStart', e.target.value)}
                        leftIcon={<Calendar className="w-4 h-4" />}
                      />
                      <GlassInput
                        type="date"
                        label="Fin"
                        value={week.weekEnd}
                        onChange={(e) => updateWeek(week.id, 'weekEnd', e.target.value)}
                        leftIcon={<Calendar className="w-4 h-4" />}
                      />
                      <GlassInput
                        type="number"
                        label="Días"
                        min={1}
                        max={7}
                        value={week.days}
                        onChange={(e) => updateWeek(week.id, 'days', parseInt(e.target.value) || 5)}
                      />
                    </div>
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>

            {/* Due Date & Notes */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Detalles Adicionales</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <GlassInput
                  type="date"
                  label="Fecha de Vencimiento"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    className="w-full p-3 rounded-xl bg-neu-bg shadow-neu-inset dark:bg-neu-bg-dark dark:shadow-neu-inset-dark border-0 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                    rows={3}
                    placeholder="Notas adicionales para la factura..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Period Summary */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Resumen
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  {/* Period Info */}
                  <div className="p-3 rounded-lg bg-blue-50 space-y-1">
                    <p className="text-xs text-blue-600 font-medium">Período</p>
                    {periodStart && periodEnd ? (
                      <p className="text-sm text-blue-900">
                        {new Date(periodStart).toLocaleDateString('es-ES')} - {new Date(periodEnd).toLocaleDateString('es-ES')}
                      </p>
                    ) : (
                      <p className="text-sm text-blue-700">Sin semanas seleccionadas</p>
                    )}
                    <p className="text-xs text-blue-600">
                      {totalWeeks} semana{totalWeeks !== 1 ? 's' : ''} ({totalDays} días)
                    </p>
                  </div>

                  {/* Children Subtotals */}
                  {subtotalByChild.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Por Niño</p>
                      {subtotalByChild.map(child => (
                        <div key={child.childId} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">{child.childName}</span>
                          <span className="font-medium">{formatCurrency(child.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Discount Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Descuento</label>
                      <GlassInput
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={discount || ''}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        leftIcon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Actions */}
              <div className="space-y-3">
                <GlassButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                  disabled={!selectedFamilyId || childRates.length === 0}
                >
                  Crear Factura
                </GlassButton>
                <Link href="/dashboard/billing/new" className="block">
                  <GlassButton type="button" variant="ghost" fullWidth>
                    Factura Simple
                  </GlassButton>
                </Link>
                <Link href="/dashboard/billing" className="block">
                  <GlassButton type="button" variant="secondary" fullWidth>
                    Cancelar
                  </GlassButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
