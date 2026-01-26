'use client'

import { useState, useEffect } from 'react'
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'

type AttendanceRecord = {
  id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'excused'
  notes: string | null
  child_id: string
  child?: {
    first_name: string
    last_name: string
  }
}

type Child = {
  id: string
  firstName: string
  lastName: string
}

const statusConfig = {
  present: {
    label: 'Presente',
    icon: CheckCircle,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  absent: {
    label: 'Ausente',
    icon: XCircle,
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  late: {
    label: 'Tarde',
    icon: Clock,
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  excused: {
    label: 'Excusado',
    icon: AlertCircle,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
}

export default function FamilyPortalAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const guardian = await guardianAuthService.getCurrentGuardian()
        if (!guardian) return

        setChildren(guardian.children.map(c => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        })))

        const childIds = guardian.children.map(c => c.id)

        if (childIds.length === 0) {
          setIsLoading(false)
          return
        }

        await loadAttendance(childIds)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  async function loadAttendance(childIds: string[]) {
    const supabase = createClient()

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        check_in,
        check_out,
        status,
        notes,
        child_id,
        child:children(first_name, last_name)
      `)
      .in('child_id', childIds)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error
    setRecords(data || [])
  }

  useEffect(() => {
    if (children.length > 0) {
      loadAttendance(children.map(c => c.id))
    }
  }, [currentMonth, children])

  const filteredRecords = selectedChild === 'all'
    ? records
    : records.filter(r => r.child_id === selectedChild)

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
      return newDate
    })
  }

  // Calculate stats
  const stats = {
    present: filteredRecords.filter(r => r.status === 'present').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
    late: filteredRecords.filter(r => r.status === 'late').length,
    excused: filteredRecords.filter(r => r.status === 'excused').length,
  }

  const formatTime = (time: string | null) => {
    if (!time) return '-'
    return new Date(time).toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Cargando asistencia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="w-7 h-7 text-blue-600" />
          Historial de Asistencia
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Registro de entradas y salidas de tus hijos
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
          {currentMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
        </h2>

        <button
          onClick={() => navigateMonth('next')}
          disabled={currentMonth.getMonth() >= new Date().getMonth() && currentMonth.getFullYear() >= new Date().getFullYear()}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Filter */}
      {children.length > 1 && (
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los hijos</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.firstName} {child.lastName}
            </option>
          ))}
        </select>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const config = statusConfig[key as keyof typeof statusConfig]
          const Icon = config.icon

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{config.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay registros de asistencia para este mes
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  {selectedChild === 'all' && children.length > 1 && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Hijo/a
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Salida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => {
                  const status = statusConfig[record.status]
                  const StatusIcon = status.icon

                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString('es', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      {selectedChild === 'all' && children.length > 1 && (
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {record.child?.first_name} {record.child?.last_name}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(record.check_in)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(record.check_out)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
