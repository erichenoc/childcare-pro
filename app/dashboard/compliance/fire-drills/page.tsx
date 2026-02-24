'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Flame,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Shield,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import { createClient } from '@/shared/lib/supabase/client'
import {
  fireDrillService,
  DRILL_TYPE_LABELS,
} from '@/features/compliance/services/fire-drill.service'
import type {
  FireDrill,
  FireDrillFormData,
  FireDrillComplianceStatus,
} from '@/features/compliance/services/fire-drill.service'
import type { Profile } from '@/shared/types/database.types'

const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Despejado' },
  { value: 'cloudy', label: 'Nublado' },
  { value: 'rainy', label: 'Lluvioso' },
  { value: 'hot', label: 'Caluroso' },
  { value: 'cold', label: 'Frio' },
]

const DRILL_TYPES = Object.entries(DRILL_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const initialFormData: FireDrillFormData = {
  drill_date: new Date().toISOString().split('T')[0],
  drill_time: '',
  drill_type: 'fire',
  duration_seconds: null,
  weather_conditions: '',
  total_children: 0,
  total_staff: 0,
  evacuation_successful: true,
  issues_noted: '',
  corrective_actions: '',
  all_exits_used: false,
  assembly_point_reached: true,
  headcount_verified: true,
  conducted_by: '',
  notes: '',
}

export default function FireDrillsPage() {
  const [drills, setDrills] = useState<FireDrill[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<FireDrillFormData>(initialFormData)
  const [compliance, setCompliance] = useState<FireDrillComplianceStatus | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return
      setOrgId(profile.organization_id)

      // Load drills, staff, and compliance in parallel
      const [drillsData, staffResult, complianceData] = await Promise.all([
        fireDrillService.getAll(profile.organization_id),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('organization_id', profile.organization_id)
          .eq('status', 'active'),
        fireDrillService.getComplianceStatus(profile.organization_id),
      ])

      setDrills(drillsData)
      setStaff((staffResult.data || []) as Profile[])
      setCompliance(complianceData)
    } catch (error) {
      console.error('Error loading fire drills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !userId) return

    if (!formData.drill_time) {
      alert('Por favor ingrese la hora del simulacro')
      return
    }

    try {
      setIsSaving(true)
      await fireDrillService.create(orgId, formData, userId)
      setSuccess('Simulacro registrado exitosamente')
      setShowForm(false)
      setFormData(initialFormData)
      await loadData()
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error('Error saving fire drill:', error)
      alert('Error al guardar el simulacro')
    } finally {
      setIsSaving(false)
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Simulacros de Incendio
            </h1>
            <p className="text-gray-500">
              Registro DCF - Simulacros mensuales obligatorios
            </p>
          </div>
        </div>
        <GlassButton variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Simulacro
        </GlassButton>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Compliance Status */}
      {compliance && (
        <GlassCard>
          <GlassCardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    compliance.isCompliant
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {compliance.isCompliant ? (
                    <Shield className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      compliance.isCompliant ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {compliance.isCompliant
                      ? 'En Cumplimiento DCF'
                      : 'Fuera de Cumplimiento'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {compliance.isCompliant
                      ? 'Todos los simulacros mensuales estan al dia'
                      : `${compliance.monthsMissed.length} mes(es) sin simulacro: ${compliance.monthsMissed.join(', ')}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {compliance.drillsThisMonth}
                  </p>
                  <p className="text-xs text-gray-500">Este Mes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {compliance.drillsThisYear}
                  </p>
                  <p className="text-xs text-gray-500">Este Ano</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {compliance.lastDrillDate || 'Nunca'}
                  </p>
                  <p className="text-xs text-gray-500">Ultimo Simulacro</p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* New Drill Form */}
      {showForm && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Nuevo Simulacro
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <GlassInput
                    type="date"
                    value={formData.drill_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        drill_date: e.target.value,
                      }))
                    }
                    required
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <GlassInput
                    type="time"
                    value={formData.drill_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        drill_time: e.target.value,
                      }))
                    }
                    required
                    leftIcon={<Clock className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <GlassSelect
                    options={DRILL_TYPES}
                    value={formData.drill_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        drill_type: e.target.value as FireDrillFormData['drill_type'],
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duracion (segundos)
                  </label>
                  <GlassInput
                    type="number"
                    min="0"
                    placeholder="120"
                    value={formData.duration_seconds ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_seconds: parseInt(e.target.value) || null,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ninos Presentes *
                  </label>
                  <GlassInput
                    type="number"
                    min="0"
                    value={formData.total_children}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        total_children: parseInt(e.target.value) || 0,
                      }))
                    }
                    required
                    leftIcon={<Users className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Presentes *
                  </label>
                  <GlassInput
                    type="number"
                    min="0"
                    value={formData.total_staff}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        total_staff: parseInt(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirigido Por
                  </label>
                  <GlassSelect
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      ...staff.map((s) => ({
                        value: s.id,
                        label: `${s.first_name} ${s.last_name}`,
                      })),
                    ]}
                    value={formData.conducted_by}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        conducted_by: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Conditions and Compliance Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clima
                  </label>
                  <GlassSelect
                    options={[{ value: '', label: 'Seleccionar...' }, ...WEATHER_OPTIONS]}
                    value={formData.weather_conditions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weather_conditions: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-wrap items-end gap-4 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.evacuation_successful}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          evacuation_successful: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">Evacuacion Exitosa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.all_exits_used}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          all_exits_used: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">Todas las Salidas Usadas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.headcount_verified}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          headcount_verified: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm">Conteo Verificado</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problemas Notados
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-white/60 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                    rows={3}
                    placeholder="Describa cualquier problema durante el simulacro..."
                    value={formData.issues_noted}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        issues_noted: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acciones Correctivas
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-white/60 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                    rows={3}
                    placeholder="Acciones tomadas para corregir problemas..."
                    value={formData.corrective_actions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        corrective_actions: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <GlassButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </GlassButton>
                <GlassButton type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Registrar Simulacro
                    </>
                  )}
                </GlassButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Drill History */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Historial de Simulacros</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {drills.length === 0 ? (
            <div className="text-center py-12">
              <Flame className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin Simulacros Registrados
              </h3>
              <p className="text-gray-500 mb-4">
                Florida DCF requiere simulacros mensuales documentados
              </p>
              <GlassButton variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primer Simulacro
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-3">
              {drills.map((drill) => (
                <div
                  key={drill.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          drill.evacuation_successful
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {drill.evacuation_successful ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {fireDrillService.getTypeLabel(drill.drill_type)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {drill.drill_date} a las {drill.drill_time}
                          {drill.conductor &&
                            ` - Dir. por ${drill.conductor.first_name} ${drill.conductor.last_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <Users className="w-3.5 h-3.5 inline mr-1" />
                        {drill.total_children} ninos, {drill.total_staff} staff
                      </span>
                      <span className="text-gray-600">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {formatDuration(drill.duration_seconds)}
                      </span>
                      <GlassBadge
                        variant={drill.evacuation_successful ? 'success' : 'error'}
                      >
                        {drill.evacuation_successful ? 'Exitoso' : 'Con Problemas'}
                      </GlassBadge>
                    </div>
                  </div>
                  {drill.issues_noted && (
                    <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{drill.issues_noted}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
