import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CheckCircle2,
  MapPin,
  Users,
  Shield,
  Baby,
  ArrowRight,
  Star,
  Phone,
  Building2,
} from 'lucide-react'

// City data for Florida Central
const CITIES: Record<string, {
  name: string
  county: string
  population: number
  daycares: number
  description: string
  neighborhoods: string[]
}> = {
  orlando: {
    name: 'Orlando',
    county: 'Orange County',
    population: 307573,
    daycares: 450,
    description: 'As the heart of Central Florida, Orlando is home to hundreds of childcare centers serving a diverse, growing population. From downtown Orlando to the suburbs, daycare owners need reliable software to manage DCF compliance and parent communication.',
    neighborhoods: ['Downtown Orlando', 'Winter Park', 'Dr. Phillips', 'Lake Nona', 'Baldwin Park', 'College Park'],
  },
  kissimmee: {
    name: 'Kissimmee',
    county: 'Osceola County',
    population: 79226,
    daycares: 120,
    description: 'Kissimmee and the greater Osceola County area is one of the fastest-growing regions in Florida. With a large Hispanic community, bilingual childcare software is essential for parent communication.',
    neighborhoods: ['Downtown Kissimmee', 'Poinciana', 'St. Cloud', 'Celebration', 'BVL'],
  },
  sanford: {
    name: 'Sanford',
    county: 'Seminole County',
    population: 63342,
    daycares: 85,
    description: 'Historic Sanford and Seminole County offer a growing suburban market for childcare centers. Quality management software helps centers stand out and maintain DCF compliance.',
    neighborhoods: ['Historic Downtown', 'Lake Mary', 'Heathrow', 'Longwood'],
  },
  'winter-park': {
    name: 'Winter Park',
    county: 'Orange County',
    population: 31435,
    daycares: 65,
    description: 'Winter Park is known for its affluent families who expect premium childcare services. Modern software with parent apps and daily reports is essential for centers serving this market.',
    neighborhoods: ['Park Avenue', 'Maitland', 'Eatonville', 'Goldenrod'],
  },
  'altamonte-springs': {
    name: 'Altamonte Springs',
    county: 'Seminole County',
    population: 46458,
    daycares: 55,
    description: 'Altamonte Springs offers a mix of residential and commercial areas, with many working parents needing flexible childcare options and easy payment processing.',
    neighborhoods: ['Uptown Altamonte', 'Forest City', 'Casselberry'],
  },
  ocoee: {
    name: 'Ocoee',
    county: 'Orange County',
    population: 51585,
    daycares: 40,
    description: 'Ocoee is a rapidly growing suburb of Orlando with young families moving in daily. Childcare centers here need scalable software to grow with their enrollment.',
    neighborhoods: ['Downtown Ocoee', 'Clarcona', 'Windermere'],
  },
  'winter-garden': {
    name: 'Winter Garden',
    county: 'Orange County',
    population: 51962,
    daycares: 45,
    description: 'Winter Garden and the Horizon West corridor is one of the fastest-growing areas in Florida. New childcare centers are opening regularly to meet demand.',
    neighborhoods: ['Downtown Winter Garden', 'Horizon West', 'Oakland', 'Windermere'],
  },
  clermont: {
    name: 'Clermont',
    county: 'Lake County',
    population: 43921,
    daycares: 50,
    description: 'Clermont and South Lake County attract families seeking a suburban lifestyle with easy access to Orlando. Quality childcare is in high demand.',
    neighborhoods: ['Downtown Clermont', 'Four Corners', 'Minneola', 'Groveland'],
  },
  apopka: {
    name: 'Apopka',
    county: 'Orange County',
    population: 57904,
    daycares: 60,
    description: 'Apopka has transformed from agricultural roots to a thriving suburban community. Childcare centers serve both longtime residents and new arrivals.',
    neighborhoods: ['Downtown Apopka', 'Wekiva Springs', 'Rock Springs'],
  },
  'lake-mary': {
    name: 'Lake Mary',
    county: 'Seminole County',
    population: 17806,
    daycares: 35,
    description: 'Lake Mary is a premier business and residential community in Seminole County. Professional families expect top-tier childcare services with modern technology.',
    neighborhoods: ['Downtown Lake Mary', 'Heathrow', 'Colonial Town Park'],
  },
  deltona: {
    name: 'Deltona',
    county: 'Volusia County',
    population: 97264,
    daycares: 70,
    description: 'Deltona is one of the largest cities in Volusia County, with a diverse population and growing childcare needs. Affordable, efficient software helps centers thrive.',
    neighborhoods: ['Enterprise', 'Osteen', 'Orange City'],
  },
  'daytona-beach': {
    name: 'Daytona Beach',
    county: 'Volusia County',
    population: 72647,
    daycares: 95,
    description: 'Daytona Beach and the surrounding Volusia County area have unique childcare needs, including seasonal fluctuations. Flexible software helps manage varying enrollment.',
    neighborhoods: ['Downtown Daytona', 'Ormond Beach', 'Port Orange', 'Holly Hill'],
  },
}

interface PageProps {
  params: Promise<{ city: string }>
}

export async function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const cityData = CITIES[city]

  if (!cityData) {
    return {
      title: 'City Not Found',
    }
  }

  return {
    title: `Childcare Management Software in ${cityData.name}, FL | ChildCare Pro`,
    description: `The #1 daycare management software for childcare centers in ${cityData.name}, Florida. DCF compliant, automated billing, parent communication. Serving ${cityData.county}. Start free trial.`,
    keywords: [
      `childcare software ${cityData.name.toLowerCase()}`,
      `daycare management ${cityData.name.toLowerCase()}`,
      `preschool software ${cityData.name.toLowerCase()} fl`,
      `dcf compliance software ${cityData.name.toLowerCase()}`,
      `childcare center software ${cityData.county.toLowerCase()}`,
      `daycare billing software ${cityData.name.toLowerCase()}`,
      `childcare attendance tracking ${cityData.name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Childcare Software for ${cityData.name} Daycare Centers | ChildCare Pro`,
      description: `Streamline your ${cityData.name} childcare center with automated billing, DCF compliance, and parent communication. Trusted by ${cityData.daycares}+ centers in ${cityData.county}.`,
      url: `https://childcarepro.com/${city}`,
    },
    alternates: {
      canonical: `https://childcarepro.com/${city}`,
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params
  const cityData = CITIES[city]

  if (!cityData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ChildCare Pro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Serving {cityData.name}, {cityData.county}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              The #1 Childcare Software for{' '}
              <span className="text-blue-600">{cityData.name}</span> Daycare Centers
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {cityData.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/#pricing"
                className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300 transition"
              >
                View Pricing
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                DCF Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Local Support Team
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <Building2 className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">{cityData.daycares}+</p>
              <p className="text-gray-500">Daycares in {cityData.name}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">{(cityData.population / 1000).toFixed(0)}K+</p>
              <p className="text-gray-500">Population</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <Shield className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">100%</p>
              <p className="text-gray-500">DCF Compliant</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <Star className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">4.9/5</p>
              <p className="text-gray-500">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Serving Childcare Centers Throughout {cityData.name}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {cityData.neighborhoods.map((area) => (
              <div
                key={area}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features for Local */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Why {cityData.name} Daycares Choose ChildCare Pro
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Built specifically for Florida childcare providers with DCF compliance in mind.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Shield className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Florida DCF Compliance</h3>
              <p className="text-gray-600">
                Real-time staff-to-child ratio monitoring based on Florida DCF requirements. Never worry about compliance audits again.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Phone className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Local Support</h3>
              <p className="text-gray-600">
                Our support team is based in Florida and understands the unique needs of {cityData.county} childcare providers.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bilingual Support</h3>
              <p className="text-gray-600">
                Full English and Spanish support for parent communication, perfect for {cityData.name}&apos;s diverse community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Simplify Your {cityData.name} Childcare Center?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join other {cityData.county} daycare owners who have transformed their operations.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ChildCare Pro</span>
            </Link>
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} ChildCare Pro. All rights reserved.
            </p>
          </div>

          {/* Other City Links for SEO */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm mb-4">Also serving childcare centers in:</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(CITIES)
                .filter(([slug]) => slug !== city)
                .map(([slug, data]) => (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="text-gray-400 text-sm hover:text-white transition"
                  >
                    {data.name}, FL
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </footer>

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `ChildCare Pro - ${cityData.name}`,
            description: `Childcare management software for daycare centers in ${cityData.name}, ${cityData.county}, Florida`,
            url: `https://childcarepro.com/${city}`,
            telephone: '+1-407-555-0123',
            address: {
              '@type': 'PostalAddress',
              addressLocality: cityData.name,
              addressRegion: 'FL',
              addressCountry: 'US',
            },
            areaServed: {
              '@type': 'City',
              name: cityData.name,
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: cityData.county,
              },
            },
            priceRange: '$79 - $299/month',
          }),
        }}
      />
    </div>
  )
}
