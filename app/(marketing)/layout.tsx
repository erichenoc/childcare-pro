import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'ChildCare Pro | #1 Daycare Management Software in Florida',
    template: '%s | ChildCare Pro',
  },
  description: 'The most comprehensive childcare management software for daycare centers in Orlando, Kissimmee, and Central Florida. DCF compliant, ratio tracking, billing automation, and parent communication.',
  keywords: [
    'childcare software orlando',
    'daycare management software florida',
    'childcare management system',
    'dcf compliance software',
    'daycare billing software',
    'childcare attendance tracking',
    'parent communication app',
    'staff ratio calculator',
    'preschool management software',
    'childcare center software kissimmee',
    'daycare software sanford',
    'central florida childcare software',
  ],
  authors: [{ name: 'ChildCare Pro' }],
  creator: 'ChildCare Pro',
  publisher: 'ChildCare Pro',
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
    url: 'https://childcareproai.com',
    siteName: 'ChildCare Pro',
    title: 'ChildCare Pro | #1 Daycare Management Software in Florida',
    description: 'Streamline your childcare center with automated billing, attendance tracking, parent communication, and DCF compliance monitoring.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChildCare Pro - Daycare Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChildCare Pro | #1 Daycare Management Software',
    description: 'Streamline your childcare center with automated billing, attendance tracking, and DCF compliance.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://childcareproai.com',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ChildCare Pro',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Comprehensive childcare management software for daycare centers. Features include attendance tracking, billing automation, parent communication, and DCF compliance monitoring.',
            offers: [
              {
                '@type': 'Offer',
                name: 'Starter Plan',
                price: '79.00',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '79.00',
                  priceCurrency: 'USD',
                  unitText: 'MONTH',
                },
              },
              {
                '@type': 'Offer',
                name: 'Professional Plan',
                price: '149.00',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '149.00',
                  priceCurrency: 'USD',
                  unitText: 'MONTH',
                },
              },
              {
                '@type': 'Offer',
                name: 'Enterprise Plan',
                price: '299.00',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '299.00',
                  priceCurrency: 'USD',
                  unitText: 'MONTH',
                },
              },
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '127',
              bestRating: '5',
              worstRating: '1',
            },
            featureList: [
              'Attendance Tracking',
              'Automated Billing',
              'Parent Communication',
              'DCF Compliance Monitoring',
              'Staff Scheduling',
              'Ratio Tracking',
              'Daily Reports',
              'Multi-location Support',
            ],
          }),
        }}
      />
      {/* LocalBusiness Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'ChildCare Pro',
            description: 'Childcare management software provider serving daycare centers in Central Florida',
            url: 'https://childcareproai.com',
            telephone: '+1-321-246-8614',
            email: 'info@childcareai.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '123 Innovation Drive',
              addressLocality: 'Orlando',
              addressRegion: 'FL',
              postalCode: '32801',
              addressCountry: 'US',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 28.5383,
              longitude: -81.3792,
            },
            areaServed: [
              { '@type': 'City', name: 'Orlando', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Kissimmee', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Sanford', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Winter Park', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Altamonte Springs', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Ocoee', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Winter Garden', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Clermont', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Apopka', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Lake Mary', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Deltona', containedInPlace: { '@type': 'State', name: 'Florida' } },
              { '@type': 'City', name: 'Daytona Beach', containedInPlace: { '@type': 'State', name: 'Florida' } },
            ],
            priceRange: '$79 - $299/month',
            openingHours: 'Mo-Fr 08:00-18:00',
          }),
        }}
      />
      {children}
    </>
  )
}
