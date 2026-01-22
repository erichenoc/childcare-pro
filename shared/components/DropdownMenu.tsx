'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'

interface DropdownMenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  show?: boolean
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  trigger?: React.ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ items, trigger, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleItemClick = (item: DropdownMenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    item.onClick()
    setIsOpen(false)
  }

  // Filter visible items
  const visibleItems = items.filter((item) => item.show !== false)

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        className="p-1.5 w-7 h-7 flex items-center justify-center rounded-lg hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
        title="Options"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        {trigger || <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-[99] md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed md:absolute left-2 right-2 md:left-auto md:right-0 bottom-4 md:bottom-auto md:top-full md:mt-1 ${
              align === 'right' ? 'md:right-0' : 'md:left-0'
            } min-w-[160px] max-w-[calc(100vw-1rem)] bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-xl z-[100] py-1 animate-fade-in`}
            role="menu"
          >
          {visibleItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => handleItemClick(item, e)}
              className={`w-full px-3 py-2 flex items-center gap-3 transition-all duration-200 text-left ${
                item.variant === 'danger'
                  ? 'hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset hover:bg-red-500/5 text-red-500'
                  : 'hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-gray-700 dark:text-gray-300'
              }`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
