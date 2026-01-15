// Sistema de Internacionalización - ChildCare Pro
// Español por defecto, con soporte para inglés

export type Locale = 'es' | 'en'

export const DEFAULT_LOCALE: Locale = 'es'
export const SUPPORTED_LOCALES: Locale[] = ['es', 'en']

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
