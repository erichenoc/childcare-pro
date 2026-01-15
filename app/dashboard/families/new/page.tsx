'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import { familiesService } from '@/features/families/services/families.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export default function NewFamilyPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    secondary_contact_name: '',
    secondary_contact_email: '',
    secondary_contact_phone: '',
    address: '',
    notes: '',
    status: 'active' as const,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await familiesService.create(formData)
      router.push('/dashboard/families')
    } catch (err) {
      console.error('Error creating family:', err)
      setError('Error al crear la familia. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/families">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.families.addFamily}</h1>
          <p className="text-gray-500">Ingresa la información de la nueva familia</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Primary Guardian */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Tutor Principal
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="grid sm:grid-cols-2 gap-4">
            <GlassInput
              label="Nombre Completo"
              name="primary_contact_name"
              value={formData.primary_contact_name}
              onChange={handleChange}
              required
              className="sm:col-span-2"
            />
            <GlassInput
              label="Email"
              type="email"
              name="primary_contact_email"
              value={formData.primary_contact_email}
              onChange={handleChange}
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <GlassInput
              label="Teléfono"
              name="primary_contact_phone"
              value={formData.primary_contact_phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-5 h-5" />}
              required
            />
          </GlassCardContent>
        </GlassCard>

        {/* Secondary Guardian */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Tutor Secundario (Opcional)
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="grid sm:grid-cols-2 gap-4">
            <GlassInput
              label="Nombre Completo"
              name="secondary_contact_name"
              value={formData.secondary_contact_name}
              onChange={handleChange}
              className="sm:col-span-2"
            />
            <GlassInput
              label="Email"
              type="email"
              name="secondary_contact_email"
              value={formData.secondary_contact_email}
              onChange={handleChange}
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <GlassInput
              label="Teléfono"
              name="secondary_contact_phone"
              value={formData.secondary_contact_phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-5 h-5" />}
            />
          </GlassCardContent>
        </GlassCard>

        {/* Address */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Dirección
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <GlassInput
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleChange}
              leftIcon={<MapPin className="w-5 h-5" />}
            />
          </GlassCardContent>
        </GlassCard>

        {/* Additional Info */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Información Adicional</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <GlassSelect
                label="Estado"
                name="status"
                options={statusOptions}
                value={formData.status}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                placeholder="Notas adicionales sobre la familia..."
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/families">
            <GlassButton variant="secondary" type="button">
              {t.common.cancel}
            </GlassButton>
          </Link>
          <GlassButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t.common.save}
          </GlassButton>
        </div>
      </form>
    </div>
  )
}
