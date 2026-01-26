'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { PortalSidebar } from './portal-sidebar'
import { PortalHeader } from './portal-header'
import { PortalMobileNav } from './portal-mobile-nav'
import { guardianAuthService } from '../services/guardian-auth.service'

interface PortalLayoutProps {
  children: ReactNode
  title?: string
}

type Guardian = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  relationship: string
  organizationId: string
  lastLogin: string | null
  children: Array<{
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    photoUrl: string | null
    status: string
    classroom: { id: string; name: string } | null
    isPrimary: boolean
    canPickup: boolean
  }>
}

export function PortalLayout({ children, title }: PortalLayoutProps) {
  const router = useRouter()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [guardian, setGuardian] = useState<Guardian | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadGuardian() {
      try {
        const data = await guardianAuthService.getCurrentGuardian()
        if (!data) {
          router.push('/family-portal/login')
          return
        }
        setGuardian(data)
      } catch (error) {
        console.error('Error loading guardian:', error)
        router.push('/family-portal/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadGuardian()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e6e7ee] flex items-center justify-center">
        <div className="text-center">
          {/* Neumorphic Loading Spinner Container */}
          <div className="w-20 h-20 bg-[#e6e7ee] rounded-full shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e6e7ee]">
      {/* Mobile Navigation */}
      <PortalMobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        guardian={guardian}
      />

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <PortalSidebar guardian={guardian} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <PortalHeader
            onMenuClick={() => setIsMobileNavOpen(true)}
            title={title}
          />

          {/* Page Content - Scrollable area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default PortalLayout
