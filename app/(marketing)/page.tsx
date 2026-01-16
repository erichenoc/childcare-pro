'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Shield,
  MessageSquare,
  BarChart3,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
  ChevronDown,
  Baby,
  Building2,
  Zap,
  Heart,
  Bell,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Globe,
  Phone,
  Headphones,
} from 'lucide-react'
import { AIChatWidget } from './components/AIChatWidget'

// Logo URLs
const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1768428103/ChildCarePro_Logo_1_f0gqth.png'

// Pricing data
const PLANS = [
  {
    name: 'Starter',
    price: 79,
    annual: 790,
    description: 'Perfect for small home daycares',
    children: 15,
    staff: 3,
    features: [
      'Check-in/Check-out System',
      'Automated Billing & Invoicing',
      'Daily Reports to Parents',
      'AI Support Assistant',
      'Parent Communication App',
      'Basic Analytics',
    ],
    cta: 'Start Free Trial',
    popular: false,
    gradient: 'from-slate-50 to-slate-100',
  },
  {
    name: 'Professional',
    price: 149,
    annual: 1490,
    description: 'For growing childcare centers',
    children: 50,
    staff: 10,
    features: [
      'Everything in Starter',
      'DCF Ratio Tracking',
      'Advanced Reports & Analytics',
      'Staff Scheduling',
      'Priority Support',
      'Custom Branding',
    ],
    cta: 'Start Free Trial',
    popular: true,
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    name: 'Enterprise',
    price: 299,
    annual: 2990,
    description: 'For multi-location operations',
    children: 150,
    staff: 'Unlimited',
    features: [
      'Everything in Professional',
      'Multi-Location Management',
      'API Access',
      'Dedicated Onboarding',
      'Custom Integrations',
      'White-Label Options',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-slate-800 to-slate-900',
  },
]

const FEATURES = [
  {
    icon: UserCheck,
    title: 'Easy Check-In/Out',
    description: 'Digital kiosk mode for fast, contactless check-ins.',
    color: 'bg-emerald-500',
    size: 'col-span-1',
  },
  {
    icon: CreditCard,
    title: 'Automated Billing',
    description: 'Generate invoices and process payments automatically.',
    color: 'bg-violet-500',
    size: 'col-span-1',
  },
  {
    icon: Shield,
    title: 'DCF Compliance',
    description: 'Real-time ratio monitoring for Florida requirements.',
    color: 'bg-blue-500',
    size: 'col-span-1 md:col-span-2 md:row-span-2',
    featured: true,
  },
  {
    icon: MessageSquare,
    title: 'Parent Communication',
    description: 'Send updates, photos, and daily reports instantly.',
    color: 'bg-pink-500',
    size: 'col-span-1',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Track attendance trends and revenue dashboards.',
    color: 'bg-amber-500',
    size: 'col-span-1',
  },
  {
    icon: Bell,
    title: 'Incident Tracking',
    description: 'Document and report incidents with notifications.',
    color: 'bg-rose-500',
    size: 'col-span-1',
  },
]

const TESTIMONIALS = [
  {
    name: 'Maria Rodriguez',
    role: 'Owner, Little Stars Daycare',
    location: 'Orlando, FL',
    quote: 'ChildCare Pro saved us 10 hours a week on paperwork. The DCF ratio tracking gives me peace of mind.',
    rating: 5,
    avatar: 'M',
  },
  {
    name: 'Jennifer Williams',
    role: 'Director, Sunshine Academy',
    location: 'Kissimmee, FL',
    quote: 'Parents love the daily reports and photos. Our enrollment increased 30% since we started.',
    rating: 5,
    avatar: 'J',
  },
  {
    name: 'David Chen',
    role: 'Owner, Growing Minds',
    location: 'Winter Park, FL',
    quote: 'The billing automation alone pays for itself. No more chasing payments!',
    rating: 5,
    avatar: 'D',
  },
]

const FAQ = [
  {
    q: 'Is ChildCare Pro DCF compliant?',
    a: 'Yes! Our software is designed specifically for Florida childcare centers and includes real-time DCF ratio monitoring.',
  },
  {
    q: 'How long is the free trial?',
    a: 'You get 14 days to try all features with no credit card required.',
  },
  {
    q: 'Can I import my existing data?',
    a: 'Absolutely! Our onboarding team will help you migrate all your data.',
  },
  {
    q: 'Is there a contract?',
    a: 'No long-term contracts. Pay monthly and cancel anytime.',
  },
  {
    q: 'Do parents need to download an app?',
    a: 'No app download required! Parents access everything through a mobile-friendly web portal.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards through Stripe. You can enable credit cards, ACH transfers, or manual payments.',
  },
]

const CITIES = [
  { name: 'Orlando', slug: 'orlando' },
  { name: 'Kissimmee', slug: 'kissimmee' },
  { name: 'Sanford', slug: 'sanford' },
  { name: 'Winter Park', slug: 'winter-park' },
  { name: 'Altamonte Springs', slug: 'altamonte-springs' },
  { name: 'Ocoee', slug: 'ocoee' },
]

const STATS = [
  { value: '127+', label: 'Childcare Centers', icon: Building2 },
  { value: '5,400+', label: 'Children Managed', icon: Baby },
  { value: '99.9%', label: 'Uptime', icon: Zap },
  { value: '4.9/5', label: 'Customer Rating', icon: Star },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden">
      {/* Custom CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .animate-slide-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }

        .animate-slide-right {
          animation: slideInRight 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }

        .bento-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bento-card:hover {
          transform: translateY(-4px);
        }

        .gradient-border {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          padding: 2px;
          border-radius: 1.5rem;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
                <Image
                  src={LOGO_URL}
                  alt="ChildCare Pro"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ChildCare Pro
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition font-medium">Reviews</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition font-medium">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition font-medium">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <a href="#features" className="text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50">Features</a>
              <a href="#pricing" className="text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50">Pricing</a>
              <a href="#testimonials" className="text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50">Reviews</a>
              <a href="#faq" className="text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50">FAQ</a>
              <hr className="my-2" />
              <Link href="/login" className="text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50">Sign In</Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold text-center mt-2"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Bento Style */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Hero Bento Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>

            {/* Hero Main Card - Large */}
            <div className="lg:col-span-8 lg:row-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden bento-card">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in delay-200">
                  <Shield className="w-4 h-4" />
                  DCF Compliant Software for Florida
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Stop Drowning in{' '}
                  <span className="text-yellow-300">Paperwork</span>
                  <br />
                  Run Your Daycare{' '}
                  <span className="bg-white/20 px-3 py-1 rounded-lg">Smarter</span>
                </h1>

                <p className="text-xl text-blue-100 mb-8 max-w-xl">
                  The all-in-one childcare management software that automates billing, tracks DCF ratios in real-time, and keeps parents happy.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-6 text-sm text-blue-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    No credit card required
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Setup in 5 minutes
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Cancel anytime
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Right Column */}
            {STATS.slice(0, 2).map((stat, i) => (
              <div
                key={i}
                className={`lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm bento-card animate-slide-right delay-${(i + 2) * 100}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${i === 0 ? 'bg-emerald-100' : 'bg-blue-100'} rounded-2xl flex items-center justify-center`}>
                    <stat.icon className={`w-7 h-7 ${i === 0 ? 'text-emerald-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* More Stats - Bottom Row */}
            {STATS.slice(2).map((stat, i) => (
              <div
                key={i + 2}
                className={`lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm bento-card animate-fade-in-up delay-${(i + 4) * 100}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${i === 0 ? 'bg-amber-100' : 'bg-violet-100'} rounded-2xl flex items-center justify-center`}>
                    <stat.icon className={`w-7 h-7 ${i === 0 ? 'text-amber-600' : 'text-violet-600'}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Dashboard Preview Card */}
            <div className="lg:col-span-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 bento-card animate-fade-in-up delay-600 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Dashboard</p>
                      <p className="text-gray-400 text-sm">Real-time overview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">24</p>
                      <p className="text-gray-400 text-xs">Children Today</p>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                      <p className="text-2xl font-bold text-emerald-400">✓</p>
                      <p className="text-emerald-300 text-xs">DCF Compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Bento Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Running a Daycare Shouldn&apos;t Be This Hard
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              If you&apos;re spending more time on admin than with children, something is broken.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl p-8 border border-red-200 bento-card group">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hours Lost to Paperwork</h3>
              <p className="text-gray-600">
                Attendance sheets, billing spreadsheets, parent updates... You didn&apos;t open a daycare to do data entry.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 border border-orange-200 bento-card group">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DCF Compliance Anxiety</h3>
              <p className="text-gray-600">
                Manually tracking ratios is stressful. One mistake during an inspection can cost you your license.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 border border-yellow-200 bento-card group">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chasing Payments</h3>
              <p className="text-gray-600">
                Late payments, missing invoices, awkward conversations with parents. Cash flow chaos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Center
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed specifically for Florida childcare providers.
            </p>
          </div>

          {/* Bento Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] gap-4 lg:gap-6">
            {/* Featured Large Card - DCF Compliance */}
            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden bento-card group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">DCF Compliance</h3>
                <p className="text-blue-100 mb-6 flex-grow">
                  Real-time ratio monitoring ensures you always meet Florida DCF requirements. Get instant alerts when ratios are at risk.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-blue-200 text-sm">Compliant Centers</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-blue-200 text-sm">Violations Reported</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Feature Cards */}
            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 bento-card group">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Easy Check-In/Out</h3>
              <p className="text-gray-600 text-sm">Digital kiosk mode for contactless check-ins.</p>
            </div>

            <div className="bg-violet-50 rounded-3xl p-6 border border-violet-100 bento-card group">
              <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Automated Billing</h3>
              <p className="text-gray-600 text-sm">Generate invoices automatically with Stripe.</p>
            </div>

            <div className="bg-pink-50 rounded-3xl p-6 border border-pink-100 bento-card group">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Parent Communication</h3>
              <p className="text-gray-600 text-sm">Send updates and photos in real-time.</p>
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 bento-card group">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600 text-sm">Track trends with visual dashboards.</p>
            </div>

            {/* Wide Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white bento-card relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Incident Tracking</h3>
                    <p className="text-gray-400 text-sm">Document and report with instant parent notifications</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Feature CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              See All Features in Action
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section - Bento Style */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing for Every Center
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Start free for 14 days. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-gray-200 shadow-sm">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                  !billingAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  billingAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className={`text-xs px-2 py-0.5 rounded-full ${billingAnnual ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-3xl p-8 bento-card ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white scale-105 shadow-2xl shadow-blue-500/30'
                    : plan.name === 'Enterprise'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className={plan.popular || plan.name === 'Enterprise' ? 'text-white/70' : 'text-gray-500'}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">
                      ${billingAnnual ? Math.round(plan.annual / 12) : plan.price}
                    </span>
                    <span className={plan.popular || plan.name === 'Enterprise' ? 'text-white/70' : 'text-gray-500'}>
                      /month
                    </span>
                  </div>
                  {billingAnnual && (
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-blue-200' : plan.name === 'Enterprise' ? 'text-gray-400' : 'text-emerald-600'}`}>
                      Billed ${plan.annual}/year
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`flex items-center gap-3 ${plan.popular || plan.name === 'Enterprise' ? 'text-white/90' : 'text-gray-600'}`}>
                    <Baby className={`w-5 h-5 ${plan.popular ? 'text-blue-200' : plan.name === 'Enterprise' ? 'text-gray-400' : 'text-blue-500'}`} />
                    Up to {plan.children} children
                  </div>
                  <div className={`flex items-center gap-3 ${plan.popular || plan.name === 'Enterprise' ? 'text-white/90' : 'text-gray-600'}`}>
                    <Users className={`w-5 h-5 ${plan.popular ? 'text-blue-200' : plan.name === 'Enterprise' ? 'text-gray-400' : 'text-blue-500'}`} />
                    {plan.staff === 'Unlimited' ? 'Unlimited' : `Up to ${plan.staff}`} staff
                  </div>
                  <hr className={plan.popular || plan.name === 'Enterprise' ? 'border-white/20' : 'border-gray-200'} />
                  {plan.features.map((feature, j) => (
                    <div key={j} className={`flex items-center gap-3 ${plan.popular || plan.name === 'Enterprise' ? 'text-white/90' : 'text-gray-600'}`}>
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-emerald-300' : plan.name === 'Enterprise' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/register'}
                  className={`block w-full py-4 rounded-2xl font-bold text-center transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg'
                      : plan.name === 'Enterprise'
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Bento Grid */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Customer Love
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Florida Childcare Centers
            </h2>
            <p className="text-xl text-gray-600">
              See why daycare owners choose ChildCare Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-lg bento-card ${i === 1 ? 'md:scale-105' : ''}`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-blue-600 font-medium">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden bento-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 text-gray-600">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Bento Style */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-8 lg:p-16 text-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
                Ready to Transform Your<br />Childcare Center?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join 127+ childcare centers in Florida who have simplified their operations with ChildCare Pro.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1"
              >
                Start Your 14-Day Free Trial
                <ArrowRight className="w-6 h-6" />
              </Link>
              <p className="mt-6 text-blue-200">
                No credit card required • Setup in under 5 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Bento Style */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12">
                  <Image
                    src={LOGO_URL}
                    alt="ChildCare Pro"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-white">ChildCare Pro</span>
              </Link>
              <p className="text-gray-400 mb-6">
                The #1 childcare management software for Florida daycare centers.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">
                  <Headphones className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition">Free Trial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Serving Florida</h4>
              <div className="grid grid-cols-2 gap-3">
                {CITIES.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/${city.slug}`}
                    className="text-gray-400 hover:text-blue-400 transition text-sm"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ChildCare Pro. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}
