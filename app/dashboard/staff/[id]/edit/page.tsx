'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, User } from 'lucide-react'
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
import { staffService } from '@/features/staff/services/staff.service'

const roleOptions = [
  { value: 'teacher', label: 'Maestro/a' },
  { value: 'lead_teacher', label: 'Maestro/a Principal' },
  { value: 'assistant', label: 'Asistente' },
  { value: 'director', label: 'Director/a' },
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export default function EditStaffPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'teacher',
    status: 'active',
    hire_date: '',
    certifications: '',
  })

  useEffect(() => {
    loadStaff()
  }, [staffId])

  async function loadStaff() {
    try {
      setIsLoading(true)
      const staff = await staffService.getById(staffId)

      if (staff) {
        const certifications = Array.isArray(staff.certifications)
          ? staff.certifications.join(', ')
          : ''

        setFormData({
          first_name: staff.first_name,
          last_name: staff.last_name,
          email: staff.email || '',
          phone: staff.phone || '',
          role: staff.role || 'teacher',
          status: staff.status || 'active',
          hire_date: staff.hire_date || '',
          certifications,
        })
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name) return

    try {
      setIsSaving(true)

      const certifications = formData.certifications
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      await staffService.update(staffId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role as 'teacher' | 'assistant' | 'director' | 'lead_teacher',
        status: formData.status as 'active' | 'inactive',
        hire_date: formData.hire_date || null,
        certifications,
      })

      router.push(`/dashboard/staff/${staffId}`)
    } catch (error) {
      console.error('Error updating staff:', error)
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
        <Link href={`/dashboard/staff/${staffId}`}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Personal</h1>
          <p className="text-gray-500">Actualizar informacion del miembro del personal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informacion del Personal
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <GlassInput
                  placeholder="Nombre"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <GlassInput
                  placeholder="Apellido"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <GlassInput
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <GlassInput
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <GlassSelect
                  options={roleOptions}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                  Fecha de Contratacion
                </label>
                <GlassInput
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificaciones
                </label>
                <GlassInput
                  placeholder="CPR, Primeros Auxilios, CDA (separados por coma)"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Separar multiples certificaciones con coma</p>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link href={`/dashboard/staff/${staffId}`}>
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
