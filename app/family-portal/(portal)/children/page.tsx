'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Baby,
  Calendar,
  Users,
  Heart,
  AlertTriangle,
  FileText,
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

type ChildDetails = Child & {
  allergies?: string
  medical_conditions?: string
  dietary_restrictions?: string
  emergency_notes?: string
}

export default function FamilyPortalChildrenPage() {
  const [children, setChildren] = useState<ChildDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedChild, setExpandedChild] = useState<string | null>(null)

  useEffect(() => {
    async function loadChildren() {
      try {
        const guardian = await guardianAuthService.getCurrentGuardian()
        if (!guardian) return

        const supabase = createClient()
        const childIds = guardian.children.map(c => c.id)

        // Get detailed info for each child
        const { data: childrenData } = await supabase
          .from('children')
          .select(`
            id,
            first_name,
            last_name,
            date_of_birth,
            photo_url,
            status,
            allergies,
            medical_conditions,
            dietary_restrictions,
            emergency_notes,
            classroom:classrooms(id, name)
          `)
          .in('id', childIds)

        if (childrenData) {
          const enrichedChildren = childrenData.map(child => {
            const guardianChild = guardian.children.find(gc => gc.id === child.id)
            return {
              id: child.id,
              firstName: child.first_name,
              lastName: child.last_name,
              dateOfBirth: child.date_of_birth,
              photoUrl: child.photo_url,
              status: child.status,
              classroom: child.classroom,
              isPrimary: guardianChild?.isPrimary || false,
              canPickup: guardianChild?.canPickup || false,
              allergies: child.allergies,
              medical_conditions: child.medical_conditions,
              dietary_restrictions: child.dietary_restrictions,
              emergency_notes: child.emergency_notes,
            }
          })
          setChildren(enrichedChildren)
        }
      } catch (error) {
        console.error('Error loading children:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadChildren()
  }, [])

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
      months += 12
    }

    if (years === 0) {
      return `${months} meses`
    }
    return `${years} ano${years > 1 ? 's' : ''}`
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Baby className="w-7 h-7 text-blue-600" />
          Mis Hijos
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Informacion detallada de tus hijos
        </p>
      </div>

      {/* Children List */}
      <div className="space-y-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Main Info */}
            <div
              className="p-4 flex items-center gap-4 cursor-pointer"
              onClick={() => setExpandedChild(expandedChild === child.id ? null : child.id)}
            >
              {child.photoUrl ? (
                <Image
                  src={child.photoUrl}
                  alt={`${child.firstName} ${child.lastName}`}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {child.firstName[0]}
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {child.firstName} {child.lastName}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {calculateAge(child.dateOfBirth)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    {child.classroom?.name || 'Sin salon'}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {child.isPrimary && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      Contacto principal
                    </span>
                  )}
                  {child.canPickup && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      Autorizado
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedChild === child.id ? 'rotate-90' : ''}`}
              />
            </div>

            {/* Expanded Details */}
            {expandedChild === child.id && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700 mt-4 space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/family-portal/photos"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-pink-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver fotos</span>
                  </Link>
                  <Link
                    href="/family-portal/attendance"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Asistencia</span>
                  </Link>
                </div>

                {/* Medical Info */}
                {(child.allergies || child.medical_conditions) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Informacion Medica Importante
                    </h4>
                    {child.allergies && (
                      <p className="text-sm text-red-600 dark:text-red-300 mb-1">
                        <strong>Alergias:</strong> {child.allergies}
                      </p>
                    )}
                    {child.medical_conditions && (
                      <p className="text-sm text-red-600 dark:text-red-300">
                        <strong>Condiciones:</strong> {child.medical_conditions}
                      </p>
                    )}
                  </div>
                )}

                {/* Dietary Info */}
                {child.dietary_restrictions && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      Restricciones Alimenticias
                    </h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      {child.dietary_restrictions}
                    </p>
                  </div>
                )}

                {/* Birth Date */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Fecha de nacimiento:</strong>{' '}
                  {new Date(child.dateOfBirth).toLocaleDateString('es', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {children.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Baby className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No tienes hijos registrados
          </p>
        </div>
      )}
    </div>
  )
}
