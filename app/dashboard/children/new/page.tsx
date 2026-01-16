'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  Phone,
  Heart,
  AlertTriangle,
  Plus,
  X,
  Loader2,
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

export default function NewChildPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string }[]>([])
  const [familyOptions, setFamilyOptions] = useState<{ value: string; label: string }[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    classroom_id: '',
    family_id: '',
    doctor_name: '',
    doctor_phone: '',
    notes: '',
    enrollment_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadOptions()
  }, [])

  async function loadOptions() {
    try {
      setIsLoadingData(true)
      const [classrooms, families] = await Promise.all([
        classroomsService.getAll(),
        familiesService.getAll(),
      ])

      setClassroomOptions([
        { value: '', label: 'Sin asignar' },
        ...classrooms.map(c => ({ value: c.id, label: c.name })),
      ])
      setFamilyOptions([
        { value: '', label: 'Seleccionar familia...' },
        ...families.map(f => ({ value: f.id, label: f.primary_contact_name })),
      ])
    } catch (err) {
      console.error('Error loading options:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name || !formData.family_id || !formData.date_of_birth) {
      setError('Por favor complete los campos requeridos (nombre, apellido, fecha de nacimiento y familia)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await childrenService.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        classroom_id: formData.classroom_id || null,
        family_id: formData.family_id || null,
        doctor_name: formData.doctor_name || null,
        doctor_phone: formData.doctor_phone || null,
        notes: formData.notes || null,
        enrollment_date: formData.enrollment_date || null,
        allergies: allergies,
        status: 'active',
      })

      router.push('/dashboard/children')
    } catch (err) {
      console.error('Error saving child:', err)
      setError('Error al guardar. Por favor intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/children">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.children.addChild}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.children.addChildSubtitle}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Child Information */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              {t.children.childInfo}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.firstName} *
                </label>
                <GlassInput
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder={t.children.firstName}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.lastName} *
                </label>
                <GlassInput
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder={t.children.lastName}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.dateOfBirth} *
                </label>
                <GlassInput
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.gender}
                </label>
                <GlassSelect
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={genderOptions}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.classroom}
                </label>
                <GlassSelect
                  name="classroom_id"
                  value={formData.classroom_id}
                  onChange={handleInputChange}
                  options={classroomOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.nav.families} *
                </label>
                <GlassSelect
                  name="family_id"
                  value={formData.family_id}
                  onChange={handleInputChange}
                  options={familyOptions}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.children.enrollmentDate}
              </label>
              <GlassInput
                type="date"
                name="enrollment_date"
                value={formData.enrollment_date}
                onChange={handleInputChange}
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Medical Information */}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.doctorName}
                </label>
                <GlassInput
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  placeholder="Dr. Nombre Apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.doctorPhone}
                </label>
                <GlassInput
                  name="doctor_phone"
                  value={formData.doctor_phone}
                  onChange={handleInputChange}
                  leftIcon={<Phone className="w-5 h-5" />}
                  placeholder="(305) 555-0000"
                />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-warning" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.children.medicalNotes}
              </label>
              <GlassTextarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder={t.children.medicalNotesPlaceholder}
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/children">
            <GlassButton type="button" variant="secondary">
              {t.common.cancel}
            </GlassButton>
          </Link>
          <GlassButton
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {t.common.save}
              </>
            )}
          </GlassButton>
        </div>
      </form>
    </div>
  )
}
