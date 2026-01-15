'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Baby,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassAvatar,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassTableEmpty,
} from '@/shared/components/ui'
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import type { ChildWithFamily, Classroom, Attendance } from '@/shared/types/database.types'
import { createClient } from '@/shared/lib/supabase/client'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

interface ChildDisplayData {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  age: string
  classroom: string
  classroomId: string | null
  status: 'present' | 'absent'
  parentName: string
  parentPhone: string
  allergies: string[]
  enrollmentDate: string
}

function calculateAge(dateOfBirth: string, t: ReturnType<typeof useTranslations>): string {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                 (today.getMonth() - birthDate.getMonth())

  if (months < 12) {
    return `${months} ${t.children.months}`
  }

  const years = Math.floor(months / 12)
  return `${years} ${t.children.years}`
}

export default function ChildrenPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [isLoading, setIsLoading] = useState(true)
  const [children, setChildren] = useState<ChildDisplayData[]>([])
  const [classrooms, setClassrooms] = useState<{ value: string; label: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'present', label: t.children.present },
    { value: 'absent', label: t.children.absent },
  ]

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  async function loadData() {
    try {
      setIsLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const supabase = createClient()

      // Load children, classrooms, and today's attendance in parallel
      const [childrenData, classroomsData, attendanceData] = await Promise.all([
        childrenService.getAll(),
        classroomsService.getAll(),
        supabase
          .from('attendance')
          .select('child_id, status')
          .eq('organization_id', DEMO_ORG_ID)
          .eq('date', today)
          .then(res => res.data || [])
      ])

      // Create attendance map
      const attendanceMap = new Map<string, string>()
      attendanceData.forEach((a: { child_id: string; status: string | null }) => {
        if (a.status) attendanceMap.set(a.child_id, a.status)
      })

      // Transform children data
      const transformedChildren: ChildDisplayData[] = childrenData.map(child => {
        const allergiesArray = Array.isArray(child.allergies)
          ? child.allergies as string[]
          : []

        return {
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          age: calculateAge(child.date_of_birth, t),
          classroom: child.classroom?.name || t.common.unassigned,
          classroomId: child.classroom_id,
          status: attendanceMap.get(child.id) === 'present' ? 'present' : 'absent',
          parentName: child.family?.primary_contact_name || 'N/A',
          parentPhone: child.family?.primary_contact_phone || 'N/A',
          allergies: allergiesArray,
          enrollmentDate: child.enrollment_date || '',
        }
      })

      setChildren(transformedChildren)

      // Transform classrooms for select
      setClassrooms([
        { value: '', label: t.common.allClassrooms },
        ...classroomsData.map(c => ({ value: c.id, label: c.name }))
      ])

    } catch (error) {
      console.error('Error loading children data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.common.deleteChildConfirm)) return

    try {
      await childrenService.delete(id)
      setChildren(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting child:', error)
      alert(t.common.deleteChildError)
    }
  }

  // Filter children based on search and filters
  const filteredChildren = children.filter((child) => {
    const matchesSearch =
      `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClassroom = !selectedClassroom || child.classroomId === selectedClassroom
    const matchesStatus = !selectedStatus || child.status === selectedStatus

    return matchesSearch && matchesClassroom && matchesStatus
  })

  const presentCount = children.filter((c) => c.status === 'present').length
  const absentCount = children.filter((c) => c.status === 'absent').length

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.children.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.children.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            {t.common.export}
          </GlassButton>
          <Link href="/dashboard/children/new">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.children.addChild}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {children.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.children.totalEnrolled}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {presentCount}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.dashboard.presentToday}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
              <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {absentCount}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.dashboard.absentToday}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <GlassInput
                placeholder={t.children.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassSelect
                options={classrooms}
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full sm:w-48"
              />
              <GlassSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Children List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredChildren.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">{t.common.noResults}</p>
          </GlassCard>
        ) : (
          filteredChildren.map((child) => (
            <GlassCard key={child.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GlassAvatar name={`${child.firstName} ${child.lastName}`} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{child.age} • {child.classroom}</p>
                  </div>
                </div>
                <GlassBadge
                  variant={child.status === 'present' ? 'success' : 'warning'}
                  dot
                  size="sm"
                >
                  {child.status === 'present' ? t.children.present : t.children.absent}
                </GlassBadge>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.children.parent}:</span>
                  <span className="text-gray-900">{child.parentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.children.phone}:</span>
                  <span className="text-gray-900">{child.parentPhone}</span>
                </div>
                {child.allergies.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t.children.allergies}:</span>
                    <div className="flex gap-1">
                      {child.allergies.map((allergy, index) => (
                        <GlassBadge key={index} variant="error" size="sm">
                          {allergy}
                        </GlassBadge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100 flex justify-end gap-2">
                <Link href={`/dashboard/children/${child.id}`}>
                  <GlassButton variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    {t.common.view}
                  </GlassButton>
                </Link>
                <Link href={`/dashboard/children/${child.id}/edit`}>
                  <GlassButton variant="ghost" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    {t.common.edit}
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Children Table - Desktop */}
      <div className="hidden md:block">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.children.childrenList}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>{t.children.child}</GlassTableHead>
                  <GlassTableHead>{t.children.age}</GlassTableHead>
                  <GlassTableHead>{t.children.classroom}</GlassTableHead>
                  <GlassTableHead>{t.children.parent}</GlassTableHead>
                  <GlassTableHead>{t.common.status}</GlassTableHead>
                  <GlassTableHead>{t.children.allergies}</GlassTableHead>
                  <GlassTableHead className="text-right">{t.common.actions}</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {filteredChildren.length === 0 ? (
                  <GlassTableEmpty title={t.common.noResults} />
                ) : (
                  filteredChildren.map((child) => (
                    <GlassTableRow key={child.id}>
                      <GlassTableCell>
                        <div className="flex items-center gap-3">
                          <GlassAvatar name={`${child.firstName} ${child.lastName}`} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(child.dateOfBirth)}
                            </p>
                          </div>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>{child.age}</GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge variant="default">{child.classroom}</GlassBadge>
                      </GlassTableCell>
                      <GlassTableCell>
                        <div>
                          <p className="text-gray-900">{child.parentName}</p>
                          <p className="text-sm text-gray-500">{child.parentPhone}</p>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge
                          variant={child.status === 'present' ? 'success' : 'warning'}
                          dot
                        >
                          {child.status === 'present' ? t.children.present : t.children.absent}
                        </GlassBadge>
                      </GlassTableCell>
                      <GlassTableCell>
                        {child.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {child.allergies.map((allergy, index) => (
                              <GlassBadge key={index} variant="error" size="sm">
                                {allergy}
                              </GlassBadge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </GlassTableCell>
                      <GlassTableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/children/${child.id}`}>
                            <GlassButton variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </GlassButton>
                          </Link>
                          <Link href={`/dashboard/children/${child.id}/edit`}>
                            <GlassButton variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </GlassButton>
                          </Link>
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            onClick={() => handleDelete(child.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </GlassButton>
                        </div>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))
                )}
              </GlassTableBody>
            </GlassTable>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
