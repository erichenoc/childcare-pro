'use client'

import { I18nProvider, useTranslations } from '@/shared/lib/i18n'

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gradient-childcare flex flex-col">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-primary-400/15 rounded-full blur-3xl" />
      </div>


      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} {t.app.name}. {t.common.allRightsReserved}
        </p>
      </footer>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </I18nProvider>
  )
}
