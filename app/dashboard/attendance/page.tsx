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
  X,
  User,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { attendanceService } from '@/features/attendance/services/attendance.service'
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import type { AttendanceWithChild, Child, Classroom } from '@/shared/types/database.types'
import type { AuthorizedPickupPerson, PickupPersonType } from '@/shared/types/attendance-extended'
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
  GlassModal,
  GlassAllergyAlert,
} from '@/shared/components/ui'

type AttendanceRecord = {
  childId: string
  childName: string
  childFirstName: string
  classroomId: string
  classroomName: string
  status: 'not_recorded' | 'present' | 'absent' | 'checked_out'
  checkInTime: string | null
  checkOutTime: string | null
  checkInPersonName: string | null
  checkOutPersonName: string | null
  checkOutVerified: boolean | null
  notes: string | null
  allergies: string[] | null
}

// Modal for selecting drop-off/pickup person
interface PickupModalProps {
  isOpen: boolean
  onClose: () => void
  childId: string
  childName: string
  mode: 'check_in' | 'check_out'
  onConfirm: (
    personId: string | undefined,
    personType: PickupPersonType | undefined,
    personName: string,
    relationship: string,
    verified: boolean,
    verificationMethod?: string
  ) => void
}

function PickupPersonModal({ isOpen, onClose, childId, childName, mode, onConfirm }: PickupModalProps) {
  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPickupPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<AuthorizedPickupPerson | null>(null)
  const [customName, setCustomName] = useState('')
  const [customRelationship, setCustomRelationship] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<string>('known_person')

  useEffect(() => {
    if (isOpen && childId) {
      loadAuthorizedPeople()
    }
  }, [isOpen, childId])

  async function loadAuthorizedPeople() {
    try {
      setIsLoading(true)
      const people = await attendanceService.getAuthorizedPickups(childId)
      setAuthorizedPeople(people)
    } catch (error) {
      console.error('Error loading authorized pickups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectPerson(person: AuthorizedPickupPerson) {
    setSelectedPerson(person)
    setUseCustom(false)
  }

  function handleConfirm() {
    if (useCustom) {
      if (!customName.trim()) {
        alert('Por favor ingrese el nombre de la persona')
        return
      }
      // For custom entries, not verified unless staff override
      onConfirm(
        undefined,
        undefined,
        customName,
        customRelationship || 'Otro',
        verificationMethod === 'staff_override',
        verificationMethod
      )
    } else if (selectedPerson) {
      onConfirm(
        selectedPerson.person_id,
        selectedPerson.person_type,
        selectedPerson.name,
        selectedPerson.relationship,
        true,
        selectedPerson.has_photo ? 'photo_match' : 'known_person'
      )
    } else {
      // Quick action - no specific person selected
      onConfirm(undefined, undefined, '', '', false, undefined)
    }

    // Reset state
    setSelectedPerson(null)
    setCustomName('')
    setCustomRelationship('')
    setUseCustom(false)
    onClose()
  }

  const title = mode === 'check_in' ? 'Registrar Entrada' : 'Registrar Salida'
  const subtitle = mode === 'check_in'
    ? '¿Quién trae al niño?'
    : '¿Quién recoge al niño?'

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-center pb-2 border-b border-gray-200">
          <p className="text-lg font-semibold text-gray-900">{childName}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Authorized People List */}
            {authorizedPeople.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Personas Autorizadas
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {authorizedPeople.map((person) => (
                    <button
                      key={`${person.person_type}-${person.person_id}`}
                      onClick={() => handleSelectPerson(person)}
                      className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${
                        selectedPerson?.person_id === person.person_id && !useCustom
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {person.photo_url ? (
                          <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.relationship}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {person.has_photo && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Foto
                          </span>
                        )}
                        {person.has_id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            ID
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          person.person_type === 'guardian'
                            ? 'bg-purple-100 text-purple-700'
                            : person.person_type === 'authorized'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {person.person_type === 'guardian' ? 'Padre/Tutor' :
                           person.person_type === 'authorized' ? 'Autorizado' : 'Emergencia'}
                        </span>
                      </div>
                      {selectedPerson?.person_id === person.person_id && !useCustom && (
                        <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Entry Section */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setUseCustom(!useCustom)
                  setSelectedPerson(null)
                }}
                className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  useCustom
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">Otra Persona (No en lista)</span>
                {useCustom && <CheckCircle className="w-5 h-5 text-orange-600 ml-auto" />}
              </button>

              {useCustom && (
                <div className="mt-3 p-3 bg-orange-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm text-orange-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Esta persona no está en la lista de autorizados</span>
                  </div>
                  <GlassInput
                    label="Nombre Completo"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nombre de quien trae/recoge"
                    required
                  />
                  <GlassInput
                    label="Relación"
                    value={customRelationship}
                    onChange={(e) => setCustomRelationship(e.target.value)}
                    placeholder="Ej: Tío, Vecino, Amigo"
                  />
                  {mode === 'check_out' && (
                    <GlassSelect
                      label="Método de Verificación"
                      options={[
                        { value: 'staff_override', label: 'Aprobación del Staff (Emergencia)' },
                        { value: 'id_check', label: 'Verificación de ID' },
                        { value: 'phone_verification', label: 'Verificación por Teléfono' },
                      ]}
                      value={verificationMethod}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <GlassButton
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {mode === 'check_in' ? 'Registrar Entrada' : 'Registrar Salida'}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  )
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

  // Modal state
  const [pickupModalOpen, setPickupModalOpen] = useState(false)
  const [pickupModalMode, setPickupModalMode] = useState<'check_in' | 'check_out'>('check_in')
  const [selectedChildForModal, setSelectedChildForModal] = useState<{
    id: string
    name: string
    classroomId: string
  } | null>(null)

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
          const attendance = attendanceData.find(a => a.child_id === child.id) as AttendanceWithChild & {
            check_in_person_name?: string | null
            check_out_person_name?: string | null
            check_out_verified?: boolean | null
          } | undefined
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

          // Normalize allergies from Json (array stored as JSON) to string[]
          const rawAllergies = child.allergies
          const allergyList: string[] | null = Array.isArray(rawAllergies)
            ? (rawAllergies as string[]).filter(Boolean)
            : typeof rawAllergies === 'string' && rawAllergies.trim()
              ? [rawAllergies.trim()]
              : null

          return {
            childId: child.id,
            childName: `${child.first_name} ${child.last_name}`,
            childFirstName: child.first_name,
            classroomId: child.classroom_id || '',
            classroomName: classroom?.name || t.common.unassigned,
            status,
            checkInTime: attendance?.check_in_time || null,
            checkOutTime: attendance?.check_out_time || null,
            checkInPersonName: attendance?.check_in_person_name || null,
            checkOutPersonName: attendance?.check_out_person_name || null,
            checkOutVerified: attendance?.check_out_verified || null,
            notes: attendance?.notes || null,
            allergies: allergyList && allergyList.length > 0 ? allergyList : null,
          }
        })

      setAttendanceRecords(records)
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openCheckInModal(childId: string, childName: string, classroomId: string) {
    if (!classroomId) {
      alert(t.attendance.noClassroomAssigned)
      return
    }
    setSelectedChildForModal({ id: childId, name: childName, classroomId })
    setPickupModalMode('check_in')
    setPickupModalOpen(true)
  }

  function openCheckOutModal(childId: string, childName: string, classroomId: string) {
    setSelectedChildForModal({ id: childId, name: childName, classroomId })
    setPickupModalMode('check_out')
    setPickupModalOpen(true)
  }

  async function handleCheckInConfirm(
    personId: string | undefined,
    personType: PickupPersonType | undefined,
    personName: string,
    relationship: string,
    _verified: boolean,
    _verificationMethod?: string
  ) {
    if (!selectedChildForModal) return

    try {
      setLoadingAction(selectedChildForModal.id)
      await attendanceService.checkIn(
        selectedChildForModal.id,
        selectedChildForModal.classroomId,
        undefined,
        {
          person_name: personName || undefined,
          person_relationship: relationship || undefined,
          guardian_id: personId,
        }
      )
      await loadData()
    } catch (error) {
      console.error('Error checking in:', error)
      alert(t.attendance.checkInError)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleCheckOutConfirm(
    personId: string | undefined,
    personType: PickupPersonType | undefined,
    personName: string,
    relationship: string,
    verified: boolean,
    verificationMethod?: string
  ) {
    if (!selectedChildForModal) return

    try {
      setLoadingAction(selectedChildForModal.id)

      const result = await attendanceService.checkOutWithData({
        child_id: selectedChildForModal.id,
        pickup_person_id: personId,
        pickup_person_type: personType,
        pickup_person_name: personName,
        pickup_person_relationship: relationship,
        verified,
        verification_method: verificationMethod as 'id_check' | 'photo_match' | 'known_person' | 'staff_override' | undefined,
      })

      if (!result.success) {
        alert(result.error || t.attendance.checkOutError)
        return
      }

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
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{record.childName}</p>
                    <p className="text-sm text-gray-500">{record.classroomName}</p>
                    {record.allergies && (
                      <GlassAllergyAlert
                        childName={record.childFirstName}
                        allergies={record.allergies}
                        variant="compact"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  {record.status !== 'absent' && record.status !== 'not_recorded' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      {record.checkInTime && (
                        <div className="flex items-center gap-1">
                          <LogIn className="w-4 h-4 text-green-600" />
                          <span className="text-gray-500">{t.attendance.entryTime}:</span>
                          <span className="font-medium text-gray-900">
                            {formatTime(record.checkInTime)}
                          </span>
                          {record.checkInPersonName && (
                            <span className="text-xs text-gray-400">
                              ({record.checkInPersonName})
                            </span>
                          )}
                        </div>
                      )}
                      {record.checkOutTime && (
                        <div className="flex items-center gap-1">
                          <LogOut className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-500">{t.attendance.exitTime}:</span>
                          <span className="font-medium text-gray-900">
                            {formatTime(record.checkOutTime)}
                          </span>
                          {record.checkOutPersonName && (
                            <span className="text-xs text-gray-400">
                              ({record.checkOutPersonName})
                            </span>
                          )}
                          {record.checkOutVerified && (
                            <span title="Verificado"><Shield className="w-3 h-3 text-green-500" /></span>
                          )}
                        </div>
                      )}
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
                          onClick={() => openCheckInModal(record.childId, record.childName, record.classroomId)}
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
                        onClick={() => openCheckOutModal(record.childId, record.childName, record.classroomId)}
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

      {/* Pickup Person Modal */}
      {selectedChildForModal && (
        <PickupPersonModal
          isOpen={pickupModalOpen}
          onClose={() => {
            setPickupModalOpen(false)
            setSelectedChildForModal(null)
          }}
          childId={selectedChildForModal.id}
          childName={selectedChildForModal.name}
          mode={pickupModalMode}
          onConfirm={pickupModalMode === 'check_in' ? handleCheckInConfirm : handleCheckOutConfirm}
        />
      )}
    </div>
  )
}
