import { createClient } from '@/shared/lib/supabase/client'

export type GuardianAuthError = {
  message: string
  code?: string
}

export type GuardianSignInResult = {
  success: boolean
  error?: GuardianAuthError
  guardian?: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    children: Array<{
      id: string
      firstName: string
      lastName: string
      photoUrl?: string
    }>
  }
}

export type MagicLinkResult = {
  success: boolean
  error?: GuardianAuthError
}

export const guardianAuthService = {
  /**
   * Sign in guardian with email and password
   */
  async signIn(email: string, password: string): Promise<GuardianSignInResult> {
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        success: false,
        error: {
          message: authError.message,
          code: authError.code,
        },
      }
    }

    // Verify user is a guardian with portal access
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        has_portal_access,
        portal_user_id,
        children:child_guardians(
          child:children(
            id,
            first_name,
            last_name,
            photo_url
          )
        )
      `)
      .eq('portal_user_id', authData.user.id)
      .eq('has_portal_access', true)
      .single()

    if (guardianError || !guardian) {
      // Sign out since they don't have portal access
      await supabase.auth.signOut()
      return {
        success: false,
        error: {
          message: 'No tienes acceso al portal de padres. Contacta a la guardería.',
          code: 'NO_PORTAL_ACCESS',
        },
      }
    }

    // Update last login
    await supabase
      .from('guardians')
      .update({ portal_last_login: new Date().toISOString() })
      .eq('id', guardian.id)

    return {
      success: true,
      guardian: {
        id: guardian.id,
        email: guardian.email,
        firstName: guardian.first_name,
        lastName: guardian.last_name,
        phone: guardian.phone,
        children: guardian.children?.map((cg: any) => ({
          id: cg.child?.id,
          firstName: cg.child?.first_name,
          lastName: cg.child?.last_name,
          photoUrl: cg.child?.photo_url,
        })).filter((c: any) => c.id) || [],
      },
    }
  },

  /**
   * Send magic link to guardian's email
   */
  async sendMagicLink(email: string): Promise<MagicLinkResult> {
    const supabase = createClient()

    // First check if guardian exists with portal access
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('id, email, has_portal_access')
      .eq('email', email.toLowerCase())
      .eq('has_portal_access', true)
      .single()

    if (guardianError || !guardian) {
      return {
        success: false,
        error: {
          message: 'No se encontró una cuenta de padre con este email.',
          code: 'GUARDIAN_NOT_FOUND',
        },
      }
    }

    // Send magic link
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/family-portal/auth/callback`,
      },
    })

    if (otpError) {
      return {
        success: false,
        error: {
          message: otpError.message,
          code: otpError.code,
        },
      }
    }

    return { success: true }
  },

  /**
   * Sign out guardian
   */
  async signOut(): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
  },

  /**
   * Get current guardian profile
   */
  async getCurrentGuardian() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: guardian, error } = await supabase
      .from('guardians')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        relationship,
        has_portal_access,
        portal_last_login,
        organization_id,
        children:child_guardians(
          is_primary,
          can_pickup,
          child:children(
            id,
            first_name,
            last_name,
            date_of_birth,
            photo_url,
            status,
            classroom:classrooms(
              id,
              name
            )
          )
        )
      `)
      .eq('portal_user_id', user.id)
      .eq('has_portal_access', true)
      .single()

    if (error || !guardian) return null

    return {
      id: guardian.id,
      firstName: guardian.first_name,
      lastName: guardian.last_name,
      email: guardian.email,
      phone: guardian.phone,
      relationship: guardian.relationship,
      organizationId: guardian.organization_id,
      lastLogin: guardian.portal_last_login,
      children: guardian.children?.map((cg: any) => ({
        id: cg.child?.id,
        firstName: cg.child?.first_name,
        lastName: cg.child?.last_name,
        dateOfBirth: cg.child?.date_of_birth,
        photoUrl: cg.child?.photo_url,
        status: cg.child?.status,
        classroom: cg.child?.classroom,
        isPrimary: cg.is_primary,
        canPickup: cg.can_pickup,
      })).filter((c: any) => c.id) || [],
    }
  },

  /**
   * Create password for guardian (first time setup)
   */
  async setupPassword(password: string): Promise<MagicLinkResult> {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return { success: true }
  },

  /**
   * Reset password request
   */
  async resetPassword(email: string): Promise<MagicLinkResult> {
    const supabase = createClient()

    // Check if guardian exists
    const { data: guardian } = await supabase
      .from('guardians')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('has_portal_access', true)
      .single()

    if (!guardian) {
      return {
        success: false,
        error: {
          message: 'No se encontró una cuenta con este email.',
          code: 'NOT_FOUND',
        },
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/family-portal/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return { success: true }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },
}
