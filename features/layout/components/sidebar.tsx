'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  FileText,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
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
]

const bottomNavItems: NavItem[] = [
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={clsx(
        'sidebar-glass h-screen flex flex-col transition-all duration-300 ease-glass',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-blue-200/50">
        {!isCollapsed && (
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
        )}

        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image
              src={LOGO_URL}
              alt="ChildCare Pro"
              width={40}
              height={40}
              className="rounded-xl shadow-md"
            />
          </Link>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const label = t.nav[item.key as keyof typeof t.nav]

          return (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-all duration-200',
                active
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-blue-50',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 flex-shrink-0',
                  active ? 'text-blue-500' : 'text-gray-400'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-blue-200/50 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const label = t.nav[item.key as keyof typeof t.nav]

          return (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-all duration-200',
                active
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-blue-50',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 flex-shrink-0',
                  active ? 'text-blue-500' : 'text-gray-400'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          )
        })}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-gray-500 hover:bg-blue-50 transition-all duration-200',
            isCollapsed && 'justify-center px-2'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">{t.common.collapse}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
