'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  Baby,
  MapPin,
  Loader2,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassRatioIndicator,
} from '@/shared/components/ui'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import type { Classroom } from '@/shared/types/database.types'

const ageGroupLabels: Record<string, string> = {
  infant: 'Bebes (0-12 meses)',
  toddler: 'Toddlers (1-2 anos)',
  twos: '2 anos',
  threes: '3 anos',
  fours: '4 anos',
  school_age: 'Edad Escolar',
}

const dcfRatios: Record<string, number> = {
  infant: 4,
  toddler: 6,
  twos: 11,
  threes: 15,
  fours: 20,
  school_age: 25,
}

export default function ClassroomDetailPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const classroomId = params.id as string

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ children_count: 0, staff_count: 0 })

  useEffect(() => {
    loadClassroom()
  }, [classroomId])

  async function loadClassroom() {
    try {
      setIsLoading(true)
      const data = await classroomsService.getById(classroomId)
      setClassroom(data)

      // Get stats from withStats query
      const allClassrooms = await classroomsService.getWithStats()
      const currentStats = allClassrooms.find(c => c.id === classroomId)
      if (currentStats) {
        setStats({
          children_count: currentStats.children_count,
          staff_count: currentStats.staff_count,
        })
      }
    } catch (error) {
      console.error('Error loading classroom:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Esta seguro de que desea eliminar este salon?')) return

    try {
      await classroomsService.delete(classroomId)
      router.push('/dashboard/classrooms')
    } catch (error) {
      console.error('Error deleting classroom:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Salon no encontrado</p>
        <Link href="/dashboard/classrooms">
          <GlassButton variant="secondary" className="mt-4">
            Volver a Salones
          </GlassButton>
        </Link>
      </div>
    )
  }

  const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15
  const currentRatio = stats.staff_count > 0
    ? Math.round((stats.children_count / stats.staff_count) * 10) / 10
    : 0

  function getRatioStatus(): 'compliant' | 'warning' | 'non-compliant' {
    if (stats.staff_count === 0) return 'warning'
    if (currentRatio <= requiredRatio) return 'compliant'
    if (currentRatio <= requiredRatio * 1.1) return 'warning'
    return 'non-compliant'
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/classrooms">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: classroom.color || '#3B82F6' }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
              <div className="flex items-center gap-2">
                <GlassBadge variant="default">
                  {ageGroupLabels[classroom.age_group || 'threes'] || classroom.age_group}
                </GlassBadge>
                <GlassBadge variant={classroom.status === 'active' ? 'success' : 'default'} dot>
                  {classroom.status === 'active' ? 'Activo' : 'Inactivo'}
                </GlassBadge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/classrooms/${classroomId}/edit`}>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ratio Monitor */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Monitor de Ratio DCF
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <GlassRatioIndicator
                ageGroup={classroom.name}
                currentRatio={`${currentRatio}:1`}
                requiredRatio={`${requiredRatio}:1`}
                status={getRatioStatus()}
                childrenCount={stats.children_count}
                staffCount={stats.staff_count}
              />
            </GlassCardContent>
          </GlassCard>

          {/* Stats */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5" />
                Estadisticas del Salon
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.children_count}</p>
                  <p className="text-sm text-gray-500">Ninos Presentes</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.staff_count}</p>
                  <p className="text-sm text-gray-500">Personal Asignado</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 text-center">
                  <p className="text-3xl font-bold text-gray-600">{classroom.capacity || '-'}</p>
                  <p className="text-sm text-gray-500">Capacidad Maxima</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Description */}
          {classroom.description && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Descripcion</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{classroom.description}</p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informacion
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Grupo de Edad</span>
                <span className="text-gray-900">
                  {ageGroupLabels[classroom.age_group || 'threes']}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ratio DCF Requerido</span>
                <span className="text-gray-900">{requiredRatio}:1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Capacidad</span>
                <span className="text-gray-900">{classroom.capacity || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <GlassBadge variant={classroom.status === 'active' ? 'success' : 'default'} size="sm">
                  {classroom.status === 'active' ? 'Activo' : 'Inactivo'}
                </GlassBadge>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Color Preview */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Color del Salon</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div
                className="w-full h-16 rounded-xl"
                style={{ backgroundColor: classroom.color || '#3B82F6' }}
              />
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
