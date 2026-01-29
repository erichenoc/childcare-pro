'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  UserCheck,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from '@/shared/components/ui'
import { familiesService } from '@/features/families/services/families.service'

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export default function EditFamilyPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const familyId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    primary_contact_name: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    address: '',
    secondary_contact_name: '',
    secondary_contact_phone: '',
    secondary_contact_email: '',
    status: 'active',
    notes: '',
  })

  const [authorizedPickup, setAuthorizedPickup] = useState({
    name: '',
    phone: '',
    relationship: '',
  })

  useEffect(() => {
    loadFamily()
  }, [familyId])

  async function loadFamily() {
    try {
      setIsLoading(true)
      const family = await familiesService.getById(familyId)

      if (family) {
        setFormData({
          primary_contact_name: family.primary_contact_name,
          primary_contact_phone: family.primary_contact_phone || '',
          primary_contact_email: family.primary_contact_email || '',
          address: family.address || '',
          secondary_contact_name: family.secondary_contact_name || '',
          secondary_contact_phone: family.secondary_contact_phone || '',
          secondary_contact_email: family.secondary_contact_email || '',
          status: family.status || 'active',
          notes: family.notes || '',
        })

        // Load authorized pickups if available
        const pickups = family.authorized_pickups as Array<{ name: string; phone: string; relationship: string }> | null
        if (pickups && pickups.length > 0) {
          setAuthorizedPickup({
            name: pickups[0].name || '',
            phone: pickups[0].phone || '',
            relationship: pickups[0].relationship || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading family:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.primary_contact_name) return

    try {
      setIsSaving(true)

      // Build authorized_pickups array if data provided
      const authorized_pickups = authorizedPickup.name
        ? [authorizedPickup]
        : []

      await familiesService.update(familyId, {
        primary_contact_name: formData.primary_contact_name,
        primary_contact_phone: formData.primary_contact_phone || null,
        primary_contact_email: formData.primary_contact_email || null,
        address: formData.address || null,
        secondary_contact_name: formData.secondary_contact_name || null,
        secondary_contact_phone: formData.secondary_contact_phone || null,
        secondary_contact_email: formData.secondary_contact_email || null,
        authorized_pickups,
        status: formData.status as 'active' | 'inactive',
        notes: formData.notes || null,
      })

      router.push(`/dashboard/families/${familyId}`)
    } catch (error) {
      console.error('Error updating family:', error)
    } finally {
      setIsSaving(false)
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/families/${familyId}`}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.families.editFamily}</h1>
          <p className="text-gray-500">{t.families.editFamilySubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Contact */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.families.primaryContact}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.primaryContactName} *
                </label>
                <GlassInput
                  placeholder={t.families.primaryContactName}
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.email}
                </label>
                <GlassInput
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.primary_contact_email}
                  onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                  leftIcon={<Mail className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.phone}
                </label>
                <GlassInput
                  type="tel"
                  placeholder="(305) 555-0000"
                  value={formData.primary_contact_phone}
                  onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.address}
                </label>
                <GlassInput
                  placeholder="123 Main St, Miami, FL 33101"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  leftIcon={<MapPin className="w-5 h-5" />}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Secondary Contact */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.families.secondaryContact}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.secondaryContactName}
                </label>
                <GlassInput
                  placeholder={t.families.secondaryContactName}
                  value={formData.secondary_contact_name}
                  onChange={(e) => setFormData({ ...formData, secondary_contact_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.email}
                </label>
                <GlassInput
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.secondary_contact_email}
                  onChange={(e) => setFormData({ ...formData, secondary_contact_email: e.target.value })}
                  leftIcon={<Mail className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.families.phone}
                </label>
                <GlassInput
                  type="tel"
                  placeholder="(305) 555-0000"
                  value={formData.secondary_contact_phone}
                  onChange={(e) => setFormData({ ...formData, secondary_contact_phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Authorized Pickup Person */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Persona Autorizada para Recoger (Opcional)
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm text-gray-500 mb-4">
              Esta persona podrá recoger al niño(a) en caso de que los padres no puedan hacerlo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <GlassInput
                  placeholder="Ej: María García"
                  value={authorizedPickup.name}
                  onChange={(e) => setAuthorizedPickup({ ...authorizedPickup, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <GlassInput
                  type="tel"
                  placeholder="(000) 000-0000"
                  value={authorizedPickup.phone}
                  onChange={(e) => setAuthorizedPickup({ ...authorizedPickup, phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relación con el Niño
                </label>
                <GlassInput
                  placeholder="Ej: Abuela, Tío, Niñera"
                  value={authorizedPickup.relationship}
                  onChange={(e) => setAuthorizedPickup({ ...authorizedPickup, relationship: e.target.value })}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Additional Info */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Información Adicional</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.common.status}
                </label>
                <GlassSelect
                  options={statusOptions}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.notes}
              </label>
              <GlassTextarea
                rows={3}
                placeholder={t.families.notesPlaceholder}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/families/${familyId}`}>
            <GlassButton variant="ghost" type="button">
              {t.common.cancel}
            </GlassButton>
          </Link>
          <GlassButton variant="primary" type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.common.save}
          </GlassButton>
        </div>
      </form>
    </div>
  )
}
