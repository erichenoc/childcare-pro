import { I18nProvider } from '@/shared/lib/i18n'
import { ThemeProvider } from '@/features/theme'

export const metadata = {
  title: 'Portal de Padres | ChildCare Pro',
  description: 'Accede a la informacion de tus hijos, fotos, facturas y mas',
}

export default function FamilyPortalRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
}
