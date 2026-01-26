'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { X, Home, Camera, CreditCard, CalendarCheck, MessageCircle, User, LogOut, Baby } from 'lucide-react'
import { guardianAuthService } from '../services/guardian-auth.service'

const navigation = [
  { name: 'Inicio', href: '/family-portal', icon: Home },
  { name: 'Mis Hijos', href: '/family-portal/children', icon: Baby },
  { name: 'Fotos', href: '/family-portal/photos', icon: Camera },
  { name: 'Facturas', href: '/family-portal/billing', icon: CreditCard },
  { name: 'Asistencia', href: '/family-portal/attendance', icon: CalendarCheck },
  { name: 'Chat con Maya', href: '/family-portal/chat', icon: MessageCircle },
  { name: 'Mi Perfil', href: '/family-portal/profile', icon: User },
]

interface PortalMobileNavProps {
  isOpen: boolean
  onClose: () => void
  guardian?: {
    firstName: string
    lastName: string
    email: string
  } | null
}

export function PortalMobileNav({ isOpen, onClose, guardian }: PortalMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await guardianAuthService.signOut()
    onClose()
    router.push('/family-portal/login')
  }

  if (!isOpen) return null

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar - Neumorphic */}
      <div className="fixed inset-y-0 left-0 w-72 sm:w-80 bg-[#e6e7ee] z-50 lg:hidden flex flex-col animate-slide-in-left shadow-[8px_0_16px_#b8b9be]">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link href="/family-portal" className="flex items-center gap-3" onClick={onClose}>
            <Image
              src="https://res.cloudinary.com/dbftvu8ab/image/upload/q_auto:best,f_auto/v1768428103/ChildCarePro_Logo_1_f0gqth.png"
              alt="ChildCare Pro"
              width={96}
              height={96}
              className="w-10 h-10"
              priority
            />
            <span className="font-bold text-gray-700">Portal de Padres</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-gray-600 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info - Neumorphic */}
        {guardian && (
          <div className="px-4 pb-4">
            <div className="bg-[#e6e7ee] rounded-xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-[2px_2px_4px_#b8b9be]">
                  {guardian.firstName[0]}{guardian.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {guardian.firstName} {guardian.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {guardian.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Neumorphic */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/family-portal' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-[#e6e7ee] shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-blue-600'
                    : 'bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-gray-600 hover:shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff]'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out - Neumorphic */}
        <div className="p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] text-red-500 hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesion
          </button>
        </div>
      </div>
    </Fragment>
  )
}
