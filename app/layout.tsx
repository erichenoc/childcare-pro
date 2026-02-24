import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChildCare Pro - Complete Daycare Management',
  description: 'SaaS platform for comprehensive daycare and childcare center management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChildCare Pro',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
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
  keywords: [
    'daycare management software',
    'childcare center management',
    'DCF compliance Florida',
    'daycare billing',
    'parent portal',
    'attendance tracking',
    'childcare SaaS',
  ],
  alternates: {
    canonical: 'https://childcarepro.app',
    languages: {
      'en-US': 'https://childcarepro.app',
      'es-US': 'https://childcarepro.app/es',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_US',
    url: 'https://childcarepro.app',
    siteName: 'ChildCare Pro',
    title: 'ChildCare Pro - Complete Daycare Management Platform',
    description:
      'All-in-one SaaS platform for daycare and childcare center management. DCF compliance, billing with Stripe, parent portal, attendance tracking, and AI assistant. Trusted by Florida childcare centers.',
    images: [
      {
        url: 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
        width: 1200,
        height: 630,
        alt: 'ChildCare Pro - Daycare Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChildCare Pro - Complete Daycare Management',
    description:
      'All-in-one platform for daycare management. DCF compliance, Stripe billing, parent portal, AI assistant.',
    images: [
      'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768448813/Emoticon_-_CildCare_qz0fjc.png',
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ChildCare Pro',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'All-in-one SaaS platform for daycare and childcare center management with DCF compliance, billing, parent portal, and AI assistant.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '1.50',
    highPrice: '3.50',
    offerCount: 3,
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '1.50',
        priceCurrency: 'USD',
        description: 'Per child per month - Basic operations, attendance, DCF ratios',
      },
      {
        '@type': 'Offer',
        name: 'Professional',
        price: '2.50',
        priceCurrency: 'USD',
        description: 'Per child per month - Full platform with Stripe payments, parent portal, AI',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '3.50',
        priceCurrency: 'USD',
        description: 'Per child per month - Multi-location, advanced accounting, full compliance',
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '120',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'DCF Compliance Monitoring',
    'Stripe Payment Processing',
    'Parent Portal',
    'AI Assistant',
    'Attendance Tracking with Kiosk Mode',
    'Staff Management',
    'Food Program (CACFP)',
    'Immunization Tracking',
    'WhatsApp Integration',
    'Bilingual (English/Spanish)',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
