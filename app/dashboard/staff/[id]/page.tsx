'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  MapPin,
  Loader2,
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
import { staffService, type StaffWithAssignments } from '@/features/staff/services/staff.service'

const roleLabels: Record<string, string> = {
  teacher: 'Maestro/a',
  lead_teacher: 'Maestro/a Principal',
  assistant: 'Asistente',
  director: 'Director/a',
  owner: 'Propietario',
  parent: 'Padre/Madre',
}

export default function StaffDetailPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [staff, setStaff] = useState<StaffWithAssignments | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStaff()
  }, [staffId])

  async function loadStaff() {
    try {
      setIsLoading(true)
      const data = await staffService.getById(staffId)
      setStaff(data)
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!confirm('Esta seguro de que desea desactivar este miembro del personal?')) return

    try {
      await staffService.update(staffId, { status: 'inactive' })
      loadStaff()
    } catch (error) {
      console.error('Error deactivating staff:', error)
    }
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
  const certifications = Array.isArray(staff.certifications) ? staff.certifications : []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/staff">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div className="flex items-center gap-3">
            <GlassAvatar name={fullName} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <div className="flex items-center gap-2">
                <GlassBadge variant="default">{roleLabels[staff.role || 'teacher'] || staff.role}</GlassBadge>
                <GlassBadge variant={staff.status === 'active' ? 'success' : 'default'} dot>
                  {staff.status === 'active' ? 'Activo' : 'Inactivo'}
                </GlassBadge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/staff/${staffId}/edit`}>
            <GlassButton variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </GlassButton>
          </Link>
{staff?.status === 'active' && (
            <GlassButton variant="ghost" className="text-error" onClick={handleDeactivate}>
              <Trash2 className="w-4 h-4" />
            </GlassButton>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informacion de Contacto
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{staff.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="text-gray-900">{staff.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {staff.emergency_contact && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Contacto de Emergencia</p>
                  <p className="text-gray-600">
                    {typeof staff.emergency_contact === 'object'
                      ? JSON.stringify(staff.emergency_contact)
                      : String(staff.emergency_contact)}
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Certifications */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificaciones
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, index) => (
                    <GlassBadge key={index} variant="success">
                      {String(cert)}
                    </GlassBadge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sin certificaciones registradas</p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Assigned Classrooms */}
          {staff.staff_assignments && staff.staff_assignments.length > 0 && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Salones Asignados
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  {staff.staff_assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-900">{assignment.classroom?.name || 'Salon'}</span>
                      {assignment.is_lead && (
                        <GlassBadge variant="primary" size="sm">Lider</GlassBadge>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informacion Laboral
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha de Contratacion</span>
                <span className="text-gray-900">
                  {staff.hire_date ? formatDate(staff.hire_date) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rol</span>
                <span className="text-gray-900">{roleLabels[staff.role || 'teacher'] || staff.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <GlassBadge variant={staff.status === 'active' ? 'success' : 'default'} size="sm">
                  {staff.status === 'active' ? 'Activo' : 'Inactivo'}
                </GlassBadge>
              </div>
            </GlassCardContent>
          </GlassCard>

        </div>
      </div>
    </div>
  )
}
