'use client'

import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useI18n, LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from '@/shared/lib/i18n'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'pill'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { locale, setLocale } = useI18n()

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Change language"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase">{locale}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc as Locale)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    locale === loc
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {LOCALE_NAMES[loc as Locale]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex rounded-full bg-gray-100 p-1 ${className}`}>
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc as Locale)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              locale === loc
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {LOCALE_NAMES[loc as Locale]}
          </button>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-gray-300 transition-all text-sm font-medium text-gray-700"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span>{LOCALE_NAMES[locale]}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc as Locale)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  locale === loc
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {LOCALE_NAMES[loc as Locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Neumorphic variant for family portal
export function NeumorphicLanguageSwitcher({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { locale, setLocale } = useI18n()

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#e6e7ee] rounded-xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] transition-all text-sm font-medium text-gray-600"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-36 bg-[#e6e7ee] rounded-xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] z-50 overflow-hidden">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc as Locale)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                  locale === loc
                    ? 'bg-[#e6e7ee] shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-blue-600 font-medium'
                    : 'text-gray-600 hover:shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff]'
                }`}
              >
                {LOCALE_NAMES[loc as Locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
