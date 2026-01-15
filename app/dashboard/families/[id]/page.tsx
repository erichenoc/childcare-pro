'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Baby,
  CreditCard,
  User,
  Calendar,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { familiesService } from '@/features/families/services/families.service'
import type { FamilyWithChildren } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassAvatar,
  GlassBadge,
} from '@/shared/components/ui'

export default function FamilyDetailPage() {
  const t = useTranslations()
  const { formatCurrency, formatDate } = useI18n()
  const params = useParams()
  const router = useRouter()
  const familyId = params.id as string

  const [family, setFamily] = useState<FamilyWithChildren | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFamily()
  }, [familyId])

  async function loadFamily() {
    try {
      setIsLoading(true)
      const data = await familiesService.getById(familyId)
      setFamily(data)
    } catch (error) {
      console.error('Error loading family:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta familia? Esta acción no se puede deshacer.')) return

    try {
      await familiesService.delete(familyId)
      router.push('/dashboard/families')
    } catch (error) {
      console.error('Error deleting family:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Familia no encontrada</p>
        <Link href="/dashboard/families">
          <GlassButton variant="secondary" className="mt-4">
            Volver a Familias
          </GlassButton>
        </Link>
      </div>
    )
  }

  const familyName = family.primary_contact_name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/families">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div className="flex items-center gap-3">
            <GlassAvatar name={familyName} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{familyName}</h1>
              <GlassBadge variant={family.status === 'active' ? 'success' : 'default'} dot>
                {family.status === 'active' ? t.common.active : t.common.inactive}
              </GlassBadge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/families/${familyId}/edit`}>
            <GlassButton variant="secondary" leftIcon={<Edit className="w-4 h-4" />}>
              {t.common.edit}
            </GlassButton>
          </Link>
          <GlassButton
            variant="ghost"
            className="text-error hover:bg-error/10"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
          >
            {t.common.delete}
          </GlassButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de Contacto
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tutor Principal</p>
                  <p className="font-medium text-gray-900">{familyName}</p>
                </div>
                {family.secondary_contact_name && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tutor Secundario</p>
                    <p className="font-medium text-gray-900">
                      {family.secondary_contact_name}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono Principal</p>
                    <p className="text-gray-900">{family.primary_contact_phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email Principal</p>
                    <p className="text-gray-900">{family.primary_contact_email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="text-gray-900">{family.address || '-'}</p>
                  </div>
                </div>
              </div>

              {family.emergency_contacts && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Contactos de Emergencia</p>
                  <p className="text-gray-600 text-sm">
                    {typeof family.emergency_contacts === 'object'
                      ? JSON.stringify(family.emergency_contacts)
                      : String(family.emergency_contacts)}
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Children */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5" />
                Niños ({family.children?.length || 0})
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {!family.children || family.children.length === 0 ? (
                <div className="text-center py-8">
                  <Baby className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay niños registrados</p>
                  <Link href="/dashboard/children/new">
                    <GlassButton variant="primary" size="sm" className="mt-3">
                      Agregar Niño
                    </GlassButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {family.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/dashboard/children/${child.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GlassAvatar name={`${child.first_name} ${child.last_name}`} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {child.date_of_birth && formatDate(child.date_of_birth)}
                          </p>
                        </div>
                      </div>
                      <GlassBadge variant={child.status === 'active' ? 'success' : 'default'} size="sm">
                        {child.status === 'active' ? 'Activo' : 'Inactivo'}
                      </GlassBadge>
                    </Link>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Saldo
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-center">
                <p className={`text-3xl font-bold ${(family.balance || 0) > 0 ? 'text-warning' : 'text-success'}`}>
                  {formatCurrency(family.balance || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {(family.balance || 0) > 0 ? 'Pendiente de pago' : 'Sin saldo pendiente'}
                </p>
              </div>
              {(family.balance || 0) > 0 && (
                <GlassButton variant="primary" fullWidth className="mt-4">
                  Registrar Pago
                </GlassButton>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Quick Info */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Registrado</span>
                <span className="text-gray-900">{family.created_at ? formatDate(family.created_at) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Última actualización</span>
                <span className="text-gray-900">{family.updated_at ? formatDate(family.updated_at) : '-'}</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Notes */}
          {family.notes && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Notas</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{family.notes}</p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
