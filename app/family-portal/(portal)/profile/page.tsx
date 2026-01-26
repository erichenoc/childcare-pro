'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User, Mail, Phone, Shield, Baby, Clock, Save, CheckCircle } from 'lucide-react'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'
import { createClient } from '@/shared/lib/supabase/client'

type Guardian = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  relationship: string
  organizationId: string
  lastLogin: string | null
  children: Array<{
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    photoUrl: string | null
    status: string
    classroom: { id: string; name: string } | null
    isPrimary: boolean
    canPickup: boolean
  }>
}

export default function FamilyPortalProfilePage() {
  const [guardian, setGuardian] = useState<Guardian | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await guardianAuthService.getCurrentGuardian()
        if (data) {
          setGuardian(data)
          setFormData({ phone: data.phone || '' })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!guardian) return

    setIsSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('guardians')
        .update({ phone: formData.phone })
        .eq('id', guardian.id)

      if (error) throw error

      setGuardian(prev => prev ? { ...prev, phone: formData.phone } : null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!guardian) return null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in-right z-50">
          <CheckCircle className="w-5 h-5" />
          Cambios guardados exitosamente
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-7 h-7 text-blue-600" />
          Mi Perfil
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Informacion de tu cuenta
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {guardian.firstName[0]}{guardian.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {guardian.firstName} {guardian.lastName}
              </h2>
              <p className="text-blue-100 capitalize">{guardian.relationship || 'Padre/Tutor'}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Correo electronico
            </label>
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white">
              {guardian.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">El email no puede ser modificado</p>
          </div>

          {/* Phone (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ phone: e.target.value })}
              placeholder="Tu numero de telefono"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Last Login */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ultimo acceso
            </label>
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white">
              {guardian.lastLogin
                ? new Date(guardian.lastLogin).toLocaleString('es', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })
                : 'Primera vez'
              }
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Children Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Mis Hijos
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {guardian.children.map((child) => (
            <div key={child.id} className="p-4 flex items-center gap-4">
              {child.photoUrl ? (
                <Image
                  src={child.photoUrl}
                  alt={`${child.firstName} ${child.lastName}`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {child.firstName[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {calculateAge(child.dateOfBirth)} anos - {child.classroom?.name || 'Sin salon'}
                </p>
              </div>
              <div className="flex gap-2">
                {child.isPrimary && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    Contacto principal
                  </span>
                )}
                {child.canPickup && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    Autorizado para recoger
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Seguridad
          </h3>
        </div>
        <div className="p-6">
          <button
            onClick={() => guardianAuthService.resetPassword(guardian.email)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cambiar contrasena
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Te enviaremos un enlace por correo para cambiar tu contrasena
          </p>
        </div>
      </div>
    </div>
  )
}
