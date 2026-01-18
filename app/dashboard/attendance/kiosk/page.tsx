'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  LogIn,
  LogOut,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Shield,
  ChevronRight,
  X,
  Thermometer,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  attendanceEnhancedService,
  type ChildWithPickupInfo,
  type PickupPerson,
} from '@/features/attendance/services/attendance-enhanced.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassAvatar,
  GlassBadge,
} from '@/shared/components/ui'

type KioskMode = 'select' | 'check_in' | 'check_out'

export default function AttendanceKioskPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [isLoading, setIsLoading] = useState(true)
  const [children, setChildren] = useState<ChildWithPickupInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChild, setSelectedChild] = useState<ChildWithPickupInfo | null>(null)
  const [kioskMode, setKioskMode] = useState<KioskMode>('select')
  const [selectedPerson, setSelectedPerson] = useState<PickupPerson | null>(null)
  const [temperature, setTemperature] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    blocked?: boolean
  } | null>(null)

  const today = new Date()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const data = await attendanceEnhancedService.getChildrenForKiosk()
      setChildren(data)
    } catch (error) {
      console.error('Error loading kiosk data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectChild(child: ChildWithPickupInfo) {
    setSelectedChild(child)
    setSelectedPerson(null)
    setTemperature('')
    setNotes('')
    setResult(null)

    if (child.today_status === 'not_checked_in' || child.today_status === 'absent') {
      setKioskMode('check_in')
    } else if (child.today_status === 'present') {
      setKioskMode('check_out')
    } else {
      // Already checked out - show status
      setKioskMode('select')
    }
  }

  function handleCancel() {
    setSelectedChild(null)
    setSelectedPerson(null)
    setKioskMode('select')
    setTemperature('')
    setNotes('')
    setResult(null)
  }

  async function handleCheckIn() {
    if (!selectedChild || !selectedPerson) return

    setIsProcessing(true)
    try {
      const response = await attendanceEnhancedService.checkInEnhanced({
        child_id: selectedChild.id,
        classroom_id: selectedChild.classroom_id,
        brought_by_type: selectedPerson.type,
        brought_by_id: selectedPerson.id,
        temperature: temperature ? parseFloat(temperature) : undefined,
        notes: notes || undefined,
        method: 'kiosk',
      })

      setResult(response)

      if (response.success) {
        // Refresh data after 2 seconds
        setTimeout(() => {
          loadData()
          handleCancel()
        }, 2000)
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setResult({
        success: false,
        message: 'Error al procesar la entrada',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleCheckOut() {
    if (!selectedChild || !selectedPerson) return

    setIsProcessing(true)
    try {
      const response = await attendanceEnhancedService.checkOutEnhanced({
        child_id: selectedChild.id,
        picked_up_by_type: selectedPerson.type,
        picked_up_by_id: selectedPerson.id,
        verified: true,
        verification_method: selectedPerson.requires_verification ? 'id_verified' : 'known_person',
        notes: notes || undefined,
        method: 'kiosk',
      })

      setResult(response)

      if (response.success) {
        setTimeout(() => {
          loadData()
          handleCancel()
        }, 2000)
      }
    } catch (error) {
      console.error('Check-out error:', error)
      setResult({
        success: false,
        message: 'Error al procesar la salida',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredChildren = children.filter(child => {
    const fullName = `${child.first_name} ${child.last_name}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Group by classroom
  const childrenByClassroom = filteredChildren.reduce((acc, child) => {
    const key = child.classroom_name
    if (!acc[key]) acc[key] = []
    acc[key].push(child)
    return acc
  }, {} as Record<string, ChildWithPickupInfo[]>)

  function getStatusColor(status: ChildWithPickupInfo['today_status']) {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-500 text-green-700'
      case 'checked_out':
        return 'bg-gray-100 border-gray-400 text-gray-600'
      case 'absent':
        return 'bg-red-100 border-red-500 text-red-700'
      default:
        return 'bg-orange-100 border-orange-500 text-orange-700'
    }
  }

  function getStatusLabel(status: ChildWithPickupInfo['today_status']) {
    switch (status) {
      case 'present':
        return 'Presente'
      case 'checked_out':
        return 'Recogido'
      case 'absent':
        return 'Ausente'
      default:
        return 'Sin Registrar'
    }
  }

  function formatTime(isoString: string | null) {
    if (!isoString) return null
    return new Date(isoString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/attendance">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modo Kiosco</h1>
            <p className="text-gray-500">{formatDate(today.toISOString())} - Entrada/Salida</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="text-xl font-mono text-gray-700">
            {today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className={`w-full max-w-md p-8 text-center ${
            result.blocked ? 'border-4 border-red-500' :
            result.success ? 'border-4 border-green-500' : 'border-4 border-yellow-500'
          }`}>
            {result.blocked ? (
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            ) : result.success ? (
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            )}
            <p className={`text-xl font-semibold ${
              result.blocked ? 'text-red-700' :
              result.success ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {result.message}
            </p>
            {result.blocked && (
              <p className="text-red-600 mt-2">
                Por favor contacte a la administración
              </p>
            )}
            {!result.success && (
              <GlassButton
                variant="secondary"
                className="mt-4"
                onClick={() => setResult(null)}
              >
                Intentar de Nuevo
              </GlassButton>
            )}
          </GlassCard>
        </div>
      )}

      {/* Main Content */}
      {!selectedChild ? (
        // Child Selection
        <div className="space-y-4">
          <GlassCard className="p-4">
            <GlassInput
              placeholder="Buscar niño por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="text-lg"
            />
          </GlassCard>

          <div className="grid gap-4">
            {Object.entries(childrenByClassroom).map(([classroom, classroomChildren]) => (
              <GlassCard key={classroom}>
                <GlassCardHeader className="py-3">
                  <GlassCardTitle className="text-lg">{classroom}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {classroomChildren.map(child => (
                      <button
                        key={child.id}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        onClick={() => handleSelectChild(child)}
                        disabled={child.today_status === 'checked_out'}
                      >
                        <div className="flex items-center gap-3">
                          <GlassAvatar
                            name={`${child.first_name} ${child.last_name}`}
                            size="lg"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {child.first_name} {child.last_name}
                            </p>
                            {child.check_in_time && (
                              <p className="text-sm text-gray-500">
                                Entrada: {formatTime(child.check_in_time)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(child.today_status)}`}>
                            {getStatusLabel(child.today_status)}
                          </span>
                          {child.today_status !== 'checked_out' && (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>

          {filteredChildren.length === 0 && (
            <GlassCard className="p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No se encontraron niños</p>
            </GlassCard>
          )}
        </div>
      ) : (
        // Check-in / Check-out Flow
        <GlassCard className="max-w-2xl mx-auto">
          <GlassCardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <GlassAvatar
                name={`${selectedChild.first_name} ${selectedChild.last_name}`}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedChild.first_name} {selectedChild.last_name}
                </h2>
                <p className="text-gray-500">{selectedChild.classroom_name}</p>
              </div>
            </div>
            <GlassButton variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </GlassButton>
          </GlassCardHeader>

          <GlassCardContent className="space-y-6">
            {/* Mode Indicator */}
            <div className={`p-4 rounded-xl text-center ${
              kioskMode === 'check_in' ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              {kioskMode === 'check_in' ? (
                <>
                  <LogIn className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-green-700">Registrar Entrada</p>
                </>
              ) : (
                <>
                  <LogOut className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-blue-700">Registrar Salida</p>
                  {selectedChild.check_in_time && (
                    <p className="text-sm text-blue-600">
                      Hora de entrada: {formatTime(selectedChild.check_in_time)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Person Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {kioskMode === 'check_in' ? '¿Quién trae al niño?' : '¿Quién recoge al niño?'}
              </p>
              <div className="space-y-2">
                {selectedChild.authorized_pickups.length === 0 ? (
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700">No hay personas autorizadas registradas</p>
                  </div>
                ) : (
                  selectedChild.authorized_pickups.map(person => (
                    <button
                      key={`${person.type}-${person.id}`}
                      className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        selectedPerson?.id === person.id && selectedPerson?.type === person.type
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPerson(person)}
                    >
                      <div className="flex items-center gap-3">
                        <GlassAvatar name={person.name} size="md" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.relationship}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {person.requires_verification && (
                          <GlassBadge variant="warning" size="sm">
                            <Shield className="w-3 h-3 mr-1" />
                            Verificar ID
                          </GlassBadge>
                        )}
                        <GlassBadge
                          variant={person.type === 'guardian' ? 'primary' : 'default'}
                          size="sm"
                        >
                          {person.type === 'guardian' ? 'Tutor' :
                           person.type === 'authorized' ? 'Autorizado' : 'Emergencia'}
                        </GlassBadge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Temperature (Check-in only) */}
            {kioskMode === 'check_in' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperatura (°F) - Opcional
                </label>
                <GlassInput
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="text-lg"
                />
                {temperature && parseFloat(temperature) >= 100.4 && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Temperatura elevada - Considere verificar con los padres
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notas (Opcional)
              </label>
              <textarea
                className="glass w-full rounded-xl px-4 py-3 resize-none"
                rows={2}
                placeholder="Agregar notas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Verification Warning */}
            {selectedPerson?.requires_verification && kioskMode === 'check_out' && (
              <div className="p-4 bg-yellow-50 rounded-xl flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Verificación Requerida</p>
                  <p className="text-sm text-yellow-700">
                    Por favor verifique la identificación de {selectedPerson.name} antes de proceder.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancelar
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-1"
                onClick={kioskMode === 'check_in' ? handleCheckIn : handleCheckOut}
                disabled={!selectedPerson || isProcessing}
                leftIcon={isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> :
                  kioskMode === 'check_in' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />
                }
              >
                {isProcessing ? 'Procesando...' :
                  kioskMode === 'check_in' ? 'Confirmar Entrada' : 'Confirmar Salida'}
              </GlassButton>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
