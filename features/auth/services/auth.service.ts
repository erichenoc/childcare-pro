import { createClient } from '@/shared/lib/supabase/client'
import type { Profile, TablesInsert } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export type AuthError = {
  message: string
  code?: string
}

export type SignInResult = {
  success: boolean
  error?: AuthError
}

export type SignUpResult = {
  success: boolean
  error?: AuthError
  requiresConfirmation?: boolean
}

export const authService = {
  async signIn(email: string, password: string): Promise<SignInResult> {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
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

  async signUp(
    email: string,
    password: string,
    profile: { firstName: string; lastName: string; phone?: string }
  ): Promise<SignUpResult> {
    const supabase = createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
        },
      },
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

    // If email confirmation is required
    if (authData.user && !authData.session) {
      return {
        success: true,
        requiresConfirmation: true,
      }
    }

    // Create profile if user was created and confirmed
    if (authData.user) {
      const profileData: TablesInsert<'profiles'> = {
        id: authData.user.id,
        email,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone || null,
        organization_id: DEMO_ORG_ID,
        role: 'teacher', // Default role
        status: 'active',
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Don't fail the signup, profile can be created later
      }
    }

    return { success: true }
  },

  async signOut(): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
  },

  async signInWithGoogle(): Promise<SignInResult> {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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

  async resetPassword(email: string): Promise<SignInResult> {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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

  async updatePassword(newPassword: string): Promise<SignInResult> {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
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

  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  },

  async updateProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },
}
