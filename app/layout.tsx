import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChildCare Pro - Gestión Integral de Guarderías',
  description: 'Plataforma SaaS para la gestión integral de guarderías y centros de cuidado infantil',
  icons: {
    icon: [
      { url: 'https://res.cloudinary.com/dbftvu8ab/image/upload/w_32,h_32,c_fill/v1768448813/Emoticon_-_CildCare_qz0fjc.png', sizes: '32x32', type: 'image/png' },
      { url: 'https://res.cloudinary.com/dbftvu8ab/image/upload/w_64,h_64,c_fill/v1768448813/Emoticon_-_CildCare_qz0fjc.png', sizes: '64x64', type: 'image/png' },
      { url: 'https://res.cloudinary.com/dbftvu8ab/image/upload/w_96,h_96,c_fill/v1768448813/Emoticon_-_CildCare_qz0fjc.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: 'https://res.cloudinary.com/dbftvu8ab/image/upload/w_64,h_64,c_fill/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
    apple: [
      { url: 'https://res.cloudinary.com/dbftvu8ab/image/upload/w_180,h_180,c_fill/v1768448813/Emoticon_-_CildCare_qz0fjc.png', sizes: '180x180', type: 'image/png' },
    ],
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
