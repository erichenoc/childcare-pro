'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Sun,
  Check,
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
import { programIncomeService, type SummerCampWeek } from '@/features/accounting/services/program-income.service'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'

export default function NewChildPage() {
  const t = useTranslations()
  const router = useRouter()

  // Options with translations (must be inside component to access t)
  const genderOptions = [
    { value: '', label: t.children.selectGender },
    { value: 'male', label: t.children.male },
    { value: 'female', label: t.children.female },
  ]

  const scheduleTypeOptions = [
    { value: 'full_time', label: t.children.fullTimeSchedule },
    { value: 'part_time', label: t.children.partTimeSchedule },
    { value: 'drop_in', label: t.children.dropInSchedule },
  ]

  const vpkScheduleOptions = [
    { value: 'school_year', label: t.children.vpkSchoolYear },
    { value: 'summer', label: t.children.vpkSummer },
  ]

  const copayFrequencyOptions = [
    { value: 'weekly', label: t.children.copayWeekly },
    { value: 'monthly', label: t.children.copayMonthly },
  ]

  const srRateTypeOptions = [
    { value: 'full_time', label: t.children.srFullTime },
    { value: 'part_time', label: t.children.srPartTime },
    { value: 'hourly', label: t.children.srHourly },
  ]

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string }[]>([])
  const [familyOptions, setFamilyOptions] = useState<{ value: string; label: string }[]>([])

  // Summer Camp state
  const [summerCampWeeks, setSummerCampWeeks] = useState<SummerCampWeek[]>([])
  const [enrollInSummerCamp, setEnrollInSummerCamp] = useState(false)
  const [selectedSummerWeeks, setSelectedSummerWeeks] = useState<string[]>([])

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

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false)
  useUnsavedChanges(hasChanges)

  // Wrap setFormData to track changes
  const updateFormData = useCallback((updater: React.SetStateAction<typeof formData>) => {
    setFormData(updater)
    setHasChanges(true)
  }, [])

  useEffect(() => {
    loadOptions()
  }, [])

  async function loadOptions() {
    try {
      setIsLoadingData(true)
      const currentYear = new Date().getFullYear()
      const [classrooms, families, summerWeeks] = await Promise.all([
        classroomsService.getAll(),
        familiesService.getAll(),
        programIncomeService.getSummerCampWeeks(currentYear),
      ])

      setClassroomOptions([
        { value: '', label: 'Sin asignar' },
        ...classrooms.map(c => ({ value: c.id, label: c.name })),
      ])
      setFamilyOptions([
        { value: '', label: 'Seleccionar familia...' },
        ...families.map(f => ({ value: f.id, label: f.primary_contact_name })),
      ])
      setSummerCampWeeks(summerWeeks)
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
    updateFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }))
  }

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProgram = e.target.value as ChildProgramType
    updateFormData((prev) => ({
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

  const toggleSummerWeek = (weekId: string) => {
    setSelectedSummerWeeks(prev =>
      prev.includes(weekId)
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const summerCampTotal = selectedSummerWeeks.length > 0
    ? summerCampWeeks
        .filter(w => selectedSummerWeeks.includes(w.id))
        .reduce((sum, w) => sum + w.weekly_rate, 0)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name || !formData.family_id || !formData.date_of_birth) {
      setError(t.children.requiredFieldsError)
      return
    }

    // Validate VPK fields
    if (isVPKProgram(formData.program_type) && !formData.vpk_certificate_number) {
      setError(t.children.vpkCertificateRequired)
      return
    }

    // Validate SR fields
    if (isSRProgram(formData.program_type) && !formData.sr_case_number) {
      setError(t.children.srCaseNumberRequired)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate classroom capacity if a classroom is selected
      if (formData.classroom_id) {
        const capacityCheck = await classroomsService.canAddChild(formData.classroom_id)
        if (!capacityCheck.allowed) {
          setError(`${t.children.classroomCapacityError}: ${capacityCheck.message}`)
          setIsLoading(false)
          return
        }
      }

      // Use createWithProgram for automatic enrollment creation
      await childrenService.createWithProgram({
        ...formData,
        allergies,
      })

      setHasChanges(false) // Clear before navigation
      router.push('/dashboard/children')
    } catch (err) {
      console.error('Error saving child:', err)
      setError(t.children.saveError)
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
                  value={formData.classroom_id ?? ''}
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
              {t.children.programPayment}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.children.programType} *
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
                  {t.children.scheduleType}
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
                {formData.program_type === 'private' && t.children.privatePayDescription}
                {formData.program_type === 'vpk' && t.children.vpkDescription}
                {formData.program_type === 'vpk_wraparound' && t.children.vpkWraparoundDescription}
                {formData.program_type === 'school_readiness' && t.children.srDescription}
                {formData.program_type === 'sr_copay' && t.children.srCopayDescription}
              </p>
            </div>

            {/* VPK Fields */}
            {isVPKProgram(formData.program_type) && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t.children.vpkInfo}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.children.vpkCertificateNumber} *
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
                      {t.children.vpkScheduleType}
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
                    {t.children.vpkStartDate}
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
                      {t.children.wrapAroundRate}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.children.weeklyWrapAroundRate}
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
                          {t.children.hourlyRate}
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
                  {t.children.srInfo}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.children.srCaseNumber} *
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
                      {t.children.srRateType}
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
                      {t.children.authorizedHoursWeekly}
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
                      {t.children.eligibilityStart}
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
                      {t.children.eligibilityEnd}
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
                      {t.children.familyCoPay}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.children.copayAmount}
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
                          {t.children.copayFrequency}
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
                  {t.children.privatePayRates}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.children.weeklyRate}
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
                      {t.children.hourlyRate}
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

        {/* Summer Camp Enrollment */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              Summer Camp (Opcional)
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enroll_summer_camp"
                checked={enrollInSummerCamp}
                onChange={(e) => {
                  setEnrollInSummerCamp(e.target.checked)
                  if (!e.target.checked) setSelectedSummerWeeks([])
                }}
                className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <label htmlFor="enroll_summer_camp" className="text-gray-700 dark:text-gray-300">
                Inscribir en Summer Camp {new Date().getFullYear()}
              </label>
            </div>

            {enrollInSummerCamp && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>Programa de Verano:</strong> 10 semanas de actividades temáticas (Junio - Agosto).
                    Selecciona las semanas en las que deseas inscribir al niño.
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">
                    Tarifa: $275/semana • Incluye actividades, meriendas y excursiones locales
                  </p>
                </div>

                {/* Week Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {summerCampWeeks.map((week) => {
                    const isSelected = selectedSummerWeeks.includes(week.id)
                    const isFull = week.current_enrollment >= week.max_capacity

                    return (
                      <button
                        key={week.id}
                        type="button"
                        onClick={() => !isFull && toggleSummerWeek(week.id)}
                        disabled={isFull}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                            : isFull
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">Sem {week.week_number}</span>
                          {isSelected && <Check className="w-4 h-4 text-yellow-600" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {week.theme}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(week.start_date).toLocaleDateString('es-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs mt-1">
                          <span className={`${
                            isFull ? 'text-red-600' : week.current_enrollment >= week.max_capacity * 0.8 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {week.current_enrollment}/{week.max_capacity}
                          </span>
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Summary */}
                {selectedSummerWeeks.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>{selectedSummerWeeks.length}</strong> semanas seleccionadas
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                          {summerCampWeeks
                            .filter(w => selectedSummerWeeks.includes(w.id))
                            .map(w => `Sem ${w.week_number}`)
                            .join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(summerCampTotal)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">Total a cobrar</p>
                      </div>
                    </div>
                  </div>
                )}
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
                  value={formData.doctor_name ?? ''}
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
                  value={formData.doctor_phone ?? ''}
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
                value={formData.medical_conditions ?? ''}
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
                {t.children.saving}
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
