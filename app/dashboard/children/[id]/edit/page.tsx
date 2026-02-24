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
  Phone,
  GraduationCap,
  DollarSign,
  BookOpen,
  Clock,
  Save,
  AlertTriangle,
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

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
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

export default function EditChildPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const childId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string }[]>([])
  const [familyOptions, setFamilyOptions] = useState<{ value: string; label: string }[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')

  const [formData, setFormData] = useState<ChildFormData & { status: string }>({
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
        // Cast to access extended program fields
        const childData = child as Record<string, unknown>

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
          // Program fields
          program_type: (childData.program_type as ChildProgramType) || 'private',
          schedule_type: (childData.schedule_type as 'full_time' | 'part_time' | 'drop_in') || 'full_time',
          // VPK fields
          vpk_certificate_number: (childData.vpk_certificate_number as string) || '',
          vpk_schedule_type: (childData.vpk_schedule_type as 'school_year' | 'summer') || 'school_year',
          vpk_start_date: (childData.vpk_start_date as string) || '',
          // SR fields
          sr_case_number: (childData.sr_case_number as string) || '',
          sr_authorized_hours_weekly: (childData.sr_authorized_hours_weekly as number) || 40,
          sr_copay_amount: (childData.sr_copay_amount as number) || 0,
          sr_copay_frequency: (childData.sr_copay_frequency as 'weekly' | 'monthly') || 'weekly',
          sr_rate_type: (childData.sr_rate_type as 'full_time' | 'part_time' | 'hourly') || 'full_time',
          sr_eligibility_start: (childData.sr_eligibility_start as string) || '',
          sr_eligibility_end: (childData.sr_eligibility_end as string) || '',
          // Private pay fields
          weekly_rate: (childData.weekly_rate as number) || undefined,
          hourly_rate: (childData.hourly_rate as number) || undefined,
          allergies: Array.isArray(child.allergies) ? child.allergies as string[] : [],
        })
        setAllergies(Array.isArray(child.allergies) ? child.allergies as string[] : [])
      }
    } catch (err) {
      console.error('Error loading child:', err)
      setError('Error al cargar los datos')
    } finally {
      setIsLoading(false)
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
    if (!formData.first_name || !formData.last_name) {
      setError('Por favor complete los campos requeridos')
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

    try {
      setIsSaving(true)
      setError(null)

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
        // Program fields
        program_type: formData.program_type,
        schedule_type: formData.schedule_type,
        // VPK fields
        vpk_certificate_number: formData.vpk_certificate_number || null,
        vpk_schedule_type: formData.vpk_schedule_type || null,
        // SR fields
        sr_case_number: formData.sr_case_number || null,
        sr_authorized_hours_weekly: formData.sr_authorized_hours_weekly || null,
        sr_copay_amount: formData.sr_copay_amount || null,
        sr_copay_frequency: formData.sr_copay_frequency || null,
        // Private pay fields
        weekly_rate: formData.weekly_rate || null,
        hourly_rate: formData.hourly_rate || null,
      } as Record<string, unknown>)

      router.push(`/dashboard/children/${childId}`)
    } catch (err) {
      console.error('Error updating child:', err)
      setError('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const programOptions = PROGRAM_TYPE_OPTIONS.map(p => ({
    value: p.value,
    label: `${p.icon} ${p.label}`,
  }))

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.children.editChild}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.children.editChildSubtitle}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
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
                  placeholder={t.children.firstName}
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.lastName} *
                </label>
                <GlassInput
                  name="last_name"
                  placeholder={t.children.lastName}
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.dateOfBirth}
                </label>
                <GlassInput
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.gender}
                </label>
                <GlassSelect
                  name="gender"
                  options={genderOptions}
                  value={formData.gender}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.classroom}
                </label>
                <GlassSelect
                  name="classroom_id"
                  options={classroomOptions}
                  value={formData.classroom_id ?? ''}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.nav.families}
                </label>
                <GlassSelect
                  name="family_id"
                  options={familyOptions}
                  value={formData.family_id}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.common.status}
                </label>
                <GlassSelect
                  name="status"
                  options={statusOptions}
                  value={formData.status}
                  onChange={handleInputChange}
                />
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
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Program Selection */}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.doctorName}
                </label>
                <GlassInput
                  name="doctor_name"
                  placeholder="Dr. Nombre Apellido"
                  value={formData.doctor_name || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.doctorPhone}
                </label>
                <GlassInput
                  name="doctor_phone"
                  placeholder="(305) 555-0000"
                  value={formData.doctor_phone || ''}
                  onChange={handleInputChange}
                  leftIcon={<Phone className="w-5 h-5" />}
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
                rows={3}
                placeholder={t.children.medicalNotesPlaceholder}
                value={formData.notes || ''}
                onChange={handleInputChange}
              />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/children/${childId}`}>
            <GlassButton variant="secondary" type="button">
              {t.common.cancel}
            </GlassButton>
          </Link>
          <GlassButton variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
