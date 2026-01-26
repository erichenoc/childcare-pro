'use client'

import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/features/theme'

interface PortalHeaderProps {
  onMenuClick: () => void
  title?: string
}

export function PortalHeader({ onMenuClick, title }: PortalHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden lg:block">
          {title || 'Portal de Padres'}
        </h1>

        {/* Mobile title */}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white lg:hidden">
          {title || 'Portal'}
        </h1>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
