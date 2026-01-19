'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  User,
  Heart,
  Calendar,
  Plus,
  X,
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
import { childrenService } from '@/features/children/services/children.service'
import { classroomsService } from '@/features/classrooms/services/classrooms.service'
import { familiesService } from '@/features/families/services/families.service'

const genderOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export default function EditChildPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const childId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string }[]>([])
  const [familyOptions, setFamilyOptions] = useState<{ value: string; label: string }[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    classroom_id: '',
    family_id: '',
    status: 'active',
    doctor_name: '',
    doctor_phone: '',
    notes: '',
    enrollment_date: '',
  })

  useEffect(() => {
    loadData()
  }, [childId])

  async function loadData() {
    try {
      setIsLoading(true)
      const [child, classrooms, families] = await Promise.all([
        childrenService.getById(childId),
        classroomsService.getAll(),
        familiesService.getAll(),
      ])

      // Build options
      setClassroomOptions([
        { value: '', label: 'Sin asignar' },
        ...classrooms.map(c => ({ value: c.id, label: c.name })),
      ])
      setFamilyOptions([
        { value: '', label: 'Sin asignar' },
        ...families.map(f => ({ value: f.id, label: f.primary_contact_name })),
      ])

      if (child) {
        setFormData({
          first_name: child.first_name,
          last_name: child.last_name,
          date_of_birth: child.date_of_birth || '',
          gender: child.gender || '',
          classroom_id: child.classroom_id || '',
          family_id: child.family_id || '',
          status: child.status || 'active',
          doctor_name: child.doctor_name || '',
          doctor_phone: child.doctor_phone || '',
          notes: child.notes || '',
          enrollment_date: child.enrollment_date || '',
        })
        setAllergies(Array.isArray(child.allergies) ? child.allergies as string[] : [])
      }
    } catch (error) {
      console.error('Error loading child:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function addAllergy() {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  function removeAllergy(allergy: string) {
    setAllergies(allergies.filter(a => a !== allergy))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name) return

    try {
      setIsSaving(true)

      await childrenService.update(childId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        classroom_id: formData.classroom_id || null,
        family_id: formData.family_id || undefined,
        status: formData.status as 'active' | 'inactive',
        doctor_name: formData.doctor_name || null,
        doctor_phone: formData.doctor_phone || null,
        notes: formData.notes || null,
        enrollment_date: formData.enrollment_date || null,
        allergies: allergies,
      })

      router.push(`/dashboard/children/${childId}`)
    } catch (error) {
      console.error('Error updating child:', error)
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
        <Link href={`/dashboard/children/${childId}`}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.children.editChild}</h1>
          <p className="text-gray-500">{t.children.editChildSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.children.childInfo}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.firstName} *
                </label>
                <GlassInput
                  placeholder={t.children.firstName}
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.lastName} *
                </label>
                <GlassInput
                  placeholder={t.children.lastName}
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.dateOfBirth}
                </label>
                <GlassInput
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.gender}
                </label>
                <GlassSelect
                  options={genderOptions}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.classroom}
                </label>
                <GlassSelect
                  options={classroomOptions}
                  value={formData.classroom_id}
                  onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.nav.families}
                </label>
                <GlassSelect
                  options={familyOptions}
                  value={formData.family_id}
                  onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.enrollmentDate}
                </label>
                <GlassInput
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.doctorName}
                </label>
                <GlassInput
                  placeholder="Dr. Nombre Apellido"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.children.doctorPhone}
                </label>
                <GlassInput
                  placeholder="(305) 555-0000"
                  value={formData.doctor_phone}
                  onChange={(e) => setFormData({ ...formData, doctor_phone: e.target.value })}
                />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.children.allergies}
              </label>
              <div className="flex gap-2 mb-2">
                <GlassInput
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder={t.children.addAllergy}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <GlassButton type="button" variant="secondary" onClick={addAllergy}>
                  <Plus className="w-5 h-5" />
                </GlassButton>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error/20 text-error text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="hover:bg-error/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.children.medicalNotes}
              </label>
              <GlassTextarea
                rows={3}
                placeholder={t.children.medicalNotesPlaceholder}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/children/${childId}`}>
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
