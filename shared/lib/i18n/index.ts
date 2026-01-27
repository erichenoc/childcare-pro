// Internationalization System - ChildCare Pro
// English by default, with Spanish support

export type Locale = 'en' | 'es'

export const DEFAULT_LOCALE: Locale = 'en'
export const SUPPORTED_LOCALES: Locale[] = ['en', 'es']

export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

// Re-export everything from context
export { I18nProvider, useI18n, useTranslations, useLocale } from './context'

// Re-export translation types
export type { Translations } from './types'

// Re-export translations
export { es } from './es'
export { en } from './en'
