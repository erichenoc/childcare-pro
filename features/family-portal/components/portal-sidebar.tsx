'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  Camera,
  CreditCard,
  CalendarCheck,
  MessageCircle,
  User,
  LogOut,
  Baby,
} from 'lucide-react'
import { guardianAuthService } from '../services/guardian-auth.service'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Inicio', href: '/family-portal', icon: Home },
  { name: 'Mis Hijos', href: '/family-portal/children', icon: Baby },
  { name: 'Fotos', href: '/family-portal/photos', icon: Camera },
  { name: 'Facturas', href: '/family-portal/billing', icon: CreditCard },
  { name: 'Asistencia', href: '/family-portal/attendance', icon: CalendarCheck },
  { name: 'Chat con Maya', href: '/family-portal/chat', icon: MessageCircle },
  { name: 'Mi Perfil', href: '/family-portal/profile', icon: User },
]

interface PortalSidebarProps {
  guardian?: {
    firstName: string
    lastName: string
    email: string
  } | null
}

export function PortalSidebar({ guardian }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await guardianAuthService.signOut()
    router.push('/family-portal/login')
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/family-portal" className="flex items-center gap-3">
          <Image
            src="https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png"
            alt="ChildCare Pro"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">Portal de Padres</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">ChildCare Pro</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      {guardian && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {guardian.firstName[0]}{guardian.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {guardian.firstName} {guardian.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {guardian.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/family-portal' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
