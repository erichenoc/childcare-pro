import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'

const LOGO_BUCKET = 'organization-logos'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export const storageService = {
  /**
   * Upload organization logo
   */
  async uploadLogo(file: File): Promise<UploadResult> {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Use JPG, PNG, WebP o SVG.',
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'El archivo es muy grande. Máximo 2MB.',
      }
    }

    const supabase = createClient()
    const orgId = await requireOrgId()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${orgId}/logo.${fileExt}`

    // Delete existing logo if exists
    await supabase.storage.from(LOGO_BUCKET).remove([`${orgId}/logo.*`])

    // Upload new logo
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: 'Error al subir el archivo. Intente de nuevo.',
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(fileName)

    // Add cache buster to force refresh
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    return {
      success: true,
      url: publicUrl,
    }
  },

  /**
   * Delete organization logo
   */
  async deleteLogo(): Promise<UploadResult> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // List all files in org folder
    const { data: files } = await supabase.storage
      .from(LOGO_BUCKET)
      .list(orgId)

    if (files && files.length > 0) {
      const filePaths = files.map(f => `${orgId}/${f.name}`)
      const { error } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove(filePaths)

      if (error) {
        return {
          success: false,
          error: 'Error al eliminar el logo.',
        }
      }
    }

    return { success: true }
  },

  /**
   * Get logo URL for an organization
   */
  async getLogoUrl(orgId: string): Promise<string | null> {
    const supabase = createClient()

    // Check for common extensions
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg']

    for (const ext of extensions) {
      const fileName = `${orgId}/logo.${ext}`
      const { data } = supabase.storage
        .from(LOGO_BUCKET)
        .getPublicUrl(fileName)

      // Check if file exists by trying to fetch it
      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          return data.publicUrl
        }
      } catch {
        continue
      }
    }

    return null
  },
}
