'use client'

import { Menu, Bell } from 'lucide-react'

interface PortalHeaderProps {
  onMenuClick: () => void
  title?: string
}

export function PortalHeader({ onMenuClick, title }: PortalHeaderProps) {
  return (
    <header className="bg-[#e6e7ee] px-3 sm:px-4 lg:px-6 py-3 shadow-[0_4px_8px_#b8b9be]">
      <div className="flex items-center justify-between">
        {/* Mobile menu button - Neumorphic */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-gray-600 transition-all duration-200"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl font-semibold text-gray-700 hidden lg:block">
          {title || 'Portal de Padres'}
        </h1>

        {/* Mobile title */}
        <h1 className="text-base sm:text-lg font-semibold text-gray-700 lg:hidden">
          {title || 'Portal'}
        </h1>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications - Neumorphic */}
          <button className="relative p-2.5 rounded-xl bg-[#e6e7ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-gray-600 transition-all duration-200">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[1px_1px_2px_#b8b9be]" />
          </button>
        </div>
      </div>
    </header>
  )
}
