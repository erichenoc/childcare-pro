import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  CheckCircle2,
  MapPin,
  Users,
  Shield,
  ArrowRight,
  Star,
  Phone,
  Building2,
  Clock,
  DollarSign,
  MessageCircle,
  BarChart3,
  Heart,
  Zap,
  Play,
} from 'lucide-react'

const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png'

// City data for Florida Central
const CITIES: Record<string, {
  name: string
  county: string
  population: number
  daycares: number
  description: string
  neighborhoods: string[]
  highlight: string
}> = {
  orlando: {
    name: 'Orlando',
    county: 'Orange County',
    population: 307573,
    daycares: 450,
    description: 'As the heart of Central Florida, Orlando is home to hundreds of childcare centers serving a diverse, growing population.',
    neighborhoods: ['Downtown Orlando', 'Winter Park', 'Dr. Phillips', 'Lake Nona', 'Baldwin Park', 'College Park'],
    highlight: 'Theme Park Capital',
  },
  kissimmee: {
    name: 'Kissimmee',
    county: 'Osceola County',
    population: 79226,
    daycares: 120,
    description: 'One of the fastest-growing regions in Florida with a large Hispanic community.',
    neighborhoods: ['Downtown Kissimmee', 'Poinciana', 'St. Cloud', 'Celebration', 'BVL'],
    highlight: 'Fastest Growing',
  },
  sanford: {
    name: 'Sanford',
    county: 'Seminole County',
    population: 63342,
    daycares: 85,
    description: 'Historic city offering a growing suburban market for quality childcare centers.',
    neighborhoods: ['Historic Downtown', 'Lake Mary', 'Heathrow', 'Longwood'],
    highlight: 'Historic Charm',
  },
  'winter-park': {
    name: 'Winter Park',
    county: 'Orange County',
    population: 31435,
    daycares: 65,
    description: 'Affluent community with families expecting premium childcare services.',
    neighborhoods: ['Park Avenue', 'Maitland', 'Eatonville', 'Goldenrod'],
    highlight: 'Premium Market',
  },
  'altamonte-springs': {
    name: 'Altamonte Springs',
    county: 'Seminole County',
    population: 46458,
    daycares: 55,
    description: 'Mix of residential and commercial areas with busy working parents.',
    neighborhoods: ['Uptown Altamonte', 'Forest City', 'Casselberry'],
    highlight: 'Business Hub',
  },
  ocoee: {
    name: 'Ocoee',
    county: 'Orange County',
    population: 51585,
    daycares: 40,
    description: 'Rapidly growing suburb with young families moving in daily.',
    neighborhoods: ['Downtown Ocoee', 'Clarcona', 'Windermere'],
    highlight: 'Young Families',
  },
  'winter-garden': {
    name: 'Winter Garden',
    county: 'Orange County',
    population: 51962,
    daycares: 45,
    description: 'Gateway to Horizon West corridor, one of Florida\'s fastest-growing areas.',
    neighborhoods: ['Downtown Winter Garden', 'Horizon West', 'Oakland', 'Windermere'],
    highlight: 'Horizon West',
  },
  clermont: {
    name: 'Clermont',
    county: 'Lake County',
    population: 43921,
    daycares: 50,
    description: 'Suburban lifestyle with easy access to Orlando. High childcare demand.',
    neighborhoods: ['Downtown Clermont', 'Four Corners', 'Minneola', 'Groveland'],
    highlight: 'Lake County Hub',
  },
  apopka: {
    name: 'Apopka',
    county: 'Orange County',
    population: 57904,
    daycares: 60,
    description: 'Thriving suburban community serving both longtime residents and newcomers.',
    neighborhoods: ['Downtown Apopka', 'Wekiva Springs', 'Rock Springs'],
    highlight: 'Growing Fast',
  },
  'lake-mary': {
    name: 'Lake Mary',
    county: 'Seminole County',
    population: 17806,
    daycares: 35,
    description: 'Premier business and residential community expecting top-tier services.',
    neighborhoods: ['Downtown Lake Mary', 'Heathrow', 'Colonial Town Park'],
    highlight: 'Tech Corridor',
  },
  deltona: {
    name: 'Deltona',
    county: 'Volusia County',
    population: 97264,
    daycares: 70,
    description: 'One of the largest cities in Volusia County with diverse childcare needs.',
    neighborhoods: ['Enterprise', 'Osteen', 'Orange City'],
    highlight: 'Volusia\'s Largest',
  },
  'daytona-beach': {
    name: 'Daytona Beach',
    county: 'Volusia County',
    population: 72647,
    daycares: 95,
    description: 'Unique market with seasonal fluctuations requiring flexible solutions.',
    neighborhoods: ['Downtown Daytona', 'Ormond Beach', 'Port Orange', 'Holly Hill'],
    highlight: 'Beach Side',
  },
}

const FEATURES = [
  { icon: Shield, title: 'DCF Compliance', desc: 'Real-time ratio monitoring' },
  { icon: DollarSign, title: 'Auto Billing', desc: 'Stripe integration' },
  { icon: MessageCircle, title: 'Parent App', desc: 'Daily updates & photos' },
  { icon: Clock, title: 'Attendance', desc: 'Digital check-in/out' },
  { icon: BarChart3, title: 'Reports', desc: 'Compliance & analytics' },
  { icon: Zap, title: 'Fast Setup', desc: '5 minutes to start' },
]

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
    return { title: 'City Not Found' }
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
    ],
    openGraph: {
      title: `Childcare Software for ${cityData.name} Daycare Centers | ChildCare Pro`,
      description: `Streamline your ${cityData.name} childcare center with automated billing, DCF compliance, and parent communication.`,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <Image
                  src={LOGO_URL}
                  alt="ChildCare Pro"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">ChildCare Pro</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Bento Grid */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Main Hero Card - 8 columns, 2 rows */}
            <div className="lg:col-span-8 lg:row-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden bento-card animate-fade-in-up">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <MapPin className="w-4 h-4" />
                  {cityData.highlight} • {cityData.county}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  #1 Childcare Software in{' '}
                  <span className="text-blue-200">{cityData.name}</span>
                </h1>

                <p className="text-xl text-blue-100 mb-8 max-w-xl">
                  {cityData.description} Trusted by {cityData.daycares}+ local centers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="flex items-center justify-center gap-2 text-white/90 hover:text-white transition px-6 py-4 rounded-xl border border-white/30 hover:border-white/50">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>

            {/* Stat Card 1 - Daycares */}
            <div className="lg:col-span-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 border border-emerald-200/50 bento-card animate-fade-in-up delay-100">
              <Building2 className="w-12 h-12 text-emerald-600 mb-4" />
              <p className="text-4xl font-bold text-gray-900 mb-1">{cityData.daycares}+</p>
              <p className="text-emerald-700 font-medium">Daycares in {cityData.name}</p>
              <p className="text-sm text-emerald-600/70 mt-2">All can benefit from automation</p>
            </div>

            {/* Stat Card 2 - Population */}
            <div className="lg:col-span-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 border border-purple-200/50 bento-card animate-fade-in-up delay-200">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <p className="text-4xl font-bold text-gray-900 mb-1">{(cityData.population / 1000).toFixed(0)}K+</p>
              <p className="text-purple-700 font-medium">Local Population</p>
              <p className="text-sm text-purple-600/70 mt-2">Growing families need childcare</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 lg:gap-12">
            {[
              { icon: Shield, text: 'DCF Compliant', color: 'text-green-600' },
              { icon: CheckCircle2, text: 'No Credit Card Required', color: 'text-blue-600' },
              { icon: Phone, text: 'Florida-Based Support', color: 'text-indigo-600' },
              { icon: Star, text: '4.9/5 Customer Rating', color: 'text-amber-600' },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-gray-600 animate-fade-in delay-${i + 1}00`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Why {cityData.name} Daycares Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up delay-100">
              Built specifically for Florida childcare providers with DCF compliance at the core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Featured Card - DCF Compliance */}
            <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden bento-card animate-scale-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Florida DCF Compliance</h3>
                  <p className="text-blue-100 text-lg mb-4">
                    Real-time staff-to-child ratio monitoring based on Florida DCF requirements.
                    Never worry about compliance audits in {cityData.name} again.
                  </p>
                  <ul className="space-y-2">
                    {['Auto ratio calculations', 'Age group tracking', 'Instant alerts', 'Audit reports'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-blue-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden lg:block w-48 h-48 bg-white/10 rounded-2xl animate-float" />
              </div>
            </div>

            {/* Feature Cards */}
            {FEATURES.slice(1).map((feature, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm bento-card animate-fade-in-up delay-${(i + 1) * 100}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  i === 0 ? 'bg-emerald-100' :
                  i === 1 ? 'bg-purple-100' :
                  i === 2 ? 'bg-amber-100' :
                  i === 3 ? 'bg-rose-100' : 'bg-blue-100'
                }`}>
                  <feature.icon className={`w-7 h-7 ${
                    i === 0 ? 'text-emerald-600' :
                    i === 1 ? 'text-purple-600' :
                    i === 2 ? 'text-amber-600' :
                    i === 3 ? 'text-rose-600' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Served - Bento Style */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Map Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden bento-card animate-slide-left">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-100" />
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-200" />
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-300" />
              </div>
              <div className="relative z-10">
                <MapPin className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold mb-3">Serving All of {cityData.name}</h3>
                <p className="text-slate-300 mb-6">
                  Our software supports childcare centers throughout {cityData.county} and surrounding areas.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-slate-300">Active Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-slate-300">Coverage Area</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Neighborhoods Grid */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-gray-100 bento-card animate-slide-right">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Neighborhoods We Serve in {cityData.name}
              </h3>
              <div className="flex flex-wrap gap-3">
                {cityData.neighborhoods.map((area, i) => (
                  <div
                    key={area}
                    className={`bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-5 py-3 rounded-xl font-medium border border-blue-100 hover:shadow-md transition-all animate-scale-in delay-${i * 100}`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {area}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 mt-6 text-sm">
                Plus all surrounding areas in {cityData.county}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Testimonial Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm bento-card animate-fade-in-up">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-xl text-gray-700 mb-4">
                    &ldquo;ChildCare Pro transformed how we run our {cityData.name} center. The DCF compliance
                    tracking alone saves us hours every week. Parents love the daily updates!&rdquo;
                  </blockquote>
                  <div>
                    <p className="font-bold text-gray-900">Maria Rodriguez</p>
                    <p className="text-gray-500">Director, Little Stars Daycare • {cityData.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="lg:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100 bento-card animate-fade-in-up delay-100">
              <Star className="w-12 h-12 text-amber-500 mb-4" />
              <p className="text-5xl font-bold text-gray-900 mb-2">4.9/5</p>
              <p className="text-amber-700 font-medium mb-4">Customer Rating</p>
              <p className="text-gray-600 text-sm">Based on 127 reviews from Florida childcare centers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden bento-card animate-pulse-glow">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your {cityData.name} Center?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join {cityData.daycares}+ daycare owners in {cityData.county} who simplified their operations with ChildCare Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  Start Your 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-blue-200 mt-6 text-sm">No credit card required • Setup in 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 bg-white rounded-xl p-1">
                  <Image
                    src={LOGO_URL}
                    alt="ChildCare Pro"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-white">ChildCare Pro</span>
              </Link>
              <p className="text-gray-400 mb-4">
                The #1 childcare management software for Florida daycare centers.
              </p>
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ChildCare Pro. All rights reserved.
              </p>
            </div>

            {/* Other Cities */}
            <div className="lg:col-span-8">
              <p className="text-gray-400 font-medium mb-4">Also serving childcare centers in:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(CITIES)
                  .filter(([slug]) => slug !== city)
                  .map(([slug, data]) => (
                    <Link
                      key={slug}
                      href={`/${slug}`}
                      className="text-gray-500 text-sm hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
                    >
                      {data.name}, FL
                    </Link>
                  ))}
              </div>
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
