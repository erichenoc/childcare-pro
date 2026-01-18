'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  Users,
  Download,
  CheckCircle,
  XCircle,
  Minus,
  Loader2,
  LogIn,
  LogOut,
  Monitor,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { attendanceService } from '@/features/attendance/services/attendance.service'
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import type { AttendanceWithChild, Child, Classroom } from '@/shared/types/database.types'
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
} from '@/shared/components/ui'

type AttendanceRecord = {
  childId: string
  childName: string
  classroomId: string
  classroomName: string
  status: 'not_recorded' | 'present' | 'absent' | 'checked_out'
  checkInTime: string | null
  checkOutTime: string | null
  notes: string | null
}

export default function AttendancePage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [isLoading, setIsLoading] = useState(true)
  const [children, setChildren] = useState<Child[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)

      const [childrenData, classroomsData, attendanceData] = await Promise.all([
        childrenService.getAll(),
        classroomsService.getAll(),
        attendanceService.getByDate(todayStr),
      ])

      setChildren(childrenData)
      setClassrooms(classroomsData)

      // Build attendance records combining children with their attendance
      const records: AttendanceRecord[] = childrenData
        .filter(child => child.status === 'active')
        .map(child => {
          const attendance = attendanceData.find(a => a.child_id === child.id)
          const classroom = classroomsData.find(c => c.id === child.classroom_id)

          let status: AttendanceRecord['status'] = 'not_recorded'
          if (attendance) {
            if (attendance.status === 'absent') {
              status = 'absent'
            } else if (attendance.check_out_time) {
              status = 'checked_out'
            } else if (attendance.check_in_time) {
              status = 'present'
            }
          }

          return {
            childId: child.id,
            childName: `${child.first_name} ${child.last_name}`,
            classroomId: child.classroom_id || '',
            classroomName: classroom?.name || t.common.unassigned,
            status,
            checkInTime: attendance?.check_in_time || null,
            checkOutTime: attendance?.check_out_time || null,
            notes: attendance?.notes || null,
          }
        })

      setAttendanceRecords(records)
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCheckIn(childId: string, classroomId: string) {
    if (!classroomId) {
      alert(t.attendance.noClassroomAssigned)
      return
    }

    try {
      setLoadingAction(childId)
      await attendanceService.checkIn(childId, classroomId)
      await loadData()
    } catch (error) {
      console.error('Error checking in:', error)
      alert(t.attendance.checkInError)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleCheckOut(childId: string) {
    try {
      setLoadingAction(childId)
      await attendanceService.checkOut(childId)
      await loadData()
    } catch (error) {
      console.error('Error checking out:', error)
      alert(t.attendance.checkOutError)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleMarkAbsent(childId: string) {
    try {
      setLoadingAction(childId)
      await attendanceService.markAbsent(childId, todayStr)
      await loadData()
    } catch (error) {
      console.error('Error marking absent:', error)
      alert(t.attendance.markAbsentError)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.childName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClassroom = !selectedClassroom || record.classroomId === selectedClassroom
    const matchesStatus = !selectedStatus || record.status === selectedStatus

    return matchesSearch && matchesClassroom && matchesStatus
  })

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length
  const checkedOutCount = attendanceRecords.filter((r) => r.status === 'checked_out').length
  const notRecordedCount = attendanceRecords.filter((r) => r.status === 'not_recorded').length
  const totalCount = attendanceRecords.length

  const classroomOptions = [
    { value: '', label: t.common.allClassrooms },
    ...classrooms.map(c => ({ value: c.id, label: c.name })),
  ]

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'present', label: t.attendance.present },
    { value: 'absent', label: t.attendance.absent },
    { value: 'checked_out', label: t.attendance.checkedOut },
    { value: 'not_recorded', label: t.attendance.notRecorded },
  ]

  function formatTime(isoString: string | null) {
    if (!isoString) return null
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusBadge(status: AttendanceRecord['status']) {
    switch (status) {
      case 'present':
        return <GlassBadge variant="success" dot>{t.attendance.present}</GlassBadge>
      case 'absent':
        return <GlassBadge variant="error" dot>{t.attendance.absent}</GlassBadge>
      case 'checked_out':
        return <GlassBadge variant="default" dot>{t.attendance.checkedOut}</GlassBadge>
      case 'not_recorded':
        return <GlassBadge variant="warning" dot>{t.attendance.notRecorded}</GlassBadge>
      default:
        return null
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.attendance.title}
          </h1>
          <p className="text-gray-500">
            {formatDate(today.toISOString())} - {t.attendance.dailyAttendance}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/attendance/kiosk">
            <GlassButton variant="primary" leftIcon={<Monitor className="w-4 h-4" />}>
              Modo Kiosco
            </GlassButton>
          </Link>
          <GlassButton variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            {t.common.export}
          </GlassButton>
        </div>
      </div>

      {/* Quick Actions - DCF Ratios Link */}
      <GlassCard className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-primary-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ratios DCF en Tiempo Real</p>
              <p className="text-sm text-gray-500">
                {presentCount} niños presentes en {classrooms.filter(c => c.status === 'active').length} salones
              </p>
            </div>
          </div>
          <Link href="/dashboard/classrooms">
            <GlassButton variant="secondary" size="sm">
              Ver Ratios por Salón
            </GlassButton>
          </Link>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500">{t.attendance.expected}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
              <p className="text-sm text-gray-500">{t.attendance.present}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
              <p className="text-sm text-gray-500">{t.attendance.absent}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{checkedOutCount}</p>
              <p className="text-sm text-gray-500">{t.attendance.checkedOut}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Minus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notRecordedCount}</p>
              <p className="text-sm text-gray-500">{t.attendance.notRecorded}</p>
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
                placeholder={t.attendance.searchAttendance}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassSelect
                options={classroomOptions}
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

      {/* Attendance List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">{t.attendance.noAttendanceRecords}</p>
          </GlassCard>
        ) : (
          filteredRecords.map((record) => (
            <GlassCard key={record.childId} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <GlassAvatar name={record.childName} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{record.childName}</p>
                    <p className="text-sm text-gray-500">{record.classroomName}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  {record.status !== 'absent' && record.status !== 'not_recorded' && (
                    <div className="flex items-center gap-4 text-sm">
                      {record.checkInTime && (
                        <div>
                          <span className="text-gray-500">{t.attendance.entryTime}:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatTime(record.checkInTime)}
                          </span>
                        </div>
                      )}
                      {record.checkOutTime && (
                        <div>
                          <span className="text-gray-500">{t.attendance.exitTime}:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatTime(record.checkOutTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {record.notes && (
                    <div className="text-sm">
                      <span className="text-gray-500">{t.attendance.note}:</span>
                      <span className="ml-1 font-medium text-gray-900">{record.notes}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap gap-2 justify-end">
                {loadingAction === record.childId ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                ) : (
                  <>
                    {(record.status === 'not_recorded' || record.status === 'absent') && (
                      <>
                        <GlassButton
                          variant="primary"
                          size="sm"
                          leftIcon={<LogIn className="w-4 h-4" />}
                          onClick={() => handleCheckIn(record.childId, record.classroomId)}
                        >
                          {t.attendance.checkIn}
                        </GlassButton>
                        {record.status === 'not_recorded' && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            onClick={() => handleMarkAbsent(record.childId)}
                          >
                            {t.attendance.markAbsent}
                          </GlassButton>
                        )}
                      </>
                    )}

                    {record.status === 'present' && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        leftIcon={<LogOut className="w-4 h-4" />}
                        onClick={() => handleCheckOut(record.childId)}
                      >
                        {t.attendance.checkOut}
                      </GlassButton>
                    )}
                  </>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
