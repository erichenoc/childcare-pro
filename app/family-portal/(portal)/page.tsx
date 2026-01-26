'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Baby,
  Camera,
  CreditCard,
  CalendarCheck,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'
import { createClient } from '@/shared/lib/supabase/client'

type Child = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  photoUrl: string | null
  status: string
  classroom: { id: string; name: string } | null
  isPrimary: boolean
  canPickup: boolean
}

type Guardian = {
  id: string
  firstName: string
  lastName: string
  children: Child[]
}

export default function FamilyPortalDashboardPage() {
  const [guardian, setGuardian] = useState<Guardian | null>(null)
  const [recentPhotos, setRecentPhotos] = useState<any[]>([])
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [todayAttendance, setTodayAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const guardianData = await guardianAuthService.getCurrentGuardian()
        if (guardianData) {
          setGuardian(guardianData)

          // Load additional data
          const supabase = createClient()
          const childIds = guardianData.children.map(c => c.id)

          if (childIds.length > 0) {
            // Load recent photos (last 5)
            const { data: photos } = await supabase
              .from('daily_photos')
              .select('id, photo_url, caption, taken_at, child_id')
              .in('child_id', childIds)
              .order('taken_at', { ascending: false })
              .limit(5)

            if (photos) setRecentPhotos(photos)

            // Load pending invoices
            const { data: invoices } = await supabase
              .from('invoices')
              .select('id, invoice_number, total_amount, due_date, status, child_id')
              .in('child_id', childIds)
              .in('status', ['pending', 'overdue'])
              .order('due_date', { ascending: true })
              .limit(5)

            if (invoices) setPendingInvoices(invoices)

            // Load today's attendance
            const today = new Date().toISOString().split('T')[0]
            const { data: attendance } = await supabase
              .from('attendance')
              .select('id, child_id, check_in, check_out, status')
              .in('child_id', childIds)
              .eq('date', today)

            if (attendance) setTodayAttendance(attendance)
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#e6e7ee] rounded-full shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] flex items-center justify-center mx-auto mb-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!guardian) return null

  const getChildAttendance = (childId: string) => {
    return todayAttendance.find(a => a.child_id === childId)
  }

  const getChildName = (childId: string) => {
    const child = guardian.children.find(c => c.id === childId)
    return child ? `${child.firstName} ${child.lastName}` : 'Hijo'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header - Neumorphic with Gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff]">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">
          Hola, {guardian.firstName}!
        </h1>
        <p className="text-blue-100 text-sm sm:text-base">
          Bienvenido al portal de padres de ChildCare Pro
        </p>
      </div>

      {/* Children Cards - Neumorphic */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#e6e7ee] rounded-lg shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
              <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            Mis Hijos
          </h2>
          <Link
            href="/family-portal/children"
            className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
          >
            Ver todos <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {guardian.children.map((child) => {
            const attendance = getChildAttendance(child.id)
            const isCheckedIn = attendance?.check_in && !attendance?.check_out

            return (
              <div
                key={child.id}
                className="bg-[#e6e7ee] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {child.photoUrl ? (
                    <Image
                      src={child.photoUrl}
                      alt={`${child.firstName} ${child.lastName}`}
                      width={56}
                      height={56}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#ffffff]"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#ffffff]">
                      {child.firstName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-700 truncate text-sm sm:text-base">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {child.classroom?.name || 'Sin salon asignado'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-600 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          En la guarderia
                        </span>
                      ) : attendance?.check_out ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-500/20 text-gray-600 text-xs rounded-full">
                          <Clock className="w-3 h-3" />
                          Recogido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          No registrado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions - Neumorphic */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/family-portal/photos"
          className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#e6e7ee] rounded-xl sm:rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e6e7ee] rounded-full shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Fotos</span>
        </Link>

        <Link
          href="/family-portal/billing"
          className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#e6e7ee] rounded-xl sm:rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e6e7ee] rounded-full shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Facturas</span>
          {pendingInvoices.length > 0 && (
            <span className="text-xs text-red-500 font-medium">{pendingInvoices.length} pendiente{pendingInvoices.length > 1 ? 's' : ''}</span>
          )}
        </Link>

        <Link
          href="/family-portal/attendance"
          className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#e6e7ee] rounded-xl sm:rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e6e7ee] rounded-full shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Asistencia</span>
        </Link>

        <Link
          href="/family-portal/chat"
          className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#e6e7ee] rounded-xl sm:rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e6e7ee] rounded-full shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">Chat Maya</span>
        </Link>
      </div>

      {/* Pending Invoices - Neumorphic */}
      {pendingInvoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#e6e7ee] rounded-lg shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              Facturas Pendientes
            </h2>
            <Link
              href="/family-portal/billing"
              className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
            >
              Ver todas <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="bg-[#e6e7ee] rounded-xl sm:rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] overflow-hidden">
            <div className="divide-y divide-[#d1d5db]">
              {pendingInvoices.map((invoice) => (
                <div key={invoice.id} className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 text-sm sm:text-base">
                      Factura #{invoice.invoice_number}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {getChildName(invoice.child_id)} - Vence: {new Date(invoice.due_date).toLocaleDateString('es')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700 text-sm sm:text-base">
                      ${invoice.total_amount.toFixed(2)}
                    </p>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${invoice.status === 'overdue'
                        ? 'bg-red-500/20 text-red-600'
                        : 'bg-yellow-500/20 text-yellow-600'
                      }
                    `}>
                      {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Photos - Neumorphic */}
      {recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#e6e7ee] rounded-lg shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
              </div>
              Fotos Recientes
            </h2>
            <Link
              href="/family-portal/photos"
              className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
            >
              Ver todas <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]"
              >
                <Image
                  src={photo.photo_url}
                  alt={photo.caption || 'Foto'}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
