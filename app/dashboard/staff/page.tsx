'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  UserCircle,
  Phone,
  Mail,
  Clock,
  Award,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { staffService } from '@/features/staff/services/staff.service'
import type { Profile } from '@/shared/types/database.types'
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

const roleOptions = [
  { value: '', label: 'Todos los Roles' },
  { value: 'director', label: 'Director' },
  { value: 'admin', label: 'Administrador' },
  { value: 'teacher', label: 'Maestro' },
  { value: 'assistant', label: 'Asistente' },
]

const statusOptions = [
  { value: '', label: 'Todos los Estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const roleLabels: Record<string, string> = {
  director: 'Director',
  teacher: 'Maestro',
  assistant: 'Asistente',
  admin: 'Administrador',
}

export default function StaffPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [staff, setStaff] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, teachers: 0, assistants: 0 })

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      setIsLoading(true)
      const [staffData, statsData] = await Promise.all([
        staffService.getAll(),
        staffService.getStats(),
      ])
      setStaff(staffData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter staff based on search and filters
  const filteredStaff = staff.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !selectedRole || member.role === selectedRole
    const matchesStatus = !selectedStatus || member.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

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
            {t.staff.title}
          </h1>
          <p className="text-gray-500">
            {t.staff.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            {t.common.export}
          </GlassButton>
          <Link href="/dashboard/staff/new">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.staff.addStaff}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500">Total Personal</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.teachers}
              </p>
              <p className="text-sm text-gray-500">Maestros</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.assistants}
              </p>
              <p className="text-sm text-gray-500">Asistentes</p>
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
                placeholder={t.staff.searchStaff}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassSelect
                options={roleOptions}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-48"
              />
              <GlassSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Staff List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredStaff.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">{t.staff.noStaffFound}</p>
          </GlassCard>
        ) : (
          filteredStaff.map((member) => (
            <GlassCard key={member.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GlassAvatar name={`${member.first_name} ${member.last_name}`} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{roleLabels[member.role || 'teacher']}</p>
                  </div>
                </div>
                <GlassBadge
                  variant={member.status === 'active' ? 'success' : 'default'}
                  dot
                  size="sm"
                >
                  {member.status === 'active' ? 'Activo' : 'Inactivo'}
                </GlassBadge>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100 space-y-2">
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 truncate">{member.email}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100 flex justify-end gap-2">
                <Link href={`/dashboard/staff/${member.id}`}>
                  <GlassButton variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    {t.common.view}
                  </GlassButton>
                </Link>
                <Link href={`/dashboard/staff/${member.id}/edit`}>
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

      {/* Staff Table - Desktop */}
      <div className="hidden md:block">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Lista de Personal</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>Empleado</GlassTableHead>
                  <GlassTableHead>Rol</GlassTableHead>
                  <GlassTableHead>Teléfono</GlassTableHead>
                  <GlassTableHead>Estado</GlassTableHead>
                  <GlassTableHead className="text-right">{t.common.actions}</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {filteredStaff.length === 0 ? (
                  <GlassTableEmpty title={t.staff.noStaffFound} />
                ) : (
                  filteredStaff.map((member) => (
                    <GlassTableRow key={member.id}>
                      <GlassTableCell>
                        <div className="flex items-center gap-3">
                          <GlassAvatar name={`${member.first_name} ${member.last_name}`} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge variant="default">{roleLabels[member.role || 'teacher']}</GlassBadge>
                      </GlassTableCell>
                      <GlassTableCell>
                        {member.phone || <span className="text-gray-400">-</span>}
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge
                          variant={member.status === 'active' ? 'success' : 'default'}
                          dot
                        >
                          {member.status === 'active' ? 'Activo' : 'Inactivo'}
                        </GlassBadge>
                      </GlassTableCell>
                      <GlassTableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/staff/${member.id}`}>
                            <GlassButton variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </GlassButton>
                          </Link>
                          <Link href={`/dashboard/staff/${member.id}/edit`}>
                            <GlassButton variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </GlassButton>
                          </Link>
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
