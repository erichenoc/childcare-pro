'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  FileText,
  Clock,
  UserCheck,
  Camera,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassAvatar,
  GlassBadge,
} from '@/shared/components/ui'
import { childrenService } from '@/features/children/services/children.service'
import type { ChildWithFamily } from '@/shared/types/database.types'
import { createClient } from '@/shared/lib/supabase/client'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary?: boolean
}

interface AuthorizedPickup {
  name: string
  relationship: string
}

interface ActivityItem {
  date: string
  type: string
  time: string
  note: string
}

function calculateAge(dateOfBirth: string): string {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                 (today.getMonth() - birthDate.getMonth())

  if (months < 12) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  }

  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'}`
}

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations()
  const { formatDate } = useI18n()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [child, setChild] = useState<ChildWithFamily | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent'>('absent')
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    loadChildData()
  }, [id])

  async function loadChildData() {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      // Load child data and today's attendance in parallel
      const [childData, attendanceData, dailyReportsData] = await Promise.all([
        childrenService.getById(id),
        supabase
          .from('attendance')
          .select('status, check_in_time, check_out_time')
          .eq('child_id', id)
          .eq('date', today)
          .single()
          .then(res => res.data),
        supabase
          .from('daily_reports')
          .select('date, meals, naps, activities, created_at')
          .eq('child_id', id)
          .order('date', { ascending: false })
          .limit(5)
          .then(res => res.data || [])
      ])

      if (!childData) {
        router.push('/dashboard/children')
        return
      }

      setChild(childData)
      setAttendanceStatus(attendanceData?.status === 'present' ? 'present' : 'absent')

      // Transform recent activity from daily reports and attendance
      const activities: ActivityItem[] = []

      if (attendanceData?.check_in_time) {
        activities.push({
          date: today,
          type: 'check-in',
          time: new Date(attendanceData.check_in_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          note: 'Entrada registrada'
        })
      }

      if (attendanceData?.check_out_time) {
        activities.push({
          date: today,
          type: 'check-out',
          time: new Date(attendanceData.check_out_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          note: 'Salida registrada'
        })
      }

      // Add activities from daily reports
      dailyReportsData.forEach(report => {
        if (report.meals && Array.isArray(report.meals)) {
          (report.meals as any[]).forEach((meal: any) => {
            activities.push({
              date: report.date,
              type: 'meal',
              time: meal.time || '12:00',
              note: meal.description || 'Comida registrada'
            })
          })
        }
        if (report.naps && Array.isArray(report.naps)) {
          (report.naps as any[]).forEach((nap: any) => {
            activities.push({
              date: report.date,
              type: 'nap',
              time: nap.start_time || '13:00',
              note: nap.duration ? `Siesta de ${nap.duration} minutos` : 'Siesta registrada'
            })
          })
        }
      })

      setRecentActivity(activities.slice(0, 5))

    } catch (error) {
      console.error('Error loading child data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Niño no encontrado</p>
      </div>
    )
  }

  // Parse JSON fields
  const allergies = Array.isArray(child.allergies) ? child.allergies as string[] : []
  const medicalConditions = Array.isArray(child.medical_conditions) ? child.medical_conditions as string[] : []
  const emergencyContacts = (Array.isArray(child.family?.emergency_contacts)
    ? child.family.emergency_contacts
    : []) as unknown as EmergencyContact[]
  const authorizedPickups = (Array.isArray(child.family?.authorized_pickups)
    ? child.family.authorized_pickups
    : []) as unknown as AuthorizedPickup[]

  // Add primary contacts from family
  const allEmergencyContacts: EmergencyContact[] = [
    {
      name: child.family?.primary_contact_name || 'N/A',
      relationship: 'Contacto Principal',
      phone: child.family?.primary_contact_phone || 'N/A',
      email: child.family?.primary_contact_email || undefined,
      isPrimary: true
    },
    ...(child.family?.secondary_contact_name ? [{
      name: child.family.secondary_contact_name,
      relationship: 'Contacto Secundario',
      phone: child.family.secondary_contact_phone || 'N/A',
      email: child.family.secondary_contact_email || undefined,
      isPrimary: false
    }] : []),
    ...emergencyContacts
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/children">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </GlassButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {child.first_name} {child.last_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.children.childProfile}
          </p>
        </div>
        <Link href={`/dashboard/children/${id}/edit`}>
          <GlassButton variant="primary" leftIcon={<Edit className="w-4 h-4" />}>
            {t.common.edit}
          </GlassButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Medical */}
        <div className="space-y-6">
          {/* Profile Card */}
          <GlassCard>
            <GlassCardContent className="text-center py-6">
              <div className="relative inline-block">
                <GlassAvatar
                  name={`${child.first_name} ${child.last_name}`}
                  size="xl"
                  className="w-24 h-24 text-2xl"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {child.first_name} {child.last_name}
              </h2>

              <div className="mt-2 flex items-center justify-center gap-2">
                <GlassBadge variant={attendanceStatus === 'present' ? 'success' : 'warning'} dot>
                  {attendanceStatus === 'present' ? t.children.present : t.children.absent}
                </GlassBadge>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t.children.age}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{calculateAge(child.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t.children.gender}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{child.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t.children.classroom}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{child.classroom?.name || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t.children.bloodType}</p>
                  <p className="font-medium text-gray-900 dark:text-white">N/A</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Medical Info */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-error" />
                {t.children.medicalInfo}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {/* Allergies */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  {t.children.allergies}
                </p>
                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, index) => (
                      <GlassBadge key={index} variant="error">
                        {allergy}
                      </GlassBadge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t.children.noAllergies}</p>
                )}
              </div>

              {/* Medical Conditions */}
              {medicalConditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condiciones Médicas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medicalConditions.map((condition, index) => (
                      <GlassBadge key={index} variant="warning">
                        {condition}
                      </GlassBadge>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.primaryDoctor}
                </p>
                <p className="text-gray-900 dark:text-white">{child.doctor_name || 'No registrado'}</p>
                <p className="text-sm text-gray-500">{child.doctor_phone || ''}</p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Middle Column - Contacts & Address */}
        <div className="space-y-6">
          {/* Emergency Contacts */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-500" />
                {t.children.emergencyContacts}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {allEmergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl ${
                    contact.isPrimary ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact.name}
                        {contact.isPrimary && (
                          <GlassBadge variant="primary" size="sm" className="ml-2">
                            {t.children.primaryContact}
                          </GlassBadge>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{contact.relationship}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>

          {/* Address */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary-500" />
                {t.children.address}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {child.family?.address ? (
                <>
                  <p className="text-gray-900 dark:text-white">{child.family.address}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {child.family.city}, {child.family.state} {child.family.zip_code}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Sin dirección registrada</p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Authorized Pickups */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-success" />
                {t.children.authorizedPickups}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-2">
                {authorizedPickups.length > 0 ? (
                  authorizedPickups.map((person, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <GlassAvatar name={person.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {person.name}
                          </p>
                          <p className="text-xs text-gray-500">{person.relationship}</p>
                        </div>
                      </div>
                      <GlassBadge variant="success" size="sm">
                        {t.children.authorized}
                      </GlassBadge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Sin personas autorizadas adicionales</p>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Right Column - Activity & Enrollment */}
        <div className="space-y-6">
          {/* Enrollment Info */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-info" />
                {t.children.enrollmentInfo}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.children.enrollmentDate}</span>
                <span className="text-gray-900 dark:text-white">
                  {child.enrollment_date ? formatDate(child.enrollment_date) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.children.dateOfBirth}</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(child.date_of_birth)}
                </span>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                {t.children.recentActivity}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {activity.type === 'check-in' && t.attendance.checkIn}
                            {activity.type === 'check-out' && t.attendance.checkOut}
                            {activity.type === 'meal' && t.meals.meal}
                            {activity.type === 'nap' && t.children.nap}
                          </p>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-500">{activity.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Sin actividad reciente</p>
              )}

              <GlassButton variant="ghost" fullWidth className="mt-4">
                {t.common.showMore}
              </GlassButton>
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.quickActions}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              <GlassButton variant="secondary" fullWidth leftIcon={<FileText className="w-4 h-4" />}>
                {t.children.viewReports}
              </GlassButton>
              <Link href="/dashboard/attendance">
                <GlassButton variant="secondary" fullWidth leftIcon={<Calendar className="w-4 h-4" />}>
                  {t.children.viewAttendance}
                </GlassButton>
              </Link>
              <GlassButton variant="secondary" fullWidth leftIcon={<Phone className="w-4 h-4" />}>
                {t.children.contactParent}
              </GlassButton>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
