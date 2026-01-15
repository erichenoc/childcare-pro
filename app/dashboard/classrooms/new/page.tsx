'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, GraduationCap } from 'lucide-react'
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
import { classroomsService } from '@/features/classrooms/services/classrooms.service'

const ageGroupOptions = [
  { value: 'infant', label: 'Bebes (0-12 meses)' },
  { value: 'toddler', label: 'Toddlers (1-2 anos)' },
  { value: 'twos', label: '2 anos' },
  { value: 'threes', label: '3 anos' },
  { value: 'fours', label: '4 anos' },
  { value: 'school_age', label: 'Edad Escolar' },
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Naranja' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Purpura' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#84CC16', label: 'Lima' },
]

export default function NewClassroomPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age_group: 'threes',
    capacity: '',
    status: 'active',
    color: '#3B82F6',
    description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) return

    try {
      setIsSaving(true)

      const classroom = await classroomsService.create({
        name: formData.name,
        age_group: formData.age_group as 'infant' | 'toddler' | 'twos' | 'threes' | 'fours' | 'school_age',
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: formData.status as 'active' | 'inactive',
        color: formData.color,
        description: formData.description || undefined,
      })

      router.push(`/dashboard/classrooms/${classroom.id}`)
    } catch (error) {
      console.error('Error creating classroom:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/classrooms">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Salon</h1>
          <p className="text-gray-500">Agregar un nuevo salon de clases</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Informacion del Salon
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Salon *
                </label>
                <GlassInput
                  placeholder="Ej: Salon Estrellas, Cuarto de Bebes..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo de Edad *
                </label>
                <GlassSelect
                  options={ageGroupOptions}
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad Maxima
                </label>
                <GlassInput
                  type="number"
                  placeholder="Ej: 20"
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <GlassSelect
                    options={colorOptions}
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-200"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripcion
                </label>
                <GlassTextarea
                  placeholder="Descripcion del salon..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Link href="/dashboard/classrooms">
                <GlassButton variant="ghost" type="button">
                  Cancelar
                </GlassButton>
              </Link>
              <GlassButton variant="primary" type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Crear Salon
              </GlassButton>
            </div>
          </GlassCardContent>
        </GlassCard>
      </form>
    </div>
  )
}
