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
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          Hola, {guardian.firstName}!
        </h1>
        <p className="text-blue-100">
          Bienvenido al portal de padres de ChildCare Pro
        </p>
      </div>

      {/* Children Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Mis Hijos
          </h2>
          <Link
            href="/family-portal/children"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guardian.children.map((child) => {
            const attendance = getChildAttendance(child.id)
            const isCheckedIn = attendance?.check_in && !attendance?.check_out

            return (
              <div
                key={child.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4">
                  {child.photoUrl ? (
                    <Image
                      src={child.photoUrl}
                      alt={`${child.firstName} ${child.lastName}`}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {child.firstName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {child.classroom?.name || 'Sin salon asignado'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          En la guarderia
                        </span>
                      ) : attendance?.check_out ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          <Clock className="w-3 h-3" />
                          Recogido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          No registrado hoy
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/family-portal/photos"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Fotos</span>
        </Link>

        <Link
          href="/family-portal/billing"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Facturas</span>
          {pendingInvoices.length > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400">{pendingInvoices.length} pendiente{pendingInvoices.length > 1 ? 's' : ''}</span>
          )}
        </Link>

        <Link
          href="/family-portal/attendance"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Asistencia</span>
        </Link>

        <Link
          href="/family-portal/chat"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Chat Maya</span>
        </Link>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Facturas Pendientes
            </h2>
            <Link
              href="/family-portal/billing"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Factura #{invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getChildName(invoice.child_id)} - Vence: {new Date(invoice.due_date).toLocaleDateString('es')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${invoice.total_amount.toFixed(2)}
                    </p>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${invoice.status === 'overdue'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
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

      {/* Recent Photos */}
      {recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-600" />
              Fotos Recientes
            </h2>
            <Link
              href="/family-portal/photos"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700"
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
