'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Users,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Camera,
  IdCard,
  Loader2,
  Star,
  Crown,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassAvatar,
  GlassInput,
  GlassSelect,
  GlassModal,
} from '@/shared/components/ui'
import { familiesService } from '@/features/families/services/families.service'
import {
  guardiansService,
  RELATIONSHIP_TYPES,
  ID_DOCUMENT_TYPES,
  type GuardianWithChildren,
  type GuardianFormData,
} from '@/features/families/services/guardians.service'
import {
  emergencyContactsService,
  COMMON_RELATIONSHIPS,
  type EmergencyContactFormData,
} from '@/features/families/services/emergency-contacts.service'
import {
  authorizedPickupsService,
  ALLOWED_DAYS_OPTIONS,
  type AuthorizedPickupFormData,
} from '@/features/families/services/authorized-pickups.service'
import type { FamilyWithChildren } from '@/shared/types/database.types'
import type { EmergencyContact, AuthorizedPickup } from '@/shared/types/guardians'

type ModalType = 'guardian' | 'emergency' | 'authorized' | null

export default function FamilyContactsPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()
  const params = useParams()
  const familyId = params.id as string

  const [family, setFamily] = useState<FamilyWithChildren | null>(null)
  const [guardians, setGuardians] = useState<GuardianWithChildren[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<Record<string, EmergencyContact[]>>({})
  const [authorizedPickups, setAuthorizedPickups] = useState<Record<string, AuthorizedPickup[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Guardian form
  const [guardianForm, setGuardianForm] = useState<Partial<GuardianFormData>>({})

  // Emergency contact form
  const [emergencyForm, setEmergencyForm] = useState<Partial<EmergencyContactFormData>>({})

  // Authorized pickup form
  const [authorizedForm, setAuthorizedForm] = useState<Partial<AuthorizedPickupFormData>>({})

  useEffect(() => {
    loadData()
  }, [familyId])

  async function loadData() {
    try {
      setIsLoading(true)
      const [familyData, guardiansData] = await Promise.all([
        familiesService.getById(familyId),
        guardiansService.getByFamilyId(familyId),
      ])
      setFamily(familyData)
      setGuardians(guardiansData)

      // Load emergency contacts and authorized pickups for each child
      if (familyData?.children) {
        const ecMap: Record<string, EmergencyContact[]> = {}
        const apMap: Record<string, AuthorizedPickup[]> = {}

        await Promise.all(
          familyData.children.map(async (child) => {
            const [ec, ap] = await Promise.all([
              emergencyContactsService.getByChildId(child.id),
              authorizedPickupsService.getByChildId(child.id),
            ])
            ecMap[child.id] = ec
            apMap[child.id] = ap
          })
        )

        setEmergencyContacts(ecMap)
        setAuthorizedPickups(apMap)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openGuardianModal(guardian?: GuardianWithChildren) {
    if (guardian) {
      setEditingId(guardian.id)
      setGuardianForm({
        family_id: familyId,
        first_name: guardian.first_name,
        last_name: guardian.last_name,
        relationship_type: guardian.relationship_type,
        email: guardian.email || '',
        phone: guardian.phone,
        secondary_phone: guardian.secondary_phone || '',
        work_phone: guardian.work_phone || '',
        address: guardian.address || '',
        employer_name: guardian.employer_name || '',
        occupation: guardian.occupation || '',
        is_primary_contact: guardian.is_primary_contact,
        is_authorized_pickup: guardian.is_authorized_pickup,
        emergency_priority: guardian.emergency_priority,
        notes: guardian.notes || '',
      })
    } else {
      setEditingId(null)
      setGuardianForm({
        family_id: familyId,
        is_authorized_pickup: true,
        is_primary_contact: guardians.length === 0,
        emergency_priority: guardians.length + 1,
      })
    }
    setModalType('guardian')
  }

  function openEmergencyModal(childId: string, contact?: EmergencyContact) {
    setSelectedChildId(childId)
    if (contact) {
      setEditingId(contact.id)
      setEmergencyForm({
        child_id: childId,
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        secondary_phone: contact.secondary_phone || '',
        email: contact.email || '',
        priority_order: contact.priority_order,
        is_authorized_pickup: contact.is_authorized_pickup,
        availability_notes: contact.availability_notes || '',
        notes: contact.notes || '',
      })
    } else {
      setEditingId(null)
      const currentContacts = emergencyContacts[childId] || []
      setEmergencyForm({
        child_id: childId,
        priority_order: currentContacts.length + 1,
        is_authorized_pickup: false,
      })
    }
    setModalType('emergency')
  }

  function openAuthorizedModal(childId: string, pickup?: AuthorizedPickup) {
    setSelectedChildId(childId)
    if (pickup) {
      setEditingId(pickup.id)
      setAuthorizedForm({
        child_id: childId,
        name: pickup.name || '',
        relationship: pickup.relationship || '',
        phone: pickup.phone || '',
        photo_url: pickup.photo_url ?? '',
        id_document_type: pickup.id_document_type ?? '',
        id_document_number: pickup.id_document_number ?? '',
        id_document_url: pickup.id_document_url ?? '',
        valid_until: pickup.valid_until ?? '',
        restrictions: pickup.restrictions ?? '',
        allowed_days: pickup.allowed_days ?? [],
        notes: pickup.notes ?? '',
      })
    } else {
      setEditingId(null)
      setAuthorizedForm({
        child_id: childId,
      })
    }
    setModalType('authorized')
  }

  async function handleSaveGuardian(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSaving(true)
      if (editingId) {
        await guardiansService.update(editingId, guardianForm as Partial<GuardianFormData>)
      } else {
        await guardiansService.create(guardianForm as GuardianFormData)
      }
      setModalType(null)
      loadData()
    } catch (error) {
      console.error('Error saving guardian:', error)
      alert('Error al guardar el tutor')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveEmergencyContact(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSaving(true)
      if (editingId) {
        await emergencyContactsService.update(editingId, emergencyForm as Partial<EmergencyContactFormData>)
      } else {
        await emergencyContactsService.create(emergencyForm as EmergencyContactFormData)
      }
      setModalType(null)
      loadData()
    } catch (error) {
      console.error('Error saving emergency contact:', error)
      alert('Error al guardar el contacto de emergencia')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveAuthorizedPickup(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSaving(true)
      if (editingId) {
        await authorizedPickupsService.update(editingId, authorizedForm as Partial<AuthorizedPickupFormData>)
      } else {
        await authorizedPickupsService.create(authorizedForm as AuthorizedPickupFormData)
      }
      setModalType(null)
      loadData()
    } catch (error) {
      console.error('Error saving authorized pickup:', error)
      alert('Error al guardar la persona autorizada')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteGuardian(id: string) {
    if (!confirm('¿Está seguro de eliminar este tutor?')) return
    try {
      await guardiansService.delete(id)
      loadData()
    } catch (error) {
      console.error('Error deleting guardian:', error)
    }
  }

  async function handleDeleteEmergencyContact(id: string) {
    if (!confirm('¿Está seguro de eliminar este contacto de emergencia?')) return
    try {
      await emergencyContactsService.delete(id)
      loadData()
    } catch (error) {
      console.error('Error deleting emergency contact:', error)
    }
  }

  async function handleDeactivateAuthorizedPickup(id: string) {
    if (!confirm('¿Está seguro de desactivar esta autorización?')) return
    try {
      await authorizedPickupsService.deactivate(id)
      loadData()
    } catch (error) {
      console.error('Error deactivating authorized pickup:', error)
    }
  }

  async function setPrimaryContact(guardianId: string) {
    try {
      await guardiansService.setPrimaryContact(familyId, guardianId)
      loadData()
    } catch (error) {
      console.error('Error setting primary contact:', error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/families/${familyId}`}>
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contactos de {family.primary_contact_name}
            </h1>
            <p className="text-gray-500">Tutores, contactos de emergencia y autorizados</p>
          </div>
        </div>
      </div>

      {/* Guardians Section */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between w-full">
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tutores / Padres ({guardians.length})
            </GlassCardTitle>
            <GlassButton variant="primary" size="sm" onClick={() => openGuardianModal()}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar Tutor
            </GlassButton>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {guardians.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay tutores registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guardians.map((guardian) => (
                <div key={guardian.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <GlassAvatar name={`${guardian.first_name} ${guardian.last_name}`} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {guardian.first_name} {guardian.last_name}
                          </p>
                          {guardian.is_primary_contact && (
                            <GlassBadge variant="primary" size="sm">
                              <Crown className="w-3 h-3 mr-1" />
                              Principal
                            </GlassBadge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {RELATIONSHIP_TYPES.find(r => r.value === guardian.relationship_type)?.label || guardian.relationship_type}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guardian.phone}
                          </span>
                          {guardian.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {guardian.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {guardian.is_authorized_pickup ? (
                        <GlassBadge variant="success" size="sm">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Autorizado
                        </GlassBadge>
                      ) : (
                        <GlassBadge variant="warning" size="sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          No Autorizado
                        </GlassBadge>
                      )}
                      {!guardian.is_primary_contact && (
                        <GlassButton variant="ghost" size="sm" onClick={() => setPrimaryContact(guardian.id)}>
                          <Star className="w-4 h-4" />
                        </GlassButton>
                      )}
                      <GlassButton variant="ghost" size="sm" onClick={() => openGuardianModal(guardian)}>
                        <Edit className="w-4 h-4" />
                      </GlassButton>
                      <GlassButton variant="ghost" size="sm" onClick={() => handleDeleteGuardian(guardian.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Per-Child Sections */}
      {family.children?.map((child) => {
        const childEC = emergencyContacts[child.id] || []
        const childAP = authorizedPickups[child.id] || []
        const hasMinimumContacts = childEC.length >= 2

        return (
          <div key={child.id} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GlassAvatar name={`${child.first_name} ${child.last_name}`} size="sm" />
              {child.first_name} {child.last_name}
            </h2>

            {/* Emergency Contacts */}
            <GlassCard className={!hasMinimumContacts ? 'border-l-4 border-l-warning' : ''}>
              <GlassCardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <GlassCardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Contactos de Emergencia ({childEC.length})
                    </GlassCardTitle>
                    {!hasMinimumContacts && (
                      <GlassBadge variant="warning" size="sm">
                        Mínimo 2 requeridos
                      </GlassBadge>
                    )}
                  </div>
                  <GlassButton variant="secondary" size="sm" onClick={() => openEmergencyModal(child.id)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </GlassButton>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                {childEC.length === 0 ? (
                  <div className="text-center py-6 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                    <p className="text-yellow-700 font-medium">Se requieren mínimo 2 contactos de emergencia</p>
                    <GlassButton variant="warning" size="sm" className="mt-3" onClick={() => openEmergencyModal(child.id)}>
                      Agregar Contacto
                    </GlassButton>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {childEC.map((contact, idx) => (
                      <div key={contact.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-500">
                              {COMMON_RELATIONSHIPS.find(r => r.value === contact.relationship)?.label || contact.relationship}
                              {' · '}{contact.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.is_authorized_pickup && (
                            <GlassBadge variant="success" size="sm">Autorizado pickup</GlassBadge>
                          )}
                          <GlassButton variant="ghost" size="sm" onClick={() => openEmergencyModal(child.id, contact)}>
                            <Edit className="w-4 h-4" />
                          </GlassButton>
                          <GlassButton variant="ghost" size="sm" onClick={() => handleDeleteEmergencyContact(contact.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </GlassButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>

            {/* Authorized Pickups */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between w-full">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Personas Autorizadas ({childAP.length})
                  </GlassCardTitle>
                  <GlassButton variant="secondary" size="sm" onClick={() => openAuthorizedModal(child.id)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </GlassButton>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                {childAP.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">
                    No hay personas adicionales autorizadas (además de los tutores)
                  </p>
                ) : (
                  <div className="space-y-2">
                    {childAP.map((pickup) => {
                      const isExpired = pickup.valid_until && new Date(pickup.valid_until) < new Date()
                      return (
                        <div key={pickup.id} className={`p-3 rounded-lg flex items-center justify-between ${
                          isExpired ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            {pickup.photo_url ? (
                              <img src={pickup.photo_url} alt={pickup.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <GlassAvatar name={pickup.name} size="sm" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{pickup.name}</p>
                                {pickup.verified_at && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {pickup.relationship} · {pickup.phone}
                              </p>
                              {pickup.restrictions && (
                                <p className="text-xs text-orange-600 mt-1">{pickup.restrictions}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpired ? (
                              <GlassBadge variant="error" size="sm">Expirado</GlassBadge>
                            ) : pickup.valid_until ? (
                              <GlassBadge variant="warning" size="sm">
                                <Clock className="w-3 h-3 mr-1" />
                                Hasta {formatDate(pickup.valid_until)}
                              </GlassBadge>
                            ) : (
                              <GlassBadge variant="success" size="sm">Activo</GlassBadge>
                            )}
                            <div className="flex items-center gap-1">
                              {pickup.photo_url && <Camera className="w-4 h-4 text-gray-400" />}
                              {pickup.id_document_url && <IdCard className="w-4 h-4 text-gray-400" />}
                            </div>
                            <GlassButton variant="ghost" size="sm" onClick={() => openAuthorizedModal(child.id, pickup)}>
                              <Edit className="w-4 h-4" />
                            </GlassButton>
                            <GlassButton variant="ghost" size="sm" onClick={() => handleDeactivateAuthorizedPickup(pickup.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </GlassButton>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        )
      })}

      {/* Guardian Modal */}
      <GlassModal
        isOpen={modalType === 'guardian'}
        onClose={() => setModalType(null)}
        title={editingId ? 'Editar Tutor' : 'Agregar Tutor'}
        size="lg"
      >
        <form onSubmit={handleSaveGuardian} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <GlassInput
                value={guardianForm.first_name || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <GlassInput
                value={guardianForm.last_name || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relación *</label>
              <GlassSelect
                options={RELATIONSHIP_TYPES}
                value={guardianForm.relationship_type || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, relationship_type: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <GlassInput
                type="tel"
                value={guardianForm.phone || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <GlassInput
                type="email"
                value={guardianForm.email || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Trabajo</label>
              <GlassInput
                type="tel"
                value={guardianForm.work_phone || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, work_phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <GlassInput
                value={guardianForm.address || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empleador</label>
              <GlassInput
                value={guardianForm.employer_name || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, employer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
              <GlassInput
                value={guardianForm.occupation || ''}
                onChange={(e) => setGuardianForm({ ...guardianForm, occupation: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={guardianForm.is_authorized_pickup ?? true}
                onChange={(e) => setGuardianForm({ ...guardianForm, is_authorized_pickup: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Autorizado para recoger</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={guardianForm.is_primary_contact ?? false}
                onChange={(e) => setGuardianForm({ ...guardianForm, is_primary_contact: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Contacto principal</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={guardianForm.receives_notifications ?? true}
                onChange={(e) => setGuardianForm({ ...guardianForm, receives_notifications: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Recibe notificaciones</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <GlassButton type="button" variant="ghost" onClick={() => setModalType(null)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Guardar' : 'Agregar'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Emergency Contact Modal */}
      <GlassModal
        isOpen={modalType === 'emergency'}
        onClose={() => setModalType(null)}
        title={editingId ? 'Editar Contacto de Emergencia' : 'Agregar Contacto de Emergencia'}
        size="md"
      >
        <form onSubmit={handleSaveEmergencyContact} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <GlassInput
                value={emergencyForm.name || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relación *</label>
              <GlassSelect
                options={COMMON_RELATIONSHIPS}
                value={emergencyForm.relationship || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
              <GlassInput
                type="number"
                min="1"
                value={emergencyForm.priority_order || 1}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, priority_order: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <GlassInput
                type="tel"
                value={emergencyForm.phone || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <GlassInput
                type="email"
                value={emergencyForm.email || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Disponibilidad</label>
              <GlassInput
                value={emergencyForm.availability_notes || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, availability_notes: e.target.value })}
                placeholder="Ej: Solo disponible después de las 3pm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emergencyForm.is_authorized_pickup ?? false}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, is_authorized_pickup: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">También autorizado para recoger al niño</span>
            </label>
            {emergencyForm.is_authorized_pickup && (
              <p className="text-xs text-orange-600 mt-1 ml-6">
                Se requiere foto y documento de identidad para autorización de pickup
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <GlassButton type="button" variant="ghost" onClick={() => setModalType(null)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Guardar' : 'Agregar'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Authorized Pickup Modal */}
      <GlassModal
        isOpen={modalType === 'authorized'}
        onClose={() => setModalType(null)}
        title={editingId ? 'Editar Persona Autorizada' : 'Agregar Persona Autorizada'}
        size="lg"
      >
        <form onSubmit={handleSaveAuthorizedPickup} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mb-4">
            <strong>Nota:</strong> Se requiere foto y documento de identificación para todas las personas autorizadas.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <GlassInput
                value={authorizedForm.name || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relación *</label>
              <GlassInput
                value={authorizedForm.relationship || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, relationship: e.target.value })}
                placeholder="Ej: Tía, Amigo de la familia"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <GlassInput
                type="tel"
                value={authorizedForm.phone || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válido Hasta</label>
              <GlassInput
                type="date"
                value={authorizedForm.valid_until || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, valid_until: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Dejar vacío para autorización indefinida</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de Foto *</label>
              <GlassInput
                value={authorizedForm.photo_url || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, photo_url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
              <GlassSelect
                options={ID_DOCUMENT_TYPES}
                value={authorizedForm.id_document_type || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, id_document_type: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
              <GlassInput
                value={authorizedForm.id_document_number || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, id_document_number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del Documento *</label>
              <GlassInput
                value={authorizedForm.id_document_url || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, id_document_url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Restricciones</label>
              <GlassInput
                value={authorizedForm.restrictions || ''}
                onChange={(e) => setAuthorizedForm({ ...authorizedForm, restrictions: e.target.value })}
                placeholder="Ej: Solo los lunes y miércoles después de las 3pm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <GlassButton type="button" variant="ghost" onClick={() => setModalType(null)}>
              Cancelar
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Guardar' : 'Agregar'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  )
}
