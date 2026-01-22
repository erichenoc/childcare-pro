'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, FileText } from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from '@/shared/components/ui'
import { incidentsService } from '@/features/incidents/services/incidents.service'
import { INCIDENT_TEMPLATES } from '@/features/incidents/services/incidents-enhanced.service'
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'

// Synced with backend types from shared/types/incidents-expanded.ts
const incidentTypes = [
  { value: 'injury', label: 'Lesión' },
  { value: 'illness', label: 'Enfermedad' },
  { value: 'behavioral', label: 'Comportamiento' },
  { value: 'medication', label: 'Medicamento' },
  { value: 'property_damage', label: 'Daño a Propiedad' },
  { value: 'security', label: 'Seguridad' },
  { value: 'other', label: 'Otro' },
]

const severityOptions = [
  { value: 'minor', label: 'Menor' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'serious', label: 'Serio' },
  { value: 'critical', label: 'Crítico' },
]

// Template options for quick fill
const templateOptions = [
  { value: '', label: 'Seleccionar plantilla (opcional)...' },
  { value: 'booboo', label: '🩹 Reporte Booboo (Lesión Menor)' },
  { value: 'behavioral', label: '😤 Incidente Conductual' },
  { value: 'illness', label: '🤒 Enfermedad/Síntomas' },
  { value: 'medication', label: '💊 Administración de Medicamento' },
  { value: 'accident', label: '🚨 Accidente Serio' },
]

export default function NewIncidentPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [children, setChildren] = useState<{ value: string; label: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ value: string; label: string }[]>([])

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [formData, setFormData] = useState({
    child_id: '',
    classroom_id: '',
    incident_type: 'injury' as const,
    severity: 'minor' as const,
    description: '',
    location: '',
    action_taken: '',
    parent_notified: false,
  })

  function handleTemplateChange(templateKey: string) {
    setSelectedTemplate(templateKey)
    if (!templateKey) return

    const template = INCIDENT_TEMPLATES[templateKey as keyof typeof INCIDENT_TEMPLATES]
    if (template) {
      setFormData(prev => ({
        ...prev,
        incident_type: template.incident_type,
        severity: template.severity,
        description: template.description_template,
        action_taken: template.action_template,
      }))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [childrenData, classroomsData] = await Promise.all([
        childrenService.getAll(),
        classroomsService.getAll(),
      ])

      setChildren(childrenData.map(c => ({
        value: c.id,
        label: `${c.first_name} ${c.last_name}`,
      })))

      setClassrooms(classroomsData.map(c => ({
        value: c.id,
        label: c.name,
      })))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.child_id || !formData.description) return

    try {
      setIsSaving(true)
      await incidentsService.create({
        child_id: formData.child_id,
        classroom_id: formData.classroom_id || null,
        incident_type: formData.incident_type,
        severity: formData.severity,
        description: formData.description,
        location: formData.location || null,
        action_taken: formData.action_taken || null,
        parent_notified: formData.parent_notified,
        occurred_at: new Date().toISOString(),
        status: 'open',
      })
      router.push('/dashboard/incidents')
    } catch (error) {
      console.error('Error creating incident:', error)
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/incidents">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Incidente</h1>
          <p className="text-gray-500">Registrar un nuevo incidente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Template Selector Card */}
        <GlassCard className="mb-6">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Usar Plantilla (Opcional)
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm text-gray-500 mb-3">
              Seleccione una plantilla para llenar el formulario rapidamente con campos pre-definidos.
            </p>
            <GlassSelect
              options={templateOptions}
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full"
            />
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Informacion del Incidente
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nino *
                </label>
                <GlassSelect
                  options={[{ value: '', label: 'Seleccionar nino...' }, ...children]}
                  value={formData.child_id}
                  onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon
                </label>
                <GlassSelect
                  options={[{ value: '', label: 'Seleccionar salon...' }, ...classrooms]}
                  value={formData.classroom_id}
                  onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Incidente *
                </label>
                <GlassSelect
                  options={incidentTypes}
                  value={formData.incident_type}
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value as typeof formData.incident_type })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severidad *
                </label>
                <GlassSelect
                  options={severityOptions}
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as typeof formData.severity })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicacion
                </label>
                <GlassInput
                  placeholder="Ej: Area de juegos, Salon Estrellas..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripcion del Incidente *
                </label>
                <GlassTextarea
                  placeholder="Describa lo que ocurrio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accion Tomada / Primeros Auxilios
                </label>
                <GlassTextarea
                  placeholder="Describa las acciones tomadas..."
                  value={formData.action_taken}
                  onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parent_notified}
                    onChange={(e) => setFormData({ ...formData, parent_notified: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Padre/Tutor notificado</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link href="/dashboard/incidents">
                <GlassButton variant="ghost" type="button">
                  Cancelar
                </GlassButton>
              </Link>
              <GlassButton variant="primary" type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Guardar Incidente
              </GlassButton>
            </div>
          </GlassCardContent>
        </GlassCard>
      </form>
    </div>
  )
}
