'use client'

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/features/theme/context/ThemeContext'
import { I18nProvider } from '@/shared/lib/i18n'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
}
