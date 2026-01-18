'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Award,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit,
  Upload,
  Loader2,
  ShieldCheck,
  GraduationCap,
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
import {
  certificationService,
  CERTIFICATION_TYPE_LABELS,
  REQUIRED_HOURS,
  type ComplianceResult
} from '@/features/staff/services/certification.service'
import type { StaffCertification, CertificationFormData, CertificationType } from '@/shared/types/staff-certifications'
import type { Profile } from '@/shared/types/database.types'

export default function StaffCertificationsPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()
  const params = useParams()
  const staffId = params.id as string

  const [staff, setStaff] = useState<Profile | null>(null)
  const [certifications, setCertifications] = useState<StaffCertification[]>([])
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<StaffCertification | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CertificationFormData>({
    certification_type: '45_hour_dcf',
    certification_name: '',
    issuing_authority: '',
    certificate_number: '',
    issue_date: '',
    expiration_date: '',
    hours_completed: undefined,
    document_url: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [staffId])

  async function loadData() {
    try {
      setIsLoading(true)
      const [staffData, certsData, complianceData] = await Promise.all([
        staffService.getById(staffId),
        certificationService.getByProfileId(staffId),
        certificationService.checkCompliance(staffId),
      ])
      setStaff(staffData)
      setCertifications(certsData)
      setCompliance(complianceData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openAddModal() {
    setEditingCert(null)
    setFormData({
      certification_type: '45_hour_dcf',
      certification_name: '',
      issuing_authority: '',
      certificate_number: '',
      issue_date: '',
      expiration_date: '',
      hours_completed: undefined,
      document_url: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(cert: StaffCertification) {
    setEditingCert(cert)
    setFormData({
      certification_type: cert.certification_type as CertificationType,
      certification_name: cert.certification_name,
      issuing_authority: cert.issuing_authority || '',
      certificate_number: cert.certificate_number || '',
      issue_date: cert.issue_date || '',
      expiration_date: cert.expiration_date || '',
      hours_completed: cert.hours_completed || undefined,
      document_url: cert.document_url || '',
      notes: cert.notes || '',
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSaving(true)

      // Auto-fill name if empty
      const certName = formData.certification_name || CERTIFICATION_TYPE_LABELS[formData.certification_type] || formData.certification_type

      if (editingCert) {
        await certificationService.update(editingCert.id, { ...formData, certification_name: certName })
      } else {
        await certificationService.create(staffId, { ...formData, certification_name: certName })
      }

      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Error saving certification:', error)
      alert('Error al guardar la certificación')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(certId: string) {
    if (!confirm('¿Está seguro de eliminar esta certificación?')) return

    try {
      await certificationService.delete(certId)
      loadData()
    } catch (error) {
      console.error('Error deleting certification:', error)
    }
  }

  function getStatusBadge(cert: StaffCertification) {
    if (cert.is_expired) {
      return <GlassBadge variant="error">Expirado</GlassBadge>
    }
    if (cert.expiration_date) {
      const daysUntil = Math.floor((new Date(cert.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntil <= 30) {
        return <GlassBadge variant="warning">Expira pronto</GlassBadge>
      }
    }
    return <GlassBadge variant="success">Vigente</GlassBadge>
  }

  function getComplianceColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Personal no encontrado</p>
        <Link href="/dashboard/staff">
          <GlassButton variant="secondary" className="mt-4">
            Volver a Personal
          </GlassButton>
        </Link>
      </div>
    )
  }

  const fullName = `${staff.first_name} ${staff.last_name}`

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/staff/${staffId}`}>
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div className="flex items-center gap-3">
            <GlassAvatar name={fullName} size="md" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm text-gray-500">Certificaciones DCF</p>
            </div>
          </div>
        </div>

        <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Agregar Certificación
        </GlassButton>
      </div>

      {/* Compliance Score Card */}
      {compliance && (
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getComplianceColor(compliance.compliance_score)}`}>
                {compliance.compliance_score}%
              </div>
              <div>
                <p className="font-medium text-gray-900">Puntaje de Cumplimiento</p>
                <div className="flex items-center gap-2">
                  {compliance.is_compliant ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Cumple con DCF</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Requisitos pendientes</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    compliance.compliance_score >= 80
                      ? 'bg-green-500'
                      : compliance.compliance_score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${compliance.compliance_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Missing requirements */}
          {compliance.missing_requirements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Requisitos faltantes:
              </p>
              <ul className="space-y-1">
                {compliance.missing_requirements.map((req, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-red-400" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expiring soon */}
          {compliance.expiring_soon.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-yellow-600 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Por vencer:
              </p>
              <ul className="space-y-1">
                {compliance.expiring_soon.map((exp, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certifications.length}</p>
              <p className="text-sm text-gray-500">Certificaciones</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.filter(c => !c.is_expired).length}
              </p>
              <p className="text-sm text-gray-500">Vigentes</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.filter(c => {
                  if (!c.expiration_date || c.is_expired) return false
                  const days = Math.floor((new Date(c.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return days <= 30
                }).length}
              </p>
              <p className="text-sm text-gray-500">Por vencer</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certifications
                  .filter(c => c.certification_type === 'annual_in_service')
                  .reduce((sum, c) => sum + (c.hours_completed || 0), 0)}h
              </p>
              <p className="text-sm text-gray-500">Hrs In-Service</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Certifications List */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Lista de Certificaciones
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {certifications.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay certificaciones registradas</p>
              <GlassButton variant="secondary" className="mt-4" onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar primera certificación
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      cert.is_expired ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <Award className={`w-5 h-5 ${cert.is_expired ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cert.certification_name}</p>
                      <p className="text-sm text-gray-500">
                        {CERTIFICATION_TYPE_LABELS[cert.certification_type] || cert.certification_type}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        {cert.issue_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cert.issue_date)}
                          </span>
                        )}
                        {cert.hours_completed && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {cert.hours_completed}h
                          </span>
                        )}
                        {cert.issuing_authority && (
                          <span>{cert.issuing_authority}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(cert)}
                    {cert.expiration_date && (
                      <span className="text-sm text-gray-500">
                        Exp: {formatDate(cert.expiration_date)}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <GlassButton variant="ghost" size="sm" onClick={() => openEditModal(cert)}>
                        <Edit className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton variant="ghost" size="sm" onClick={() => handleDelete(cert.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCert ? 'Editar Certificación' : 'Agregar Certificación'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Certificación *
              </label>
              <GlassSelect
                options={Object.entries(CERTIFICATION_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={formData.certification_type}
                onChange={(e) => setFormData({ ...formData, certification_type: e.target.value as CertificationType })}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Certificación
              </label>
              <GlassInput
                placeholder={CERTIFICATION_TYPE_LABELS[formData.certification_type]}
                value={formData.certification_name}
                onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Dejar vacío para usar el nombre predeterminado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organización Emisora
              </label>
              <GlassInput
                placeholder="Ej: DCF, American Red Cross"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Certificado
              </label>
              <GlassInput
                placeholder="Número o ID del certificado"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Emisión
              </label>
              <GlassInput
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Expiración
              </label>
              <GlassInput
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas Completadas
              </label>
              <GlassInput
                type="number"
                step="0.5"
                min="0"
                placeholder={REQUIRED_HOURS[formData.certification_type]?.toString() || '0'}
                value={formData.hours_completed || ''}
                onChange={(e) => setFormData({ ...formData, hours_completed: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
              {REQUIRED_HOURS[formData.certification_type] && (
                <p className="text-xs text-gray-500 mt-1">
                  Requeridas: {REQUIRED_HOURS[formData.certification_type]} horas
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Documento
              </label>
              <GlassInput
                placeholder="https://..."
                value={formData.document_url}
                onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                leftIcon={<FileText className="w-4 h-4" />}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                className="w-full px-4 py-3 bg-white/60 border border-blue-200/50 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                rows={2}
                placeholder="Notas adicionales..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingCert ? 'Guardar Cambios' : 'Agregar Certificación'
              )}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  )
}
