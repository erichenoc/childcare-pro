'use client'

import { useState } from 'react'
import { X, Upload, Calendar, User, Building2, FileText } from 'lucide-react'
import {
  GlassModal,
  GlassModalFooter,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import type {
  ImmunizationRecordFormData,
  DcfVaccineRequirement,
  ImmunizationStatus,
  DocumentType,
} from '@/shared/types/immunizations'

interface ImmunizationRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ImmunizationRecordFormData) => Promise<void>
  childId: string
  childName: string
  vaccineRequirements: DcfVaccineRequirement[]
  existingRecord?: ImmunizationRecordFormData
  isLoading?: boolean
}

export function ImmunizationRecordModal({
  isOpen,
  onClose,
  onSubmit,
  childId,
  childName,
  vaccineRequirements,
  existingRecord,
  isLoading,
}: ImmunizationRecordModalProps) {
  const [formData, setFormData] = useState<ImmunizationRecordFormData>(
    existingRecord || {
      child_id: childId,
      vaccine_name: '',
      vaccine_code: '',
      dose_number: 1,
      date_administered: new Date().toISOString().split('T')[0],
      status: 'pending',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVaccineChange = (vaccineCode: string) => {
    const vaccine = vaccineRequirements.find(v => v.vaccine_code === vaccineCode)
    setFormData({
      ...formData,
      vaccine_code: vaccineCode,
      vaccine_name: vaccine?.vaccine_name || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.vaccine_name) newErrors.vaccine_name = 'Vaccine is required'
    if (!formData.date_administered) newErrors.date_administered = 'Date is required'
    if (formData.dose_number < 1) newErrors.dose_number = 'Dose number must be at least 1'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit(formData)
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {existingRecord ? 'Edit Immunization Record' : 'Add Immunization Record'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              For: {childName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Vaccine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vaccine *
            </label>
            <GlassSelect
              value={formData.vaccine_code || ''}
              onChange={(e) => handleVaccineChange(e.target.value)}
              error={errors.vaccine_name}
              placeholder="Select a vaccine"
              options={[
                ...vaccineRequirements.map((vaccine) => ({
                  value: vaccine.vaccine_code,
                  label: vaccine.vaccine_name,
                })),
                { value: 'other', label: 'Other (specify)' },
              ]}
            />
          </div>

          {/* Custom Vaccine Name (if Other selected) */}
          {formData.vaccine_code === 'other' && (
            <GlassInput
              label="Vaccine Name *"
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              placeholder="Enter vaccine name"
              error={errors.vaccine_name}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Dose Number */}
            <GlassInput
              label="Dose Number *"
              type="number"
              min={1}
              max={10}
              value={formData.dose_number}
              onChange={(e) => setFormData({ ...formData, dose_number: parseInt(e.target.value) || 1 })}
              error={errors.dose_number}
              leftIcon={<span className="text-gray-400">#</span>}
            />

            {/* Date Administered */}
            <GlassInput
              label="Date Administered *"
              type="date"
              value={formData.date_administered}
              onChange={(e) => setFormData({ ...formData, date_administered: e.target.value })}
              error={errors.date_administered}
              leftIcon={<Calendar className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Provider Info */}
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Provider Name"
              value={formData.provider_name || ''}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              placeholder="Dr. Smith"
              leftIcon={<User className="w-4 h-4 text-gray-400" />}
            />

            <GlassInput
              label="Location"
              value={formData.provider_location || ''}
              onChange={(e) => setFormData({ ...formData, provider_location: e.target.value })}
              placeholder="Pediatrics Clinic"
              leftIcon={<Building2 className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Lot Number */}
          <GlassInput
            label="Lot Number"
            value={formData.lot_number || ''}
            onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
            placeholder="Enter vaccine lot number"
          />

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Type
            </label>
            <GlassSelect
              value={formData.document_type || ''}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value as DocumentType })}
              placeholder="Select document type"
              options={[
                { value: 'certificate', label: 'Certificate' },
                { value: 'record', label: 'Medical Record' },
                { value: 'exemption', label: 'Exemption Form' },
              ]}
            />
          </div>

          {/* Document Upload Placeholder */}
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Document upload coming soon
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              PDF, JPG, or PNG up to 5MB
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              className="input-neu w-full min-h-[80px] resize-none"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <GlassModalFooter>
          <GlassButton variant="ghost" onClick={onClose} type="button">
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" isLoading={isLoading}>
            {existingRecord ? 'Update Record' : 'Add Record'}
          </GlassButton>
        </GlassModalFooter>
      </form>
    </GlassModal>
  )
}
