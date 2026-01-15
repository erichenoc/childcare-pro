'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  GraduationCap,
  Users,
  UserCircle,
  Eye,
  Edit,
  Baby,
  Loader2,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import { classroomsService, type ClassroomWithStats } from '@/features/classrooms/services/classrooms.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassBadge,
  GlassRatioIndicator,
} from '@/shared/components/ui'

const ageGroupLabels: Record<string, string> = {
  infant: 'Bebés (0-12 meses)',
  toddler: 'Toddlers (1-2 años)',
  twos: '2 años',
  threes: '3 años',
  fours: '4 años',
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

export default function ClassroomsPage() {
  const t = useTranslations()

  const [classrooms, setClassrooms] = useState<ClassroomWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadClassrooms()
  }, [])

  async function loadClassrooms() {
    try {
      setIsLoading(true)
      const data = await classroomsService.getWithStats()
      setClassrooms(data)
    } catch (error) {
      console.error('Error loading classrooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClassrooms = classrooms.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCapacity = classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)
  const totalChildren = classrooms.reduce((sum, c) => sum + c.children_count, 0)
  const totalStaff = classrooms.reduce((sum, c) => sum + c.staff_count, 0)
  const activeClassrooms = classrooms.filter(c => c.status === 'active').length

  function getRatioStatus(classroom: ClassroomWithStats): 'compliant' | 'warning' | 'non-compliant' {
    const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15
    if (classroom.staff_count === 0) return 'warning'
    if (classroom.current_ratio <= requiredRatio) return 'compliant'
    if (classroom.current_ratio <= requiredRatio * 1.1) return 'warning'
    return 'non-compliant'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.classrooms.title}
          </h1>
          <p className="text-gray-500">
            {t.classrooms.subtitle}
          </p>
        </div>

        <Link href="/dashboard/classrooms/new">
          <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            {t.classrooms.addClassroom}
          </GlassButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeClassrooms}</p>
              <p className="text-sm text-gray-500">Salones Activos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Baby className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalChildren}</p>
              <p className="text-sm text-gray-500">Niños Presentes</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
              <p className="text-sm text-gray-500">Personal Asignado</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
              <p className="text-sm text-gray-500">Capacidad Total</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <GlassInput
            placeholder={t.classrooms.searchClassrooms}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </GlassCardContent>
      </GlassCard>

      {/* Ratio Monitor */}
      {classrooms.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.classrooms.ratioMonitor}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classrooms.map((classroom) => {
                const status = getRatioStatus(classroom)
                const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15
                return (
                  <GlassRatioIndicator
                    key={classroom.id}
                    ageGroup={classroom.name}
                    currentRatio={`${classroom.current_ratio}:1`}
                    requiredRatio={`${requiredRatio}:1`}
                    status={status}
                    childrenCount={classroom.children_count}
                    staffCount={classroom.staff_count}
                  />
                )
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Classrooms Grid */}
      {filteredClassrooms.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">{t.classrooms.noClassroomsFound}</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom) => {
            const ratioStatus = getRatioStatus(classroom)
            const requiredRatio = dcfRatios[classroom.age_group || 'threes'] || 15

            return (
              <GlassCard key={classroom.id} className="overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: classroom.color || '#3B82F6' }}
                />
                <GlassCardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <GlassCardTitle className="text-lg">{classroom.name}</GlassCardTitle>
                    <GlassBadge variant={classroom.status === 'active' ? 'success' : 'default'} size="sm">
                      {classroom.status === 'active' ? 'Activo' : 'Inactivo'}
                    </GlassBadge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {ageGroupLabels[classroom.age_group || 'threes'] || classroom.age_group}
                  </p>
                </GlassCardHeader>

                <GlassCardContent className="space-y-4">
                  {/* Ratio Indicator */}
                  <div className="p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Ratio DCF</span>
                      <GlassBadge
                        variant={ratioStatus === 'compliant' ? 'success' : ratioStatus === 'warning' ? 'warning' : 'error'}
                        size="sm"
                      >
                        {classroom.current_ratio}:1
                      </GlassBadge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Actual: <strong>{classroom.current_ratio}:1</strong>
                      </span>
                      <span className="text-gray-600">
                        Requerido: <strong>{requiredRatio}:1</strong>
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <p className="text-lg font-bold text-blue-600">{classroom.children_count}</p>
                      <p className="text-xs text-gray-500">Niños</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50">
                      <p className="text-lg font-bold text-purple-600">{classroom.staff_count}</p>
                      <p className="text-xs text-gray-500">Staff</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-lg font-bold text-gray-600">{classroom.capacity || '-'}</p>
                      <p className="text-xs text-gray-500">Capacidad</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Link href={`/dashboard/classrooms/${classroom.id}`}>
                      <GlassButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </GlassButton>
                    </Link>
                    <Link href={`/dashboard/classrooms/${classroom.id}/edit`}>
                      <GlassButton variant="ghost" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </GlassButton>
                    </Link>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
