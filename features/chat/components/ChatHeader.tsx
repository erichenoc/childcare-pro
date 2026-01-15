'use client'

import { SidebarToggle } from '@/features/sidebar/components/SidebarToggle'

interface ChatHeaderProps {
  userEmail?: string
}

export function ChatHeader({ userEmail }: ChatHeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 neu-sm bg-neu-bg dark:bg-neu-bg-dark">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <SidebarToggle />
        </div>
      </div>
    </header>
  )
}
