'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  CheckCircle,
  Loader2,
  PenTool,
  FileText,
  XCircle,
  Printer,
  Download,
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
} from '@/shared/components/ui'
import { incidentsService, type IncidentWithRelations } from '@/features/incidents/services/incidents.service'
import { printIncidentReport, downloadIncidentHTML, type IncidentPDFData } from '@/features/incidents/utils/incident-pdf'
import { organizationService, type Organization } from '@/features/organization/services/organization.service'

const typeLabels: Record<string, string> = {
  fall: 'Caida',
  bite: 'Mordida',
  illness: 'Enfermedad',
  allergic_reaction: 'Reaccion Alergica',
  behavioral: 'Comportamiento',
  other: 'Otro',
}

const severityLabels: Record<string, string> = {
  low: 'Menor',
  medium: 'Moderado',
  high: 'Severo',
}

export default function IncidentDetailPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string

  const [incident, setIncident] = useState<IncidentWithRelations | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadIncident()
    loadOrganization()
  }, [incidentId])

  async function loadIncident() {
    try {
      setIsLoading(true)
      const data = await incidentsService.getById(incidentId)
      setIncident(data)
    } catch (error) {
      console.error('Error loading incident:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadOrganization() {
    try {
      const org = await organizationService.getCurrentUserOrg()
      setOrganization(org)
    } catch (error) {
      console.error('Error loading organization:', error)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Esta seguro de que desea eliminar este incidente?')) return

    try {
      await incidentsService.delete(incidentId)
      router.push('/dashboard/incidents')
    } catch (error) {
      console.error('Error deleting incident:', error)
    }
  }

  async function handleMarkResolved() {
    try {
      await incidentsService.update(incidentId, { status: 'inactive' })
      loadIncident()
    } catch (error) {
      console.error('Error updating incident:', error)
    }
  }

  function handlePrint() {
    if (!incident || !organization) return

    const pdfData: IncidentPDFData = {
      incident: {
        id: incident.id,
        organization_id: incident.organization_id,
        child_id: incident.child_id,
        classroom_id: incident.classroom_id,
        reporting_teacher_id: incident.reporter_id,
        incident_number: (incident as Record<string, unknown>).incident_number as string || `INC-${incident.id.slice(0, 8).toUpperCase()}`,
        incident_type: incident.incident_type as 'injury' | 'illness' | 'behavioral' | 'medication' | 'property_damage' | 'security' | 'other',
        severity: (incident.severity || 'minor') as 'minor' | 'moderate' | 'serious' | 'critical',
        status: incident.status === 'inactive' ? 'closed' : incident.status === 'active' ? 'pending_signature' : 'open',
        occurred_at: incident.occurred_at,
        location: incident.location || null,
        description: incident.description,
        action_taken: incident.action_taken || null,
        witness_names: incident.witnesses ? [incident.witnesses] : null,
        parent_notified: incident.parent_notified || false,
        parent_notified_at: incident.parent_notified_at || null,
        parent_notified_method: null,
        parent_signature_data: (incident as Record<string, unknown>).parent_signature_data as string || null,
        parent_signed_at: (incident as Record<string, unknown>).parent_signed_at as string || null,
        parent_signed_by_name: (incident as Record<string, unknown>).parent_signed_by_name as string || null,
        parent_signed_by_relationship: (incident as Record<string, unknown>).parent_signed_by_relationship as string || null,
        parent_copy_sent: false,
        parent_copy_sent_at: null,
        parent_copy_sent_method: null,
        closed_at: incident.status === 'inactive' ? incident.updated_at : null,
        closed_by_id: null,
        notes: incident.follow_up_notes || null,
        attachments: null,
        created_at: incident.created_at,
        updated_at: incident.updated_at,
        child: incident.child ? {
          first_name: incident.child.first_name,
          last_name: incident.child.last_name,
          date_of_birth: incident.child.date_of_birth,
        } : null,
        classroom: incident.classroom ? {
          name: incident.classroom.name,
        } : null,
        reporting_teacher: incident.reporter ? {
          first_name: incident.reporter.first_name,
          last_name: incident.reporter.last_name,
        } : null,
      },
      organization: {
        name: organization.name,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        zip: organization.zip_code,
        phone: organization.phone,
        email: organization.email,
        logo_url: organization.logo_url,
        license_number: organization.license_number,
      },
    }

    printIncidentReport(pdfData)
  }

  function handleDownload() {
    if (!incident || !organization) return

    const pdfData: IncidentPDFData = {
      incident: {
        id: incident.id,
        organization_id: incident.organization_id,
        child_id: incident.child_id,
        classroom_id: incident.classroom_id,
        reporting_teacher_id: incident.reporter_id,
        incident_number: (incident as Record<string, unknown>).incident_number as string || `INC-${incident.id.slice(0, 8).toUpperCase()}`,
        incident_type: incident.incident_type as 'injury' | 'illness' | 'behavioral' | 'medication' | 'property_damage' | 'security' | 'other',
        severity: (incident.severity || 'minor') as 'minor' | 'moderate' | 'serious' | 'critical',
        status: incident.status === 'inactive' ? 'closed' : incident.status === 'active' ? 'pending_signature' : 'open',
        occurred_at: incident.occurred_at,
        location: incident.location || null,
        description: incident.description,
        action_taken: incident.action_taken || null,
        witness_names: incident.witnesses ? [incident.witnesses] : null,
        parent_notified: incident.parent_notified || false,
        parent_notified_at: incident.parent_notified_at || null,
        parent_notified_method: null,
        parent_signature_data: (incident as Record<string, unknown>).parent_signature_data as string || null,
        parent_signed_at: (incident as Record<string, unknown>).parent_signed_at as string || null,
        parent_signed_by_name: (incident as Record<string, unknown>).parent_signed_by_name as string || null,
        parent_signed_by_relationship: (incident as Record<string, unknown>).parent_signed_by_relationship as string || null,
        parent_copy_sent: false,
        parent_copy_sent_at: null,
        parent_copy_sent_method: null,
        closed_at: incident.status === 'inactive' ? incident.updated_at : null,
        closed_by_id: null,
        notes: incident.follow_up_notes || null,
        attachments: null,
        created_at: incident.created_at,
        updated_at: incident.updated_at,
        child: incident.child ? {
          first_name: incident.child.first_name,
          last_name: incident.child.last_name,
          date_of_birth: incident.child.date_of_birth,
        } : null,
        classroom: incident.classroom ? {
          name: incident.classroom.name,
        } : null,
        reporting_teacher: incident.reporter ? {
          first_name: incident.reporter.first_name,
          last_name: incident.reporter.last_name,
        } : null,
      },
      organization: {
        name: organization.name,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        zip: organization.zip_code,
        phone: organization.phone,
        email: organization.email,
        logo_url: organization.logo_url,
        license_number: organization.license_number,
      },
    }

    downloadIncidentHTML(pdfData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Incidente no encontrado</p>
        <Link href="/dashboard/incidents">
          <GlassButton variant="secondary" className="mt-4">
            Volver a Incidentes
          </GlassButton>
        </Link>
      </div>
    )
  }

  const childName = incident.child
    ? `${incident.child.first_name} ${incident.child.last_name}`
    : 'Desconocido'

  const reporterName = incident.reporter
    ? `${incident.reporter.first_name} ${incident.reporter.last_name}`
    : 'Sistema'

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'error'
      case 'active': return 'warning'
      case 'inactive': return 'success'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Abierto'
      case 'active': return 'En Revision'
      case 'inactive': return 'Resuelto'
      default: return status
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/incidents">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Incidente</h1>
            <p className="text-gray-500">{formatDate(incident.occurred_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" onClick={handlePrint} disabled={!organization}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </GlassButton>
          <GlassButton variant="secondary" onClick={handleDownload} disabled={!organization}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </GlassButton>
          {incident.status !== 'inactive' && (
            <GlassButton variant="primary" onClick={handleMarkResolved}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Resuelto
            </GlassButton>
          )}
          <Link href={`/dashboard/incidents/${incidentId}/edit`}>
            <GlassButton variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </GlassButton>
          </Link>
          <GlassButton variant="ghost" className="text-error" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Incident Info */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Informacion del Incidente
              </GlassCardTitle>
              <div className="flex gap-2">
                <GlassBadge variant={getSeverityVariant(incident.severity || 'low')}>
                  {severityLabels[incident.severity || 'low']}
                </GlassBadge>
                <GlassBadge variant={getStatusVariant(incident.status || 'pending')} dot>
                  {getStatusLabel(incident.status || 'pending')}
                </GlassBadge>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <GlassAvatar name={childName} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{childName}</p>
                <GlassBadge variant="default">{typeLabels[incident.incident_type] || incident.incident_type}</GlassBadge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date(incident.occurred_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{incident.location || 'No especificada'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Reportado por: {reporterName}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">Descripcion</h4>
              <p className="text-gray-600">{incident.description}</p>
            </div>

            {incident.action_taken && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">Accion Tomada / Primeros Auxilios</h4>
                <p className="text-gray-600">{incident.action_taken}</p>
              </div>
            )}

            {incident.follow_up_notes && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">Notas de Seguimiento</h4>
                <p className="text-gray-600">{incident.follow_up_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              {incident.parent_notified ? (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Padre notificado {incident.parent_notified_at && `el ${formatDate(incident.parent_notified_at)}`}
                </span>
              ) : (
                <span className="text-sm text-amber-600">Padre no notificado</span>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Classroom Info */}
        {incident.classroom && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Salon</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-gray-900">{incident.classroom.name}</p>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Parent Signature Section */}
        <GlassCard className={`border-l-4 ${
          (incident as { parent_signed_at?: string }).parent_signed_at
            ? 'border-l-green-500'
            : 'border-l-yellow-500'
        }`}>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Firma del Padre/Tutor
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {(incident as { parent_signed_at?: string; parent_signed_by_name?: string }).parent_signed_at ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Firmado</p>
                    <p className="text-sm text-gray-500">
                      Por: {(incident as { parent_signed_by_name?: string }).parent_signed_by_name || 'Padre/Tutor'} - {formatDate((incident as { parent_signed_at?: string }).parent_signed_at!)}
                    </p>
                  </div>
                </div>
                <GlassBadge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completado
                </GlassBadge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pendiente de Firma</p>
                    <p className="text-sm text-gray-500">
                      Se requiere firma del padre/tutor para cerrar el incidente
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/incidents/${incidentId}/sign`}>
                  <GlassButton variant="primary" leftIcon={<PenTool className="w-4 h-4" />}>
                    Firmar Ahora
                  </GlassButton>
                </Link>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
