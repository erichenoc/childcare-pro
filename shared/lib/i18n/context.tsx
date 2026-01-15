'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Translations } from './types'
import { es } from './es'
import { en } from './en'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './index'

// Translations map
const translations: Record<Locale, Translations> = {
  es,
  en,
}

// Context type
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatNumber: (num: number) => string
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Storage key for persisting locale
const LOCALE_STORAGE_KEY = 'childcare-pro-locale'

// Get initial locale from localStorage or default
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale
  }

  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale
  }

  return DEFAULT_LOCALE
}

// Provider props
interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

// Provider component
export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  // Set locale and persist
  const setLocale = useCallback((newLocale: Locale) => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
        // Update HTML lang attribute
        document.documentElement.lang = newLocale
      }
    }
  }, [])

  // Format date according to locale
  const formatDate = useCallback((
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  ) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, options).format(d)
  }, [locale])

  // Format time according to locale
  const formatTime = useCallback((
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    }
  ) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, options).format(d)
  }, [locale])

  // Format currency according to locale
  const formatCurrency = useCallback((
    amount: number,
    currency: string = 'USD'
  ) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  }, [locale])

  // Format number according to locale
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat(locale).format(num)
  }, [locale])

  // Get current translations
  const t = useMemo(() => translations[locale], [locale])

  // Memoize context value
  const value = useMemo<I18nContextType>(() => ({
    locale,
    setLocale,
    t,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
  }), [locale, setLocale, t, formatDate, formatTime, formatCurrency, formatNumber])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use i18n
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook to get just translations (for convenience)
export function useTranslations(): Translations {
  const { t } = useI18n()
  return t
}

// Hook to get locale
export function useLocale(): Locale {
  const { locale } = useI18n()
  return locale
}
