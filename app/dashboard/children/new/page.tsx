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
  GraduationCap,
  DollarSign,
  BookOpen,
  Clock,
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
import type { ChildProgramType, ChildFormData } from '@/shared/types/children-extended'
import { PROGRAM_TYPE_OPTIONS, isVPKProgram, isSRProgram } from '@/shared/types/children-extended'

const genderOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
]

const scheduleTypeOptions = [
  { value: 'full_time', label: 'Tiempo Completo' },
  { value: 'part_time', label: 'Medio Tiempo' },
  { value: 'drop_in', label: 'Drop-in (Por día)' },
]

const vpkScheduleOptions = [
  { value: 'school_year', label: 'Año Escolar (540 horas)' },
  { value: 'summer', label: 'Verano (300 horas)' },
]

const copayFrequencyOptions = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
]

const srRateTypeOptions = [
  { value: 'full_time', label: 'Tiempo Completo (30+ hrs/sem)' },
  { value: 'part_time', label: 'Medio Tiempo (15-29 hrs/sem)' },
  { value: 'hourly', label: 'Por Hora' },
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

  const [formData, setFormData] = useState<ChildFormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    classroom_id: '',
    family_id: '',
    doctor_name: '',
    doctor_phone: '',
    medical_conditions: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    // Program fields
    program_type: 'private',
    schedule_type: 'full_time',
    // VPK fields
    vpk_certificate_number: '',
    vpk_schedule_type: 'school_year',
    vpk_start_date: '',
    // SR fields
    sr_case_number: '',
    sr_authorized_hours_weekly: 40,
    sr_copay_amount: 0,
    sr_copay_frequency: 'weekly',
    sr_rate_type: 'full_time',
    sr_eligibility_start: '',
    sr_eligibility_end: '',
    // Private pay fields
    weekly_rate: undefined,
    hourly_rate: undefined,
    allergies: [],
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
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }))
  }

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProgram = e.target.value as ChildProgramType
    setFormData((prev) => ({
      ...prev,
      program_type: newProgram,
      // Reset VPK fields if not VPK
      vpk_certificate_number: isVPKProgram(newProgram) ? prev.vpk_certificate_number : '',
      vpk_schedule_type: isVPKProgram(newProgram) ? prev.vpk_schedule_type : 'school_year',
      // Reset SR fields if not SR
      sr_case_number: isSRProgram(newProgram) ? prev.sr_case_number : '',
      sr_authorized_hours_weekly: isSRProgram(newProgram) ? prev.sr_authorized_hours_weekly : 40,
      sr_copay_amount: isSRProgram(newProgram) ? prev.sr_copay_amount : 0,
    }))
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

    // Validate VPK fields
    if (isVPKProgram(formData.program_type) && !formData.vpk_certificate_number) {
      setError('El número de certificado VPK es requerido para programas VPK')
      return
    }

    // Validate SR fields
    if (isSRProgram(formData.program_type) && !formData.sr_case_number) {
      setError('El número de caso SR es requerido para programas School Readiness')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use createWithProgram for automatic enrollment creation
      await childrenService.createWithProgram({
        ...formData,
        allergies,
      })

      router.push('/dashboard/children')
    } catch (err) {
      console.error('Error saving child:', err)
      setError('Error al guardar. Por favor intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const programOptions = PROGRAM_TYPE_OPTIONS.map(p => ({
    value: p.value,
    label: `${p.icon} ${p.label}`,
  }))

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

        {/* Program Selection - NEW SECTION */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-500" />
              Programa de Pago
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Programa *
                </label>
                <GlassSelect
                  name="program_type"
                  value={formData.program_type}
                  onChange={handleProgramChange}
                  options={programOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horario
                </label>
                <GlassSelect
                  name="schedule_type"
                  value={formData.schedule_type}
                  onChange={handleInputChange}
                  options={scheduleTypeOptions}
                />
              </div>
            </div>

            {/* Program Type Description */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {formData.program_type === 'private' && (
                  <>Pago privado: La familia paga la tarifa completa directamente.</>
                )}
                {formData.program_type === 'vpk' && (
                  <>VPK: Programa estatal gratuito de 3 horas diarias para niños de 4 años.</>
                )}
                {formData.program_type === 'vpk_wraparound' && (
                  <>VPK + Wrap-Around: VPK (3 hrs gratis) más horas adicionales pagadas por la familia.</>
                )}
                {formData.program_type === 'school_readiness' && (
                  <>School Readiness: Programa subsidiado por el ELC. El costo es cubierto completamente.</>
                )}
                {formData.program_type === 'sr_copay' && (
                  <>School Readiness + Co-Pay: Programa SR con co-pago parcial de la familia.</>
                )}
              </p>
            </div>

            {/* VPK Fields */}
            {isVPKProgram(formData.program_type) && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Información VPK
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Certificado VPK *
                    </label>
                    <GlassInput
                      name="vpk_certificate_number"
                      value={formData.vpk_certificate_number}
                      onChange={handleInputChange}
                      placeholder="VPK-12345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Horario VPK
                    </label>
                    <GlassSelect
                      name="vpk_schedule_type"
                      value={formData.vpk_schedule_type}
                      onChange={handleInputChange}
                      options={vpkScheduleOptions}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Inicio VPK
                  </label>
                  <GlassInput
                    type="date"
                    name="vpk_start_date"
                    value={formData.vpk_start_date}
                    onChange={handleInputChange}
                  />
                </div>

                {formData.program_type === 'vpk_wraparound' && (
                  <div className="pt-4 border-t border-green-200 dark:border-green-700">
                    <h5 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Tarifa Wrap-Around (Horas adicionales)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tarifa Semanal Wrap-Around ($)
                        </label>
                        <GlassInput
                          type="number"
                          name="weekly_rate"
                          value={formData.weekly_rate || ''}
                          onChange={handleInputChange}
                          placeholder="150.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tarifa por Hora ($)
                        </label>
                        <GlassInput
                          type="number"
                          name="hourly_rate"
                          value={formData.hourly_rate || ''}
                          onChange={handleInputChange}
                          placeholder="12.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* School Readiness Fields */}
            {isSRProgram(formData.program_type) && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 space-y-4">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Información School Readiness
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Caso SR *
                    </label>
                    <GlassInput
                      name="sr_case_number"
                      value={formData.sr_case_number}
                      onChange={handleInputChange}
                      placeholder="SR-123456"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Tarifa
                    </label>
                    <GlassSelect
                      name="sr_rate_type"
                      value={formData.sr_rate_type}
                      onChange={handleInputChange}
                      options={srRateTypeOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Horas Autorizadas por Semana
                    </label>
                    <GlassInput
                      type="number"
                      name="sr_authorized_hours_weekly"
                      value={formData.sr_authorized_hours_weekly || ''}
                      onChange={handleInputChange}
                      placeholder="40"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inicio de Elegibilidad
                    </label>
                    <GlassInput
                      type="date"
                      name="sr_eligibility_start"
                      value={formData.sr_eligibility_start}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fin de Elegibilidad
                    </label>
                    <GlassInput
                      type="date"
                      name="sr_eligibility_end"
                      value={formData.sr_eligibility_end}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {formData.program_type === 'sr_copay' && (
                  <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
                    <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Co-Pago Familiar
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Monto de Co-Pago ($)
                        </label>
                        <GlassInput
                          type="number"
                          name="sr_copay_amount"
                          value={formData.sr_copay_amount || ''}
                          onChange={handleInputChange}
                          placeholder="25.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Frecuencia de Co-Pago
                        </label>
                        <GlassSelect
                          name="sr_copay_frequency"
                          value={formData.sr_copay_frequency}
                          onChange={handleInputChange}
                          options={copayFrequencyOptions}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Private Pay Fields */}
            {formData.program_type === 'private' && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Tarifas de Pago Privado
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tarifa Semanal ($)
                    </label>
                    <GlassInput
                      type="number"
                      name="weekly_rate"
                      value={formData.weekly_rate || ''}
                      onChange={handleInputChange}
                      placeholder="250.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tarifa por Hora ($)
                    </label>
                    <GlassInput
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate || ''}
                      onChange={handleInputChange}
                      placeholder="15.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}
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
                name="medical_conditions"
                value={formData.medical_conditions}
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
