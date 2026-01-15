'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  FileText,
  AlertTriangle,
  Settings,
  X,
  Baby,
  GraduationCap,
} from 'lucide-react'
import { useTranslations } from '@/shared/lib/i18n'

const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png'

interface NavItem {
  key: string
  href: string
  icon: React.ElementType
}

const mainNavItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'children', href: '/dashboard/children', icon: Baby },
  { key: 'families', href: '/dashboard/families', icon: Users },
  { key: 'staff', href: '/dashboard/staff', icon: UserCircle },
  { key: 'classrooms', href: '/dashboard/classrooms', icon: GraduationCap },
  { key: 'attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { key: 'billing', href: '/dashboard/billing', icon: CreditCard },
  { key: 'communication', href: '/dashboard/communication', icon: MessageSquare },
  { key: 'reports', href: '/dashboard/reports', icon: FileText },
  { key: 'incidents', href: '/dashboard/incidents', icon: AlertTriangle },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
]

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const t = useTranslations()

  // Close on route change (only after initial mount)
  const isFirstMount = React.useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (isOpen) {
      onClose()
    }
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'absolute left-0 top-0 h-full w-72',
          'sidebar-glass animate-slide-in-left'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-200/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src={LOGO_URL}
              alt="ChildCare Pro"
              width={40}
              height={40}
              className="rounded-xl shadow-md"
            />
            <div>
              <h1 className="font-bold text-gray-800">
                {t.app.name}
              </h1>
              <p className="text-xs text-gray-500">
                {t.app.tagline}
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-blue-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const label = t.nav[item.key as keyof typeof t.nav]

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'transition-all duration-200',
                  active
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-blue-50'
                )}
              >
                <Icon
                  className={clsx(
                    'w-5 h-5 flex-shrink-0',
                    active ? 'text-blue-500' : 'text-gray-400'
                  )}
                />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </div>
  )
}

export default MobileNav
