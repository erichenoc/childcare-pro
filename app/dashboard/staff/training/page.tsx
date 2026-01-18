'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Users,
  Calendar,
  Plus,
  CheckCircle2,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassAvatar,
  GlassInput,
  GlassSelect,
  GlassModal,
} from '@/shared/components/ui'
import { staffService } from '@/features/staff/services/staff.service'
import { certificationService, CERTIFICATION_TYPE_LABELS } from '@/features/staff/services/certification.service'
import type { Profile } from '@/shared/types/database.types'

interface TrainingEntry {
  profile_id: string
  hours: number
  selected: boolean
}

// Common in-service training topics
const TRAINING_TOPICS = [
  { value: 'child_development', label: 'Desarrollo Infantil' },
  { value: 'health_safety', label: 'Salud y Seguridad' },
  { value: 'nutrition', label: 'Nutrición' },
  { value: 'behavior_management', label: 'Manejo de Comportamiento' },
  { value: 'special_needs', label: 'Necesidades Especiales' },
  { value: 'early_literacy', label: 'Alfabetización Temprana' },
  { value: 'safe_sleep', label: 'Sueño Seguro' },
  { value: 'child_abuse', label: 'Prevención de Abuso Infantil' },
  { value: 'emergency_procedures', label: 'Procedimientos de Emergencia' },
  { value: 'communication', label: 'Comunicación con Familias' },
  { value: 'curriculum', label: 'Currículo y Planificación' },
  { value: 'other', label: 'Otro' },
]

export default function StaffTrainingPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [staff, setStaff] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Training session form
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0])
  const [trainingTopic, setTrainingTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [defaultHours, setDefaultHours] = useState(1)
  const [entries, setEntries] = useState<Record<string, TrainingEntry>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      setIsLoading(true)
      const data = await staffService.getAll()
      setStaff(data.filter(s => s.status === 'active'))

      // Initialize entries
      const initialEntries: Record<string, TrainingEntry> = {}
      data.forEach(member => {
        initialEntries[member.id] = {
          profile_id: member.id,
          hours: defaultHours,
          selected: false,
        }
      })
      setEntries(initialEntries)
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleStaff(profileId: string) {
    setEntries(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        selected: !prev[profileId].selected,
      }
    }))
  }

  function toggleAll() {
    const allSelected = Object.values(entries).every(e => e.selected)
    const newEntries: Record<string, TrainingEntry> = {}
    Object.keys(entries).forEach(id => {
      newEntries[id] = {
        ...entries[id],
        selected: !allSelected,
      }
    })
    setEntries(newEntries)
  }

  function updateHours(profileId: string, hours: number) {
    setEntries(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        hours,
      }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const selectedEntries = Object.values(entries).filter(e => e.selected)
    if (selectedEntries.length === 0) {
      alert('Seleccione al menos un empleado')
      return
    }

    const topicName = trainingTopic === 'other' ? customTopic :
      TRAINING_TOPICS.find(t => t.value === trainingTopic)?.label || trainingTopic

    if (!topicName) {
      alert('Seleccione un tema de entrenamiento')
      return
    }

    try {
      setIsSaving(true)

      // Log training for each selected staff member
      await Promise.all(
        selectedEntries.map(entry =>
          certificationService.logInServiceHours(
            entry.profile_id,
            entry.hours,
            topicName
          )
        )
      )

      setSuccess(`Entrenamiento registrado exitosamente para ${selectedEntries.length} empleados`)

      // Reset form
      setTrainingTopic('')
      setCustomTopic('')
      setNotes('')
      const resetEntries: Record<string, TrainingEntry> = {}
      Object.keys(entries).forEach(id => {
        resetEntries[id] = {
          ...entries[id],
          selected: false,
          hours: defaultHours,
        }
      })
      setEntries(resetEntries)

      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error('Error logging training:', error)
      alert('Error al registrar el entrenamiento')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = Object.values(entries).filter(e => e.selected).length
  const totalHours = Object.values(entries)
    .filter(e => e.selected)
    .reduce((sum, e) => sum + e.hours, 0)

  // Get current fiscal year
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const fiscalYear = currentMonth >= 6
    ? `${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`
    : `${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/staff/compliance">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Registrar Entrenamiento In-Service
            </h1>
            <p className="text-gray-500">
              Año fiscal: {fiscalYear} (Jul 1 - Jun 30)
            </p>
          </div>
        </div>
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

      <form onSubmit={handleSubmit}>
        {/* Training Details */}
        <GlassCard className="mb-6">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Detalles del Entrenamiento
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Entrenamiento *
                </label>
                <GlassInput
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  required
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema del Entrenamiento *
                </label>
                <GlassSelect
                  options={TRAINING_TOPICS}
                  value={trainingTopic}
                  onChange={(e) => setTrainingTopic(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas por Defecto
                </label>
                <GlassInput
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="8"
                  value={defaultHours}
                  onChange={(e) => {
                    const hours = parseFloat(e.target.value)
                    setDefaultHours(hours)
                    // Update all selected entries
                    const newEntries: Record<string, TrainingEntry> = {}
                    Object.keys(entries).forEach(id => {
                      newEntries[id] = {
                        ...entries[id],
                        hours: entries[id].selected ? entries[id].hours : hours,
                      }
                    })
                    setEntries(newEntries)
                  }}
                  leftIcon={<Clock className="w-4 h-4" />}
                />
              </div>

              {trainingTopic === 'other' && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especificar Tema *
                  </label>
                  <GlassInput
                    placeholder="Nombre del tema de entrenamiento"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (Opcional)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white/60 border border-blue-200/50 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                  rows={2}
                  placeholder="Notas adicionales sobre el entrenamiento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Staff Selection */}
        <GlassCard className="mb-6">
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Seleccionar Empleados
              </GlassCardTitle>
              <GlassButton type="button" variant="ghost" size="sm" onClick={toggleAll}>
                {Object.values(entries).every(e => e.selected) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </GlassButton>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2">
              {staff.map((member) => {
                const entry = entries[member.id]
                if (!entry) return null

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      entry.selected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                    onClick={() => toggleStaff(member.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => {}}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <GlassAvatar name={`${member.first_name} ${member.last_name}`} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                      {entry.selected && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-sm text-gray-600">Horas:</label>
                          <GlassInput
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="8"
                            value={entry.hours}
                            onChange={(e) => updateHours(member.id, parseFloat(e.target.value))}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Summary & Submit */}
        <GlassCard>
          <GlassCardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{selectedCount}</p>
                  <p className="text-sm text-gray-500">Empleados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{totalHours}</p>
                  <p className="text-sm text-gray-500">Horas Totales</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/dashboard/staff/compliance">
                  <GlassButton type="button" variant="ghost">
                    Cancelar
                  </GlassButton>
                </Link>
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={isSaving || selectedCount === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Registrar Entrenamiento
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </form>
    </div>
  )
}
