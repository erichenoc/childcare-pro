'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, Building2 } from 'lucide-react'
import { GlassButton } from '@/shared/components/ui'
import { storageService } from '../services/storage.service'
import { organizationService } from '../services/organization.service'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  onLogoChange?: (url: string | null) => void
  organizationId?: string
}

export function LogoUpload({ currentLogoUrl, onLogoChange, organizationId }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const result = await storageService.uploadLogo(file)

      if (!result.success) {
        setError(result.error || 'Error uploading file')
        setPreviewUrl(currentLogoUrl || null)
        return
      }

      // Update organization with new logo URL
      if (organizationId && result.url) {
        await organizationService.updateLogo(organizationId, result.url)
      }

      setPreviewUrl(result.url || null)
      onLogoChange?.(result.url || null)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error inesperado. Intente de nuevo.')
      setPreviewUrl(currentLogoUrl || null)
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!previewUrl) return

    setIsUploading(true)
    setError(null)

    try {
      const result = await storageService.deleteLogo()

      if (!result.success) {
        setError(result.error || 'Error removing logo')
        return
      }

      // Update organization to remove logo URL
      if (organizationId) {
        await organizationService.updateLogo(organizationId, '')
      }

      setPreviewUrl(null)
      onLogoChange?.(null)
    } catch (err) {
      console.error('Remove error:', err)
      setError('Error inesperado. Intente de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Logo de la organización"
              fill
              className="object-contain p-2"
            />
          ) : (
            <Building2 className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* Remove button */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemoveLogo}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center hover:bg-error/80 transition-colors"
            title="Eliminar logo"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          id="logo-upload"
          disabled={isUploading}
        />
        <label htmlFor="logo-upload" className="cursor-pointer inline-block">
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-neu-bg shadow-neu hover:shadow-neu-inset transition-shadow duration-200 dark:bg-neu-bg-dark dark:shadow-neu-dark">
            <Upload className="w-4 h-4" />
            {previewUrl ? 'Cambiar Logo' : 'Subir Logo'}
          </span>
        </label>
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, WebP o SVG. Máximo 2MB.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  )
}
