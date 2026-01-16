import { createClient } from '@/shared/lib/supabase/client'
import type { Profile, TablesInsert } from '@/shared/types/database.types'
import { organizationService } from '@/features/organization/services/organization.service'

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
  organizationId?: string
}

export interface SignUpProfile {
  firstName: string
  lastName: string
  phone?: string
}

export interface SignUpOrganization {
  name: string
  email?: string
  phone?: string
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

  /**
   * Sign up a new user and create their organization (SaaS flow)
   */
  async signUp(
    email: string,
    password: string,
    profile: SignUpProfile,
    organization?: SignUpOrganization
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
      // Store org data in localStorage for after confirmation
      if (organization) {
        localStorage.setItem('pendingOrg', JSON.stringify({
          name: organization.name,
          email: organization.email || email,
          phone: organization.phone,
          userId: authData.user.id,
        }))
      }
      return {
        success: true,
        requiresConfirmation: true,
      }
    }

    // Create profile and organization if user was created and confirmed
    if (authData.user) {
      try {
        // First create profile without organization
        const profileData: TablesInsert<'profiles'> = {
          id: authData.user.id,
          email,
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone || null,
          organization_id: null, // Will be updated after org creation
          role: 'owner', // New signups are owners of their org
          status: 'active',
          is_org_owner: true,
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Continue anyway, profile will be created on first login
        }

        // Create organization if provided
        if (organization) {
          try {
            const slug = await organizationService.generateSlug(organization.name)
            const org = await organizationService.create(
              {
                name: organization.name,
                slug,
                email: organization.email || email,
                phone: organization.phone,
              },
              authData.user.id
            )

            return {
              success: true,
              organizationId: org.id,
            }
          } catch (orgError) {
            console.error('Error creating organization:', orgError)
            // Return success since user was created
            return { success: true }
          }
        }

        return { success: true }
      } catch (error) {
        console.error('Error in signup process:', error)
        return { success: true } // User was created, other parts can be fixed later
      }
    }

    return { success: true }
  },

  /**
   * Sign up a staff member to an existing organization (invite flow)
   */
  async signUpToOrganization(
    email: string,
    password: string,
    profile: SignUpProfile,
    organizationId: string,
    role: 'director' | 'lead_teacher' | 'teacher' | 'assistant' = 'teacher'
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

    // Create profile for the existing organization
    if (authData.user) {
      const profileData: TablesInsert<'profiles'> = {
        id: authData.user.id,
        email,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone || null,
        organization_id: organizationId,
        role,
        status: 'active',
        is_org_owner: false,
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }

      return {
        success: true,
        organizationId,
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

  /**
   * Check if user has an organization
   */
  async hasOrganization(): Promise<boolean> {
    const profile = await this.getCurrentProfile()
    return !!profile?.organization_id
  },

  /**
   * Handle pending organization creation (after email confirmation)
   */
  async handlePendingOrganization(): Promise<void> {
    const pendingOrgStr = localStorage.getItem('pendingOrg')
    if (!pendingOrgStr) return

    try {
      const pendingOrg = JSON.parse(pendingOrgStr)
      const user = await this.getCurrentUser()

      if (user && user.id === pendingOrg.userId) {
        const hasOrg = await this.hasOrganization()
        if (!hasOrg) {
          const slug = await organizationService.generateSlug(pendingOrg.name)
          await organizationService.create(
            {
              name: pendingOrg.name,
              slug,
              email: pendingOrg.email,
              phone: pendingOrg.phone,
            },
            user.id
          )
        }
      }

      localStorage.removeItem('pendingOrg')
    } catch (error) {
      console.error('Error handling pending organization:', error)
      localStorage.removeItem('pendingOrg')
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },
}
