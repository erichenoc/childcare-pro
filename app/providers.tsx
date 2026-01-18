'use client'

import { type ReactNode } from 'react'
import { ThemeProvider } from '@/features/theme/context/ThemeContext'
import { I18nProvider } from '@/shared/lib/i18n'
import { ServiceWorkerRegistration } from '@/features/notifications/components/ServiceWorkerRegistration'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ServiceWorkerRegistration />
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
}
