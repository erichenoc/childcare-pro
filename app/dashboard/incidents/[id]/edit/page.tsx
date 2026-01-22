'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
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
import { incidentsService, type IncidentWithRelations } from '@/features/incidents/services/incidents.service'
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

const statusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'pending_signature', label: 'Pendiente Firma' },
  { value: 'pending_closure', label: 'Pendiente Cierre' },
  { value: 'closed', label: 'Cerrado' },
]

export default function EditIncidentPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [children, setChildren] = useState<{ value: string; label: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ value: string; label: string }[]>([])

  const [formData, setFormData] = useState({
    child_id: '',
    classroom_id: '',
    incident_type: 'injury',
    severity: 'minor',
    status: 'open',
    description: '',
    location: '',
    action_taken: '',
    follow_up_notes: '',
    parent_notified: false,
  })

  useEffect(() => {
    loadData()
  }, [incidentId])

  async function loadData() {
    try {
      const [incident, childrenData, classroomsData] = await Promise.all([
        incidentsService.getById(incidentId),
        childrenService.getAll(),
        classroomsService.getAll(),
      ])

      if (incident) {
        setFormData({
          child_id: incident.child_id,
          classroom_id: incident.classroom_id || '',
          incident_type: incident.incident_type,
          severity: incident.severity || 'minor',
          status: incident.status || 'open',
          description: incident.description,
          location: incident.location || '',
          action_taken: incident.action_taken || '',
          follow_up_notes: incident.follow_up_notes || '',
          parent_notified: incident.parent_notified || false,
        })
      }

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
      await incidentsService.update(incidentId, {
        child_id: formData.child_id,
        classroom_id: formData.classroom_id || null,
        incident_type: formData.incident_type as 'injury' | 'illness' | 'behavioral' | 'medication' | 'property_damage' | 'security' | 'other',
        severity: formData.severity as 'minor' | 'moderate' | 'serious' | 'critical',
        status: formData.status as 'open' | 'pending_signature' | 'pending_closure' | 'closed',
        description: formData.description,
        location: formData.location || null,
        action_taken: formData.action_taken || null,
        follow_up_notes: formData.follow_up_notes || null,
        parent_notified: formData.parent_notified,
        parent_notified_at: formData.parent_notified ? new Date().toISOString() : null,
      })
      router.push(`/dashboard/incidents/${incidentId}`)
    } catch (error) {
      console.error('Error updating incident:', error)
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
        <Link href={`/dashboard/incidents/${incidentId}`}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Incidente</h1>
          <p className="text-gray-500">Actualizar informacion del incidente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <GlassSelect
                  options={statusOptions}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>

              <div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de Seguimiento
                </label>
                <GlassTextarea
                  placeholder="Notas adicionales de seguimiento..."
                  value={formData.follow_up_notes}
                  onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
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
              <Link href={`/dashboard/incidents/${incidentId}`}>
                <GlassButton variant="ghost" type="button">
                  Cancelar
                </GlassButton>
              </Link>
              <GlassButton variant="primary" type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Guardar Cambios
              </GlassButton>
            </div>
          </GlassCardContent>
        </GlassCard>
      </form>
    </div>
  )
}
