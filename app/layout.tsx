import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChildCare Pro - Gestión Integral de Guarderías',
  description: 'Plataforma SaaS para la gestión integral de guarderías y centros de cuidado infantil',
  icons: {
    icon: 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
    shortcut: 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
    apple: 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={GeistSans.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
