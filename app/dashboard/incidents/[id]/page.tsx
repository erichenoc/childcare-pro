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
  Calendar,
  ClipboardCheck,
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
import { incidentsEnhancedService } from '@/features/incidents/services/incidents-enhanced.service'
import { printIncidentReport, downloadIncidentHTML, type IncidentPDFData } from '@/features/incidents/utils/incident-pdf'
import { organizationService, type Organization } from '@/features/organization/services/organization.service'

// Synced with backend types from shared/types/incidents-expanded.ts
const typeLabels: Record<string, string> = {
  injury: 'Lesión',
  illness: 'Enfermedad',
  behavioral: 'Comportamiento',
  medication: 'Medicamento',
  property_damage: 'Daño a Propiedad',
  security: 'Seguridad',
  other: 'Otro',
}

const severityLabels: Record<string, string> = {
  minor: 'Menor',
  moderate: 'Moderado',
  serious: 'Serio',
  critical: 'Crítico',
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
  const [isMarkingFollowUp, setIsMarkingFollowUp] = useState(false)

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
    // Check if parent has signed the incident
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incidentData = incident as any
    if (!incidentData?.parent_signed_at) {
      // Redirect to signature page with a message
      if (confirm('Este incidente requiere la firma del padre/tutor antes de cerrarse.\n\n¿Desea ir a la pagina de firma ahora?')) {
        router.push(`/dashboard/incidents/${incidentId}/sign`)
      }
      return
    }

    try {
      // Use correct status value synced with backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await incidentsService.update(incidentId, { status: 'closed' as any })
      loadIncident()
    } catch (error) {
      console.error('Error updating incident:', error)
    }
  }

  async function handleMarkFollowUpComplete() {
    if (!confirm('¿Está seguro de marcar el seguimiento como completado?')) return

    try {
      setIsMarkingFollowUp(true)
      await incidentsEnhancedService.completeFollowUp(incidentId, 'current-user') // TODO: Get actual user ID
      loadIncident()
    } catch (error) {
      console.error('Error marking follow-up complete:', error)
    } finally {
      setIsMarkingFollowUp(false)
    }
  }

  function buildPdfData(organization: Organization): IncidentPDFData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inc = incident as any
    // The incident data shape here bridges IncidentWithRelations (DB) and IncidentWithDetails (expanded).
    // We use `any` to avoid cascading type mismatches between the two type systems.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incidentData: any = {
      id: inc.id,
      organization_id: inc.organization_id,
      child_id: inc.child_id,
      classroom_id: inc.classroom_id,
      reporting_teacher_id: inc.reporter_id || inc.reporting_teacher_id || inc.reported_by || '',
      incident_number: inc.incident_number || `INC-${inc.id.slice(0, 8).toUpperCase()}`,
      incident_type: inc.incident_type,
      severity: inc.severity || 'minor',
      status: inc.status === 'inactive' ? 'closed' : inc.status === 'active' ? 'pending_signature' : (inc.status || 'open'),
      occurred_at: inc.occurred_at,
      location: inc.location || null,
      description: inc.description,
      action_taken: inc.action_taken || null,
      witness_names: inc.witnesses ? [inc.witnesses] : null,
      parent_notified: inc.parent_notified || false,
      parent_notified_at: inc.parent_notified_at || null,
      parent_notified_method: null,
      parent_signature_data: inc.parent_signature_data || inc.parent_signature || null,
      parent_signed_at: inc.parent_signed_at || null,
      parent_signed_by_name: inc.parent_signed_by_name || null,
      parent_signed_by_relationship: inc.parent_signed_by_relationship || null,
      parent_copy_sent: false,
      parent_copy_sent_at: null,
      parent_copy_sent_method: null,
      closed_at: inc.status === 'inactive' ? inc.updated_at : null,
      closed_by: null,
      closure_notes: inc.follow_up_notes || null,
      attachments: null,
      created_at: inc.created_at,
      updated_at: inc.updated_at,
      // Extended fields with defaults
      witness_staff_ids: [],
      parent_notified_by: null,
      parent_response: null,
      parent_signature_url: null,
      signature_ip_address: null,
      pdf_url: null,
      daycare_copy_url: null,
      parent_copy_url: null,
      follow_up_required: inc.follow_up_required || false,
      follow_up_date: inc.follow_up_date || null,
      follow_up_completed: inc.follow_up_completed || false,
      follow_up_completed_at: inc.follow_up_completed_at || null,
      follow_up_completed_by: null,
      child: inc.child ? {
        id: inc.child.id || '',
        first_name: inc.child.first_name,
        last_name: inc.child.last_name,
        date_of_birth: inc.child.date_of_birth || null,
        photo_url: inc.child.photo_url || null,
      } : null,
      classroom: inc.classroom ? {
        id: inc.classroom.id || '',
        name: inc.classroom.name,
      } : null,
      reporting_teacher: (inc.reporter || inc.reporting_teacher) ? {
        id: (inc.reporter || inc.reporting_teacher).id || '',
        first_name: (inc.reporter || inc.reporting_teacher).first_name,
        last_name: (inc.reporter || inc.reporting_teacher).last_name,
      } : null,
    }

    return {
      incident: incidentData,
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
  }

  function handlePrint() {
    if (!incident || !organization) return
    printIncidentReport(buildPdfData(organization))
  }

  function handleDownload() {
    if (!incident || !organization) return
    downloadIncidentHTML(buildPdfData(organization))
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

  // Synced with backend types
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'minor': return 'success'
      case 'moderate': return 'warning'
      case 'serious': return 'error'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'error'
      case 'pending_signature': return 'warning'
      case 'pending_closure': return 'warning'
      case 'closed': return 'success'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto'
      case 'pending_signature': return 'Pendiente Firma'
      case 'pending_closure': return 'Pendiente Cierre'
      case 'closed': return 'Cerrado'
      default: return status
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidentAny = incident as any

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
          {incidentAny.status !== 'closed' && (
            <GlassButton
              variant={incidentAny.parent_signed_at ? "primary" : "secondary"}
              onClick={handleMarkResolved}
              title={incidentAny.parent_signed_at ? undefined : "Requiere firma del padre para cerrar"}
            >
              {incidentAny.parent_signed_at ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <PenTool className="w-4 h-4 mr-2 text-amber-500" />
              )}
              {incidentAny.parent_signed_at ? "Marcar Resuelto" : "Requiere Firma"}
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
                <GlassBadge variant={getSeverityVariant(incident.severity || 'minor')}>
                  {severityLabels[incident.severity || 'minor']}
                </GlassBadge>
                <GlassBadge variant={getStatusVariant(incident.status || 'open')} dot>
                  {getStatusLabel(incident.status || 'open')}
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
          incidentAny.parent_signed_at
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
            {incidentAny.parent_signed_at ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Firmado</p>
                    <p className="text-sm text-gray-500">
                      Por: {incidentAny.parent_signed_by_name || 'Padre/Tutor'} - {formatDate(incidentAny.parent_signed_at)}
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

        {/* Follow-up Section */}
        {(() => {
          const followUpRequired = incidentAny.follow_up_required as boolean
          const followUpCompleted = incidentAny.follow_up_completed as boolean
          const followUpDate = incidentAny.follow_up_date as string | null
          const followUpCompletedAt = incidentAny.follow_up_completed_at as string | null

          if (!followUpRequired) return null

          return (
            <GlassCard className={`border-l-4 ${
              followUpCompleted ? 'border-l-green-500' : 'border-l-blue-500'
            }`}>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Seguimiento
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                {followUpCompleted ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Seguimiento Completado</p>
                        <p className="text-sm text-gray-500">
                          {followUpCompletedAt && `Completado el ${formatDate(followUpCompletedAt)}`}
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
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Seguimiento Pendiente</p>
                        <p className="text-sm text-gray-500">
                          {followUpDate ? (
                            <>Programado para: {formatDate(followUpDate)}</>
                          ) : (
                            'Sin fecha programada'
                          )}
                        </p>
                      </div>
                    </div>
                    <GlassButton
                      variant="primary"
                      onClick={handleMarkFollowUpComplete}
                      disabled={isMarkingFollowUp}
                      leftIcon={isMarkingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    >
                      Marcar Completado
                    </GlassButton>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          )
        })()}
      </div>
    </div>
  )
}
