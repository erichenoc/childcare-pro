'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Globe,
} from 'lucide-react'
import { useI18n, useTranslations, LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from '@/shared/lib/i18n'
import { GlassAvatar } from '@/shared/components/ui'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const { locale, setLocale } = useI18n()
  const t = useTranslations()

  // Mock user data - will come from auth context later
  const user = {
    name: 'María García',
    email: 'maria@example.com',
    role: 'Administrador',
    avatar: null,
  }

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Nueva inscripción', message: 'Juan Pérez ha sido inscrito', time: '5 min' },
    { id: 2, title: 'Ratio bajo', message: 'Salón A necesita más personal', time: '15 min' },
    { id: 3, title: 'Pago recibido', message: 'Familia Rodríguez pagó $500', time: '1 hora' },
  ]

  return (
    <header
      className={clsx(
        'glass-frosted h-16 px-4 flex items-center justify-between',
        'border-b border-blue-200/50',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-blue-50 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.common.search}
              className="input-glass pl-10 pr-4 py-2 w-64 lg:w-80 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="p-2 rounded-xl text-gray-500 hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">{LOCALE_NAMES[locale]}</span>
          </button>

          {isLanguageOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLanguageOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-40 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-blue-100 z-50 overflow-hidden">
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc as Locale)
                      setIsLanguageOpen(false)
                    }}
                    className={clsx(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors',
                      'hover:bg-blue-50',
                      locale === loc
                        ? 'text-blue-600 font-medium bg-blue-50'
                        : 'text-gray-700'
                    )}
                  >
                    {LOCALE_NAMES[loc as Locale]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-blue-50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 w-auto sm:w-80 bg-white rounded-xl shadow-lg border border-blue-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-100">
                  <h3 className="font-semibold text-gray-800">
                    {t.communication.notifications}
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-blue-50 last:border-0"
                    >
                      <p className="font-medium text-sm text-gray-800">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-blue-100">
                  <Link
                    href="/dashboard/notifications"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <GlassAvatar
              name={user.name}
              src={user.avatar}
              size="sm"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-blue-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-100">
                  <p className="font-medium text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    {t.nav.profile}
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {t.nav.settings}
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    {t.nav.help}
                  </Link>
                </div>

                <div className="border-t border-blue-100 py-1">
                  <button
                    onClick={() => {
                      // Handle logout
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.nav.logout}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
