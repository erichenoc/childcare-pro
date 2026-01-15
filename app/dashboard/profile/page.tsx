'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Save,
  Camera,
  Loader2
} from 'lucide-react'
import { GlassCard, GlassAvatar, GlassButton, GlassInput } from '@/shared/components/ui'
import { useTranslations } from '@/shared/lib/i18n'
import { authService } from '@/features/auth/services/auth.service'
import type { Profile } from '@/shared/types/database.types'

export default function ProfilePage() {
  const t = useTranslations()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await authService.getCurrentProfile()
      if (data) {
        setProfile(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const updated = await authService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
      })

      if (updated) {
        setProfile(updated)
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar el perfil' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' })
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      owner: 'Propietario',
      director: 'Director',
      lead_teacher: 'Maestro Líder',
      teacher: 'Maestro',
      assistant: 'Asistente',
      parent: 'Padre/Tutor',
    }
    return roles[role] || role
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.nav.profile}</h1>
        <p className="text-gray-500">Administra tu información personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <GlassCard className="lg:col-span-1 p-6 text-center">
          <div className="relative inline-block mb-4">
            <GlassAvatar
              name={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
              size="xl"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-800">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-gray-500">{profile?.email}</p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            {getRoleName(profile?.role || '')}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Miembro desde</p>
              <p className="font-medium text-gray-700">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '-'}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Edit Form */}
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Información Personal
          </h3>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassInput
                label="Nombre"
                icon={User}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Tu nombre"
                required
              />
              <GlassInput
                label="Apellido"
                icon={User}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Tu apellido"
                required
              />
            </div>

            <GlassInput
              label="Correo Electrónico"
              icon={Mail}
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-gray-50"
            />

            <GlassInput
              label="Teléfono"
              icon={Phone}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />

            <GlassInput
              label="Organización"
              icon={Building}
              value="ChildCare Pro"
              disabled
              className="bg-gray-50"
            />

            <div className="pt-4">
              <GlassButton
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
