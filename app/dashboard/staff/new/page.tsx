'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  { value: 'pending', label: 'Pendiente' },
]

export default function NewStaffPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'teacher' as 'owner' | 'director' | 'lead_teacher' | 'teacher' | 'assistant' | 'parent',
    status: 'active' as 'active' | 'inactive' | 'pending',
    hire_date: new Date().toISOString().split('T')[0],
    certifications: '',
    emergency_contact: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name) return

    try {
      setIsSaving(true)
      await staffService.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@temp.local`,
        phone: formData.phone || null,
        role: formData.role,
        status: formData.status,
        hire_date: formData.hire_date || null,
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : null,
        emergency_contact: formData.emergency_contact || null,
      })
      router.push('/dashboard/staff')
    } catch (error) {
      console.error('Error creating staff:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Personal</h1>
          <p className="text-gray-500">Agregar un nuevo miembro del equipo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informacion Personal
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
                  placeholder="(305) 555-0000"
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto de Emergencia
                </label>
                <GlassInput
                  placeholder="Nombre y telefono"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificaciones (separadas por coma)
                </label>
                <GlassInput
                  placeholder="CPR, First Aid, CDA..."
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link href="/dashboard/staff">
                <GlassButton variant="ghost" type="button">
                  Cancelar
                </GlassButton>
              </Link>
              <GlassButton variant="primary" type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Guardar
              </GlassButton>
            </div>
          </GlassCardContent>
        </GlassCard>
      </form>
    </div>
  )
}
