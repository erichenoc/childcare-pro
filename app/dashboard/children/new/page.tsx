'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
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

const genderOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
]

const classroomOptions = [
  { value: '', label: 'Seleccionar salón...' },
  { value: 'bebes', label: 'Sala Bebés (0-12 meses)' },
  { value: 'mariposas', label: 'Sala Mariposas (1-2 años)' },
  { value: 'estrellas', label: 'Sala Estrellas (3-4 años)' },
  { value: 'arcoiris', label: 'Sala Arcoíris (4-5 años)' },
]

const bloodTypeOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

const relationshipOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'mother', label: 'Madre' },
  { value: 'father', label: 'Padre' },
  { value: 'grandparent', label: 'Abuelo/a' },
  { value: 'sibling', label: 'Hermano/a' },
  { value: 'aunt_uncle', label: 'Tío/a' },
  { value: 'other', label: 'Otro' },
]

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email: string
  isPrimary: boolean
}

export default function NewChildPage() {
  const t = useTranslations()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', relationship: '', phone: '', email: '', isPrimary: true },
  ])

  const [formData, setFormData] = useState({
    // Child info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    classroom: '',

    // Medical
    bloodType: '',
    doctorName: '',
    doctorPhone: '',
    medicalNotes: '',

    // Address
    street: '',
    city: '',
    state: 'FL',
    zipCode: '',
  })

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

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: '', relationship: '', phone: '', email: '', isPrimary: false },
    ])
  }

  const removeEmergencyContact = (index: number) => {
    if (emergencyContacts.length > 1) {
      setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index))
    }
  }

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string | boolean) => {
    setEmergencyContacts(
      emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      router.push('/dashboard/children')
    } catch (error) {
      console.error('Error saving child:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Child Information */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                {t.children.childInfo}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  label={t.children.firstName}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <GlassInput
                  label={t.children.lastName}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  type="date"
                  label={t.children.dateOfBirth}
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                  required
                />
                <GlassSelect
                  label={t.children.gender}
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={genderOptions}
                  required
                />
              </div>

              <GlassSelect
                label={t.children.classroom}
                name="classroom"
                value={formData.classroom}
                onChange={handleInputChange}
                options={classroomOptions}
                required
              />
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
              <GlassSelect
                label={t.children.bloodType}
                name="bloodType"
                value={formData.bloodType}
                onChange={handleInputChange}
                options={bloodTypeOptions}
              />

              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  label={t.children.doctorName}
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  placeholder="Dr. Nombre Apellido"
                />
                <GlassInput
                  label={t.children.doctorPhone}
                  name="doctorPhone"
                  value={formData.doctorPhone}
                  onChange={handleInputChange}
                  leftIcon={<Phone className="w-5 h-5" />}
                  placeholder="(305) 555-0000"
                />
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

              <GlassTextarea
                label={t.children.medicalNotes}
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleInputChange}
                rows={3}
                placeholder={t.children.medicalNotesPlaceholder}
              />
            </GlassCardContent>
          </GlassCard>

          {/* Address */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary-500" />
                {t.children.address}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <GlassInput
                label={t.children.street}
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-3 gap-4">
                <GlassInput
                  label={t.children.city}
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Miami"
                />
                <GlassInput
                  label={t.children.state}
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="FL"
                />
                <GlassInput
                  label={t.children.zipCode}
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="33101"
                />
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Emergency Contacts */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-500" />
                  {t.children.emergencyContacts}
                </GlassCardTitle>
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addEmergencyContact}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t.common.add}
                </GlassButton>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    contact.isPrimary
                      ? 'border-primary-500/30 bg-primary-500/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.children.contact} #{index + 1}
                      {contact.isPrimary && (
                        <span className="ml-2 text-xs text-primary-500">
                          ({t.children.primaryContact})
                        </span>
                      )}
                    </span>
                    {emergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmergencyContact(index)}
                        className="text-gray-400 hover:text-error"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <GlassInput
                      placeholder={t.children.contactName}
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      required
                    />
                    <GlassSelect
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                      options={relationshipOptions}
                      required
                    />
                    <GlassInput
                      placeholder={t.children.phone}
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                      leftIcon={<Phone className="w-4 h-4" />}
                      required
                    />
                    <GlassInput
                      type="email"
                      placeholder={t.children.email}
                      value={contact.email}
                      onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

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
            isLoading={isLoading}
            leftIcon={<Save className="w-5 h-5" />}
          >
            {t.common.save}
          </GlassButton>
        </div>
      </form>
    </div>
  )
}
