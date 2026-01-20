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
  ChevronRight,
  Sparkles,
  ChevronDown,
  Gift,
  Timer,
  AlertTriangle,
  TrendingUp,
  Lock,
  CreditCard,
  Mail,
  BadgeCheck,
  Award,
  Headphones,
  Camera,
  Bell,
  Calendar,
  UserCheck,
  CircleDollarSign,
  ClipboardCheck,
  AlertCircle,
  Baby,
  FileText,
  Smartphone,
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
  { icon: Shield, title: 'DCF Compliance', desc: 'Real-time ratio monitoring meets Florida requirements', tag: 'COMPLIANCE' },
  { icon: CreditCard, title: 'Auto Billing', desc: 'Stripe integration with automatic invoicing', tag: 'REVENUE' },
  { icon: Camera, title: 'Parent App', desc: 'Daily updates, photos, and instant messaging', tag: 'ENGAGEMENT' },
  { icon: UserCheck, title: 'Attendance', desc: 'Digital check-in/out with kiosk mode', tag: 'TIME-SAVER' },
  { icon: BarChart3, title: 'Reports', desc: 'Compliance analytics and custom reports', tag: 'INSIGHTS' },
  { icon: Zap, title: 'Fast Setup', desc: '5 minutes to start, no training required', tag: 'EASY' },
]

const FAQ = [
  {
    q: 'Is ChildCare Pro DCF compliant?',
    a: 'Yes! Our software is designed specifically for Florida childcare centers and includes real-time DCF ratio monitoring for all age groups.',
    icon: Shield,
  },
  {
    q: 'How long is the free trial?',
    a: 'You get a full 14 days to try ALL features with no credit card required. No strings attached.',
    icon: Gift,
  },
  {
    q: 'Can I import my existing data?',
    a: 'Absolutely! Our dedicated onboarding team will personally migrate all your children, families, and staff data for FREE.',
    icon: FileText,
  },
  {
    q: 'Is there a contract?',
    a: 'No long-term contracts ever. Pay monthly and cancel anytime with just one click.',
    icon: Lock,
  },
  {
    q: 'Do parents need to download an app?',
    a: 'No app download required! Parents access everything through a mobile-friendly web portal.',
    icon: Smartphone,
  },
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
      url: `https://childcareproai.com/${city}`,
    },
    alternates: {
      canonical: `https://childcareproai.com/${city}`,
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params
  const cityData = CITIES[city]

  if (!cityData) {
    notFound()
  }

  const spotsLeft = Math.floor(Math.random() * 5) + 3 // 3-7 spots

  return (
    <div className="min-h-screen bg-neu-bg">
      {/* Neumorphic Navigation with BIGGER LOGO */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="neu rounded-neu-full px-4 sm:px-6 py-2 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* BIGGER LOGO - Standardized with Landing */}
              <div className="neu-sm p-2 rounded-full transition-all duration-300 group-hover:shadow-neu">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image
                    src={LOGO_URL}
                    alt="ChildCare Pro"
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
              >
                <Building2 className="w-4 h-4" />
                Home
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-3 py-2 text-sm font-medium"
              >
                <Lock className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-neu-primary px-4 sm:px-6 py-2.5 rounded-neu-full text-sm font-semibold flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* URGENCY BANNER - Increased separation from nav */}
      <div className="fixed top-[112px] sm:top-[120px] left-0 right-0 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
          <Timer className="w-4 h-4 animate-pulse" />
          <span>
            <strong>{cityData.name} Special:</strong> Only <span className="font-bold text-yellow-300">{spotsLeft} spots left</span> for free onboarding!
          </span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Hero Section - Increased padding for banner separation */}
      <section className="pt-48 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Hero Card */}
          <div className="neu-lg rounded-neu-xl p-6 sm:p-8 lg:p-12 mb-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Location Badge */}
                <div className="inline-flex items-center gap-2 neu-inset px-4 py-2 rounded-neu-full mb-6">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700">{cityData.highlight} • {cityData.county}</span>
                </div>

                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 neu-sm px-4 py-2 rounded-neu-full text-sm font-medium text-emerald-600 mb-4 ml-2">
                  <BadgeCheck className="w-4 h-4" />
                  DCF Compliant
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                  #1 Childcare Software in{' '}
                  <span className="text-primary-500">{cityData.name}</span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-6 max-w-xl mx-auto lg:mx-0">
                  {cityData.description}
                </p>

                {/* FOMO Alert */}
                <div className="neu-inset px-4 py-2 rounded-neu-full inline-flex items-center gap-2 mb-6">
                  <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-gray-700 text-sm">
                    <strong className="text-amber-600">{cityData.daycares}+ daycares</strong> in {cityData.name} need this
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className="btn-neu-primary px-8 py-4 rounded-neu text-lg font-semibold flex items-center justify-center gap-2 group shadow-lg shadow-primary-500/30"
                  >
                    <Gift className="w-5 h-5" />
                    Start FREE 14-Day Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="neu px-6 py-4 rounded-neu font-medium text-gray-700 hover:shadow-neu-lg transition-all duration-300 flex items-center justify-center gap-2">
                    <div className="neu-inset w-10 h-10 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary-500 fill-current" />
                    </div>
                    Watch Demo
                  </button>
                </div>
              </div>

              {/* Floating Logo with Glow */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                  <div className="neu-lg p-6 sm:p-8 rounded-full animate-float relative">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                      <Image
                        src={LOGO_URL}
                        alt="ChildCare Pro"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Standardized with Landing */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: Building2, value: `${cityData.daycares}+`, label: 'Local Daycares', color: 'text-primary-500' },
              { icon: Users, value: `${(cityData.population / 1000).toFixed(0)}K+`, label: 'Population', color: 'text-emerald-500' },
              { icon: Star, value: '4.9/5', label: 'Rating', color: 'text-amber-500' },
              { icon: Sparkles, value: '5 min', label: 'Setup Time', color: 'text-purple-500' },
            ].map((stat, i) => (
              <div
                key={i}
                className="neu p-6 rounded-neu text-center transition-all duration-500 hover:shadow-neu-lg animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="neu-inset w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="neu rounded-neu-xl p-4 sm:p-6">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              {[
                { icon: Shield, text: 'DCF Compliant', color: 'text-emerald-500' },
                { icon: Award, text: 'Top Rated 2024', color: 'text-amber-500' },
                { icon: Headphones, text: 'Florida Support', color: 'text-primary-500' },
                { icon: Lock, text: 'Bank-Level Security', color: 'text-purple-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
                  <div className="neu-inset w-8 h-8 rounded-full flex items-center justify-center">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - THE PAIN */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 neu-inset px-4 py-2 rounded-neu-full mb-4">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span className="text-sm font-medium text-error">Sound Familiar?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 animate-fade-in-up">
              Running a {cityData.name} Daycare Shouldn&apos;t <span className="text-error">Break You</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You started this business to help children, not to drown in spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Clock,
                title: '10+ Hours Lost Weekly',
                description: 'Attendance sheets, billing, parent updates... You\'re a data entry clerk, not a childcare pro.',
                stat: '40hrs/month wasted',
                color: 'text-error',
                bgColor: 'bg-error/10',
              },
              {
                icon: AlertTriangle,
                title: 'DCF Inspection Fear',
                description: `One wrong ratio in ${cityData.name} = license at risk. Are you 100% compliant right now?`,
                stat: '$10K+ fines possible',
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
              },
              {
                icon: CircleDollarSign,
                title: 'Cash Flow Chaos',
                description: 'Late payments, missing invoices, awkward parent conversations. How much are you owed?',
                stat: 'Avg. $4,200 past due',
                color: 'text-primary-500',
                bgColor: 'bg-primary-500/10',
              },
            ].map((problem, i) => (
              <div
                key={i}
                className="neu-hover p-8 rounded-neu group animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="neu-inset w-16 h-16 rounded-neu-sm flex items-center justify-center mb-6 group-hover:shadow-neu-glow-primary transition-all duration-300">
                  <problem.icon className={`w-8 h-8 ${problem.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{problem.title}</h3>
                <p className="text-gray-600 mb-4">{problem.description}</p>
                <div className={`${problem.bgColor} ${problem.color} px-4 py-2 rounded-neu-full text-sm font-bold inline-flex items-center gap-2`}>
                  <TrendingUp className="w-4 h-4" />
                  {problem.stat}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600 mb-3">There&apos;s a better way...</p>
            <ArrowRight className="w-6 h-6 text-primary-500 mx-auto animate-bounce rotate-90" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-b from-neu-bg to-white/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 neu-inset px-4 py-2 rounded-neu-full mb-4">
              <Zap className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">Dead Simple</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Get Started in <span className="text-primary-500">3 Easy Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Sign Up in 5 Minutes', desc: 'Create your account and add your center details. No technical skills needed.', icon: ClipboardCheck, color: 'text-primary-500' },
              { step: '02', title: 'Add Your Team & Children', desc: 'Import or manually add staff and children. We help you migrate existing data free.', icon: Users, color: 'text-emerald-500' },
              { step: '03', title: 'Go Live Instantly', desc: 'Start using attendance, billing, and parent communication right away.', icon: Zap, color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent -translate-x-1/2 z-0" />
                )}
                <div className="neu-lg p-8 rounded-neu text-center relative z-10">
                  <div className="neu w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500 font-bold text-xl">
                    {item.step}
                  </div>
                  <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 neu-inset px-4 py-2 rounded-neu-full mb-4">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">Powerful Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 animate-fade-in-up">
              Why {cityData.name} Daycares Choose Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for Florida childcare providers with DCF compliance at the core.
            </p>
          </div>

          {/* DCF Compliance Featured Card */}
          <div className="neu-lg rounded-neu-xl p-6 sm:p-8 mb-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
              <div className="neu p-5 rounded-neu-xl">
                <div className="neu-inset w-20 h-20 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary-500" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">Florida DCF Compliance</h3>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">AUTOMATIC</span>
                </div>
                <p className="text-gray-600 mb-4 max-w-xl">
                  Real-time staff-to-child ratio monitoring based on Florida DCF requirements.
                  Never worry about compliance audits in {cityData.name} again.
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {['Auto Ratios', 'Age Tracking', 'Instant Alerts', 'Audit Reports'].map((item, i) => (
                    <span key={i} className="neu-inset px-3 py-1.5 rounded-neu-full text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid - Standardized with Landing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.slice(1).map((feature, i) => (
              <div
                key={i}
                className="neu-hover p-6 rounded-neu group transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="neu-inset w-14 h-14 rounded-neu-sm flex items-center justify-center flex-shrink-0 group-hover:shadow-neu-glow-primary transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                    </div>
                    <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-bold mb-2 inline-block">{feature.tag}</span>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Served Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Card */}
            <div className="neu-lg rounded-neu-xl p-6 sm:p-8 animate-slide-left">
              <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Serving All of {cityData.name}</h3>
              <p className="text-gray-600 mb-6">
                Our software supports childcare centers throughout {cityData.county} and surrounding areas.
              </p>
              <div className="flex items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                  <span className="text-gray-600">Active Centers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                  <span className="text-gray-600">Coverage Area</span>
                </div>
              </div>

              {/* Animated dots */}
              <div className="neu-inset rounded-neu p-6 relative h-32">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary-400 rounded-full animate-pulse shadow-lg shadow-primary-400/50" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" style={{ animationDelay: '1.5s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" style={{ animationDelay: '2s' }} />
              </div>
            </div>

            {/* Neighborhoods Card */}
            <div className="neu-lg rounded-neu-xl p-6 sm:p-8 animate-slide-right">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Neighborhoods We Serve in {cityData.name}
              </h3>
              <div className="flex flex-wrap gap-3">
                {cityData.neighborhoods.map((area, i) => (
                  <div
                    key={area}
                    className="neu px-4 py-2.5 rounded-neu font-medium text-gray-700 flex items-center gap-2 hover:shadow-neu-lg transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <MapPin className="w-4 h-4 text-primary-500" />
                    {area}
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

      {/* Testimonial Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Testimonial */}
            <div className="lg:col-span-2 neu-lg rounded-neu-xl p-6 sm:p-8 animate-fade-in-up">
              {/* Results Badge */}
              <div className="bg-success/10 text-success px-4 py-2 rounded-neu-full text-sm font-bold mb-4 inline-flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Saved 10+ hours/week
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="neu p-4 rounded-neu-xl flex-shrink-0">
                  <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-rose-500" />
                  </div>
                </div>
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-4 italic">
                    &ldquo;ChildCare Pro transformed how we run our {cityData.name} center. The DCF compliance
                    tracking alone saves us hours every week. Parents love the daily updates! I finally have time to focus on the children.&rdquo;
                  </blockquote>
                  <div>
                    <p className="font-bold text-gray-800">Maria Rodriguez</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      Director, Little Stars Daycare • <MapPin className="w-3 h-3" />{cityData.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Card */}
            <div className="neu-lg rounded-neu-xl p-6 sm:p-8 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-5xl font-bold text-gray-800 mb-2">4.9/5</p>
              <p className="text-amber-600 font-medium mb-4">Customer Rating</p>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-500 text-sm">Based on 127 reviews from Florida childcare centers</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 neu-inset px-4 py-2 rounded-neu-full mb-4">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details key={i} className="neu rounded-neu group">
                <summary className="px-5 py-4 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <div className="neu-inset w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="font-semibold text-gray-800 pr-4">{item.q}</span>
                  </div>
                  <div className="neu-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-open:rotate-180">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </summary>
                <div className="px-5 pb-4 pl-[68px] text-gray-600">{item.a}</div>
              </details>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-10 text-center">
            <div className="neu-lg p-6 rounded-neu-xl">
              <Headphones className="w-10 h-10 text-primary-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Still Have Questions?</h3>
              <p className="text-gray-600 text-sm mb-4">Our Florida-based team is here to help!</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="tel:+13212468614" className="neu px-5 py-2.5 rounded-neu flex items-center justify-center gap-2 text-sm hover:shadow-neu-lg transition-all">
                  <Phone className="w-4 h-4 text-primary-500" />
                  (321) 246-8614
                </a>
                <a href="mailto:info@childcareai.com" className="neu px-5 py-2.5 rounded-neu flex items-center justify-center gap-2 text-sm hover:shadow-neu-lg transition-all">
                  <Mail className="w-4 h-4 text-primary-500" />
                  info@childcareai.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="neu-lg rounded-neu-xl p-8 sm:p-12 text-center relative overflow-hidden animate-pulse-glow">
            {/* Background */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              {/* Logo */}
              <div className="neu p-4 rounded-full inline-block mb-6">
                <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center">
                  <div className="relative w-12 h-12">
                    <Image src={LOGO_URL} alt="ChildCare Pro" fill className="object-contain" />
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div className="bg-amber-100 text-amber-800 px-5 py-2 rounded-neu-full text-sm font-bold mb-6 inline-flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Only {spotsLeft} free onboarding spots left in {cityData.name}!
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
                Ready to Transform Your <span className="text-primary-500">{cityData.name} Center?</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join {cityData.daycares}+ daycare owners in {cityData.county} who stopped drowning in paperwork.
              </p>

              <Link
                href="/register"
                className="btn-neu-primary px-10 py-5 rounded-neu text-lg font-semibold inline-flex items-center gap-3 group shadow-lg shadow-primary-500/30"
              >
                <Gift className="w-5 h-5" />
                Start Your FREE 14-Day Trial
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-gray-500 mt-6 text-sm flex items-center justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  5 min setup
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  Cancel anytime
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="neu-lg rounded-neu-xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Brand */}
              <div className="lg:w-1/3">
                <Link href="/" className="flex items-center gap-3 mb-4">
                  <div className="neu-sm p-2 rounded-full">
                    <div className="relative w-12 h-12">
                      <Image
                        src={LOGO_URL}
                        alt="ChildCare Pro"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </Link>
                <p className="text-gray-600 mb-4 text-sm">
                  The #1 childcare management software for Florida daycare centers.
                </p>
                <p className="text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} ChildCare Pro. All rights reserved.
                </p>
              </div>

              {/* Other Cities */}
              <div className="lg:flex-1">
                <p className="text-gray-700 font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  Also serving childcare centers in:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CITIES)
                    .filter(([slug]) => slug !== city)
                    .map(([slug, data]) => (
                      <Link
                        key={slug}
                        href={`/${slug}`}
                        className="neu-sm px-3 py-1.5 rounded-neu text-gray-600 text-sm hover:shadow-neu transition-all duration-300 flex items-center gap-1"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {data.name}, FL
                      </Link>
                    ))}
                </div>
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
            url: `https://childcareproai.com/${city}`,
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
