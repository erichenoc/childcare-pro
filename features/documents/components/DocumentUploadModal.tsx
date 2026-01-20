'use client'

import { useState, useEffect } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import {
  GlassModal,
  GlassModalFooter,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from '@/shared/components/ui'
import { documentsService } from '../services/documents.service'
import type {
  DocumentFormData,
  DocumentTemplate,
  EntityType,
  DocumentCategory,
} from '@/shared/types/documents'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entityType?: EntityType
  entityId?: string
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  entityType,
  entityId,
}: DocumentUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [formData, setFormData] = useState<DocumentFormData>({
    name: '',
    category: 'other',
    entity_type: entityType || 'child',
    entity_id: entityId || '',
    description: '',
    effective_date: '',
    expiration_date: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, formData.entity_type])

  const loadTemplates = async () => {
    try {
      const data = await documentsService.getTemplates({
        applies_to: formData.entity_type,
      })
      setTemplates(data)
    } catch (err) {
      console.error('Error loading templates:', err)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (templateId) {
      const template = templates.find((t) => t.id === templateId)
      if (template) {
        setFormData((prev) => ({
          ...prev,
          template_id: templateId,
          name: template.name,
          category: template.category,
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        template_id: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.entity_id) {
        throw new Error('Please select an entity')
      }

      await documentsService.createDocument(formData)
      onSuccess()
      onClose()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      entity_type: entityType || 'child',
      entity_id: entityId || '',
      description: '',
      effective_date: '',
      expiration_date: '',
      notes: '',
    })
    setSelectedTemplate('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const categoryOptions = [
    { value: 'enrollment', label: 'Enrollment' },
    { value: 'medical', label: 'Medical' },
    { value: 'dcf', label: 'DCF Required' },
    { value: 'permission', label: 'Permission' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'financial', label: 'Financial' },
    { value: 'other', label: 'Other' },
  ]

  const entityTypeOptions = [
    { value: 'child', label: 'Child' },
    { value: 'family', label: 'Family' },
    { value: 'staff', label: 'Staff' },
  ]

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Use Template (Optional)
          </label>
          <GlassSelect
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            placeholder="-- Select a template --"
            options={templates.map((template) => ({
              value: template.id,
              label: template.name + (template.is_dcf_required ? ' (DCF Required)' : ''),
            }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Name *
            </label>
            <GlassInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter document name"
              required
            />
          </div>

          {/* Entity Type */}
          {!entityType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entity Type *
              </label>
              <GlassSelect
                value={formData.entity_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entity_type: e.target.value as EntityType,
                    entity_id: '',
                  })
                }
                required
                options={entityTypeOptions}
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <GlassSelect
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as DocumentCategory })
              }
              required
              options={categoryOptions}
            />
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Effective Date
            </label>
            <GlassInput
              type="date"
              value={formData.effective_date || ''}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiration Date
            </label>
            <GlassInput
              type="date"
              value={formData.expiration_date || ''}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <GlassTextarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
        </div>

        {/* File Upload Placeholder */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag and drop file here, or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Supports PDF, images, and documents (max 10MB)
          </p>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <GlassTextarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes"
            rows={2}
          />
        </div>

        <GlassModalFooter>
          <GlassButton type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </GlassButton>
        </GlassModalFooter>
      </form>
    </GlassModal>
  )
}
