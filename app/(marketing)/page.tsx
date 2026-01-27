'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  Clock,
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
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  FileText,
  Camera,
  Calendar,
  Award,
  Lock,
  Headphones,
  Gift,
  Timer,
  AlertCircle,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  Smartphone,
  Wifi,
  // Florida Programs & Expanded Features icons
  GraduationCap,
  Utensils,
  Languages,
  Syringe,
  BookOpen,
  ClipboardList,
  UserPlus,
  Activity,
  Brain,
  Globe,
  School,
  Landmark,
} from 'lucide-react'
import { AIChatWidget } from './components/AIChatWidget'

// Official Logo URL - ONLY USE THIS
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
  },
]

const TESTIMONIALS = [
  {
    name: 'Maria Rodriguez',
    role: 'Owner, Little Stars Daycare',
    location: 'Orlando, FL',
    quote: 'ChildCare Pro saved us 10 hours a week on paperwork. The DCF ratio tracking gives me peace of mind. I can finally focus on the children!',
    rating: 5,
    avatar: 'M',
    savings: '$2,400/month',
  },
  {
    name: 'Jennifer Williams',
    role: 'Director, Sunshine Academy',
    location: 'Kissimmee, FL',
    quote: 'Parents love the daily reports and photos. Our enrollment increased 30% since we started using ChildCare Pro!',
    rating: 5,
    avatar: 'J',
    savings: '30% more enrollment',
  },
  {
    name: 'David Chen',
    role: 'Owner, Growing Minds',
    location: 'Winter Park, FL',
    quote: 'The billing automation alone pays for itself. No more chasing payments or awkward conversations with parents!',
    rating: 5,
    avatar: 'D',
    savings: '95% on-time payments',
  },
  {
    name: 'Rosa Martinez',
    role: 'Directora, Cariñitos Daycare',
    location: 'Miami, FL',
    quote: '¡El sistema en español es perfecto! Mis familias hispanas pueden usar el portal de padres sin problemas. El soporte CACFP nos ahorra horas cada mes.',
    rating: 5,
    avatar: 'R',
    savings: '8hrs/week on CACFP',
  },
  {
    name: 'Lisa Thompson',
    role: 'Owner, Bright Futures Learning',
    location: 'Tampa, FL',
    quote: 'Managing our VPK program used to be a nightmare. Now I generate ELC reports in one click. The 540-hour tracking is automatic!',
    rating: 5,
    avatar: 'L',
    savings: 'VPK compliance 100%',
  },
  {
    name: 'Carlos Fernandez',
    role: 'Director, Happy Kids Academy',
    location: 'Jacksonville, FL',
    quote: 'School Readiness billing was so confusing before. Now subsidies, copays, and parent portions are calculated automatically. Game changer!',
    rating: 5,
    avatar: 'C',
    savings: '$1,800/month recovered',
  },
]

const FAQ = [
  {
    q: 'Is ChildCare Pro DCF compliant?',
    a: 'Yes! Our software is designed specifically for Florida childcare centers and includes real-time DCF ratio monitoring, staff certification tracking, and inspection-ready reports. We help you stay 100% compliant with Florida DCF regulations.',
    icon: Shield,
  },
  {
    q: 'Do you support VPK and School Readiness programs?',
    a: 'Absolutely! We have full support for Florida VPK (Voluntary Pre-Kindergarten) with automatic 540-hour tracking and ELC report generation. For School Readiness, we track subsidies, manage copayments, and generate all required ELC compliance reports.',
    icon: GraduationCap,
  },
  {
    q: 'Can you help with CACFP meal tracking?',
    a: 'Yes! Our CACFP module lets you track meals by type (breakfast, lunch, snacks), calculate estimated reimbursements, manage food allergies with visual alerts, and generate monthly reports for your sponsor. Many centers save 5-8 hours per week on CACFP paperwork.',
    icon: Utensils,
  },
  {
    q: '¿El sistema está disponible en español?',
    a: '¡Sí! ChildCare Pro es 100% bilingüe. Todo el sistema, incluyendo el portal de padres, reportes y comunicaciones, está disponible en español e inglés. Nuestro equipo de soporte también habla español.',
    icon: Languages,
  },
  {
    q: 'How do you track immunizations?',
    a: 'We track all Florida-required immunizations based on CDC/DCF schedules. The system alerts you when vaccines are due or overdue, and you can generate Form 680 compliance reports for inspections. Parents can upload immunization records directly to their portal.',
    icon: Syringe,
  },
  {
    q: 'How long is the free trial?',
    a: 'You get a full 14 days to try ALL features with no credit card required. No strings attached. Our Florida-based team will help you set everything up.',
    icon: Gift,
  },
  {
    q: 'Can I import my existing data?',
    a: 'Absolutely! Our dedicated onboarding team will personally migrate all your children, families, staff data, and even historical attendance records for FREE.',
    icon: FileText,
  },
  {
    q: 'Is there a contract or commitment?',
    a: 'No long-term contracts ever. Pay monthly and cancel anytime with just one click. We earn your business every month.',
    icon: Lock,
  },
  {
    q: 'Do parents need to download an app?',
    a: 'No app download required! Parents access everything through a mobile-friendly web portal that works on any device. They can view daily reports, photos, make payments, and communicate with staff.',
    icon: Smartphone,
  },
  {
    q: 'What payment methods can parents use?',
    a: 'Parents can pay with credit/debit cards through our secure Stripe integration, or you can record manual payments (cash, check, Zelle). Automatic payment reminders help you get paid on time.',
    icon: CreditCard,
  },
]

const CITIES = [
  { name: 'Miami', slug: 'miami' },
  { name: 'Orlando', slug: 'orlando' },
  { name: 'Tampa', slug: 'tampa' },
  { name: 'Jacksonville', slug: 'jacksonville' },
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
  { name: 'West Palm Beach', slug: 'west-palm-beach' },
  { name: 'Hialeah', slug: 'hialeah' },
  { name: 'St. Petersburg', slug: 'st-petersburg' },
  { name: 'Tallahassee', slug: 'tallahassee' },
  { name: 'Port St. Lucie', slug: 'port-st-lucie' },
  { name: 'Cape Coral', slug: 'cape-coral' },
  { name: 'Pembroke Pines', slug: 'pembroke-pines' },
  { name: 'Hollywood', slug: 'hollywood' },
  { name: 'Gainesville', slug: 'gainesville' },
  { name: 'Coral Springs', slug: 'coral-springs' },
  { name: 'Naples', slug: 'naples' },
  { name: 'Sarasota', slug: 'sarasota' },
  { name: 'Lakeland', slug: 'lakeland' },
  { name: 'Boca Raton', slug: 'boca-raton' },
  { name: 'Kissimmee', slug: 'kissimmee' },
]

// Florida Programs Data - Critical for SEO
const FLORIDA_PROGRAMS = [
  {
    name: 'VPK Program',
    fullName: 'Voluntary Pre-Kindergarten',
    description: 'Track 540 required hours, generate ELC attendance reports, and manage VPK certificates automatically.',
    icon: GraduationCap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['540-hour tracking', 'ELC reports', 'Certificate management', 'Attendance sync'],
  },
  {
    name: 'School Readiness',
    fullName: 'ELC Subsidized Care',
    description: 'Manage family subsidies, track copayments, and generate compliance reports for your ELC.',
    icon: School,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: ['Subsidy tracking', 'Copay management', 'ELC reporting', 'Family eligibility'],
  },
  {
    name: 'CACFP',
    fullName: 'Child & Adult Care Food Program',
    description: 'Track meals served, calculate reimbursements, and generate USDA-compliant monthly reports.',
    icon: Utensils,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: ['Meal tracking', 'Reimbursement calculator', 'Allergy alerts', 'Sponsor reports'],
  },
  {
    name: 'DCF Compliance',
    fullName: 'Department of Children & Families',
    description: 'Real-time ratio monitoring, staff certification tracking, and inspection-ready reports.',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: ['Ratio monitoring', 'Certification alerts', 'Incident reports', 'Compliance dashboard'],
  },
]

// Expanded Features for Florida Daycares
const EXPANDED_FEATURES = [
  {
    category: 'Compliance & Safety',
    features: [
      { icon: Shield, title: 'DCF Ratio Monitoring', desc: 'Real-time staff-to-child ratio tracking for all age groups' },
      { icon: Syringe, title: 'Immunization Tracking', desc: 'Track vaccines, send alerts, generate Form 680 reports' },
      { icon: ClipboardList, title: 'Document Management', desc: 'Store all required DCF forms digitally, never miss an expiration' },
      { icon: AlertTriangle, title: 'Incident Reports', desc: 'Document incidents, get parent signatures, maintain DCF records' },
    ],
  },
  {
    category: 'Child Development',
    features: [
      { icon: BookOpen, title: 'Learning Milestones', desc: 'Track developmental progress across 6 key areas' },
      { icon: Activity, title: 'Daily Activities', desc: 'Log meals, naps, diaper changes, and activities in real-time' },
      { icon: Camera, title: 'Photo Updates', desc: 'Share moments with parents instantly throughout the day' },
      { icon: Brain, title: 'Assessment Reports', desc: 'Generate progress reports for parent conferences' },
    ],
  },
  {
    category: 'Business Operations',
    features: [
      { icon: CreditCard, title: 'Automated Billing', desc: 'Create recurring invoices, accept card payments via Stripe' },
      { icon: UserPlus, title: 'Waitlist Management', desc: 'Manage inquiries, schedule tours, track enrollment pipeline' },
      { icon: Calendar, title: 'Staff Scheduling', desc: 'Create schedules, track hours, manage time-off requests' },
      { icon: BarChart3, title: 'Financial Reports', desc: 'Revenue tracking, accounts receivable, tax-ready exports' },
    ],
  },
]

// Screenshots/Images REALES del sistema
const SYSTEM_SCREENSHOTS = [
  {
    title: 'Dashboard Overview',
    description: 'See your entire center at a glance - attendance, ratios, DCF compliance, and key metrics all in one place',
    image: '/docs/images/manual/03-dashboard-principal.png',
    alt: 'ChildCare Pro Dashboard showing real-time attendance and DCF ratio monitoring for Florida daycares',
  },
  {
    title: 'Children Management',
    description: 'Complete child profiles with medical info, emergency contacts, immunization tracking, and development milestones',
    image: '/docs/images/manual/04-gestion-ninos.png',
    alt: 'Child management software for Florida childcare centers - DCF compliant profiles',
  },
  {
    title: 'Family Portal',
    description: 'Manage families, guardians, authorized pickups, and billing contacts with bilingual support',
    image: '/docs/images/manual/05-gestion-familias.png',
    alt: 'Family management portal for daycare centers in Florida',
  },
  {
    title: 'Attendance Tracking',
    description: 'Easy check-in/check-out with kiosk mode, parent signatures, and real-time DCF ratio monitoring',
    image: '/docs/images/manual/06-asistencia.png',
    alt: 'Digital attendance tracking system for Florida daycares - DCF ratio compliant',
  },
  {
    title: 'Billing & Payments',
    description: 'Automated invoicing with Stripe integration, School Readiness subsidies, and VPK tracking',
    image: '/docs/images/manual/07-facturacion.png',
    alt: 'Childcare billing software with Stripe payments and Florida subsidy tracking',
  },
  {
    title: 'Reports & Analytics',
    description: 'Comprehensive reports for DCF inspections, CACFP meal tracking, and financial analytics',
    image: '/docs/images/manual/09-reportes.png',
    alt: 'Daycare reporting software - DCF compliance reports for Florida childcare',
  },
]

const STATS = [
  { value: '127+', label: 'Childcare Centers', icon: Building2, color: 'text-primary-500' },
  { value: '5,400+', label: 'Happy Children', icon: Baby, color: 'text-pink-500' },
  { value: '99.9%', label: 'Uptime Guaranteed', icon: Wifi, color: 'text-emerald-500' },
  { value: '4.9/5', label: 'Customer Rating', icon: Star, color: 'text-amber-500' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign Up in 5 Minutes',
    description: 'Create your account and add your center details. No technical skills needed.',
    icon: ClipboardCheck,
    color: 'text-primary-500',
  },
  {
    step: '02',
    title: 'Add Your Team & Children',
    description: 'Import or manually add staff and children. We help you migrate existing data free.',
    icon: Users,
    color: 'text-emerald-500',
  },
  {
    step: '03',
    title: 'Go Live Instantly',
    description: 'Start using attendance, billing, and parent communication right away.',
    icon: Zap,
    color: 'text-amber-500',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [spotsLeft] = useState(7) // FOMO element

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-neu-bg overflow-x-hidden">
      {/* Navigation - Neumorphic with BIGGER LOGO */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neu-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="neu rounded-neu-full px-4 sm:px-6 py-2 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* LOGO - Grande pero contenedor compacto */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                <Image
                  src={LOGO_URL}
                  alt="ChildCare Pro"
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-contain drop-shadow-lg scale-150 transition-transform duration-300 group-hover:scale-[1.6]"
                />
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', icon: Sparkles },
                { label: 'Pricing', icon: CircleDollarSign },
                { label: 'Reviews', icon: Star },
                { label: 'FAQ', icon: MessageSquare },
              ].map((item) => (
                <a
                  key={item.label}
                  href={`#${item.label.toLowerCase()}`}
                  className="px-4 py-2 rounded-neu-sm text-gray-600 hover:text-gray-900 font-medium transition-all duration-200 hover:shadow-neu-inset-sm flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/family-portal/login"
                className="px-5 py-2.5 rounded-neu-sm text-purple-600 hover:text-purple-700 font-medium transition-all duration-200 hover:shadow-neu-inset-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Portal Padres
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-neu-sm text-gray-600 hover:text-gray-900 font-medium transition-all duration-200 hover:shadow-neu-inset-sm flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-neu-primary px-6 py-2.5 rounded-neu-full text-sm flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden neu-sm p-3 rounded-full"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-neu-bg px-4 pb-4 animate-fade-in">
            <div className="neu rounded-neu p-4 flex flex-col gap-2">
              {[
                { label: 'Features', icon: Sparkles },
                { label: 'Pricing', icon: CircleDollarSign },
                { label: 'Reviews', icon: Star },
                { label: 'FAQ', icon: MessageSquare },
              ].map((item) => (
                <a
                  key={item.label}
                  href={`#${item.label.toLowerCase()}`}
                  className="px-4 py-3 rounded-neu-sm text-gray-600 hover:shadow-neu-inset-sm transition-all flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-primary-500" />
                  {item.label}
                </a>
              ))}
              <div className="h-px bg-gray-300 my-2" />
              <Link href="/family-portal/login" className="px-4 py-3 rounded-neu-sm text-purple-600 flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                Portal de Padres
              </Link>
              <Link href="/login" className="px-4 py-3 rounded-neu-sm text-gray-600 flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-neu-primary py-3 rounded-neu-sm text-center mt-2 flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* URGENCY BANNER - Increased separation from nav */}
      <div className="fixed top-[112px] sm:top-[120px] left-0 right-0 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
          <Timer className="w-4 h-4 animate-pulse" />
          <span>
            <strong>January Special:</strong> Only <span className="font-bold text-yellow-300">{spotsLeft} spots left</span> for free onboarding this month!
          </span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Hero Section - Increased padding for banner separation */}
      <section className="pt-48 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo Hero with Glow */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="neu-lg p-8 rounded-full animate-float relative">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
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

            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto mb-12">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-primary-600 mb-6">
                <BadgeCheck className="w-5 h-5 text-emerald-500" />
                #1 DCF Compliant Software for Florida Daycares
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
                Stop <span className="text-error">Drowning</span> in{' '}
                <span className="line-through text-gray-400">Paperwork</span>
                <br />
                <span className="text-primary-500">Run Your Daycare Smarter</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                The all-in-one childcare management software that <strong>automates billing</strong>,
                tracks <strong>DCF ratios in real-time</strong>, and keeps <strong>parents happy</strong>.
              </p>

              {/* FOMO Alert */}
              <div className="neu-inset px-6 py-3 rounded-neu-full inline-flex items-center gap-3 mb-8">
                <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="text-gray-700">
                  <strong className="text-amber-600">{spotsLeft} centers</strong> signed up this week in Florida
                </span>
              </div>

              {/* CTA Buttons - Neumorphic */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link
                  href="/register"
                  className="btn-neu-primary px-10 py-5 rounded-neu text-lg font-bold flex items-center justify-center gap-3 group shadow-lg shadow-primary-500/30"
                >
                  <Gift className="w-6 h-6" />
                  Start FREE 14-Day Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="neu px-8 py-5 rounded-neu text-lg font-semibold flex items-center justify-center gap-3 hover:shadow-neu-lg transition-all">
                  <div className="neu-inset w-10 h-10 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-500 fill-primary-500" />
                  </div>
                  Watch 2-Min Demo
                </button>
              </div>

              {/* Trust Indicators with Icons */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                {[
                  { icon: CreditCard, text: 'No credit card required' },
                  { icon: Clock, text: 'Setup in 5 minutes' },
                  { icon: Lock, text: 'Cancel anytime' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-success" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid - Neumorphic */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className={`neu p-6 rounded-neu text-center transition-all duration-500 hover:shadow-neu-lg ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
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
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="neu rounded-neu-xl p-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-gray-700">DCF Approved</span>
              </div>
              <div className="h-8 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                <span className="font-semibold text-gray-700">Top Rated 2024</span>
              </div>
              <div className="h-8 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Headphones className="w-6 h-6 text-primary-500" />
                <span className="font-semibold text-gray-700">Florida-Based Support</span>
              </div>
              <div className="h-8 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-purple-500" />
                <span className="font-semibold text-gray-700">Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Emotional Pain Points */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-error mb-4">
              <AlertTriangle className="w-4 h-4" />
              Sound Familiar?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Running a Daycare Shouldn&apos;t <span className="text-error">Break You</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You started this business to help children, not to drown in spreadsheets at midnight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Clock,
                title: '10+ Hours Lost Weekly',
                description: "Attendance sheets, billing spreadsheets, parent updates... You didn't open a daycare to become a data entry clerk.",
                stat: '40hrs/month wasted',
                color: 'text-error',
                bgColor: 'bg-error/10',
              },
              {
                icon: AlertTriangle,
                title: 'DCF Inspection Anxiety',
                description: 'Manually tracking staff-to-child ratios is terrifying. One mistake = license at risk. Are you 100% sure right now?',
                stat: '$10K+ potential fines',
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
              },
              {
                icon: CircleDollarSign,
                title: 'Cash Flow Nightmare',
                description: 'Chasing late payments, forgotten invoices, awkward parent conversations. How much are you owed RIGHT NOW?',
                stat: 'Avg. $4,200 past due',
                color: 'text-primary-500',
                bgColor: 'bg-primary-500/10',
              },
            ].map((problem, i) => (
              <div
                key={i}
                className="neu-hover p-8 rounded-neu group"
              >
                <div className={`neu-inset w-16 h-16 rounded-neu-sm flex items-center justify-center mb-6 group-hover:shadow-neu-glow-primary transition-all duration-300`}>
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

          {/* Solution Teaser */}
          <div className="mt-12 text-center">
            <p className="text-xl text-gray-600 mb-4">There&apos;s a better way...</p>
            <ArrowRight className="w-8 h-8 text-primary-500 mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neu-bg to-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-primary-600 mb-4">
              <Zap className="w-4 h-4" />
              Dead Simple
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Get Started in <span className="text-primary-500">3 Easy Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No tech skills needed. No complicated setup. Just results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent -translate-x-1/2 z-0" />
                )}
                <div className="neu-lg p-8 rounded-neu text-center relative z-10">
                  <div className="neu w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500 font-bold text-xl">
                    {step.step}
                  </div>
                  <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="btn-neu-primary px-10 py-4 rounded-neu text-lg font-bold inline-flex items-center gap-3 group"
            >
              <Gift className="w-5 h-5" />
              Start Your Free Trial Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Neumorphic */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-primary-600 mb-4">
              <Sparkles className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Everything You Need to <span className="text-primary-500">Thrive</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by childcare experts, for childcare professionals.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Featured Card - DCF Compliance */}
            <div className="md:col-span-2 lg:col-span-2 neu-lg p-8 rounded-neu-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-start gap-6">
                  <div className="neu-inset w-20 h-20 rounded-neu flex items-center justify-center flex-shrink-0">
                    <Shield className="w-10 h-10 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-gray-800">DCF Ratio Compliance</h3>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">AUTOMATIC</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Real-time staff-to-child ratio monitoring that ensures you <strong>ALWAYS</strong> meet Florida DCF requirements.
                      Get instant alerts before ratios become a problem.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Compliant Centers', value: '100%', icon: BadgeCheck },
                        { label: 'DCF Violations', value: '0', icon: Shield },
                        { label: 'Alert Response', value: '<1 min', icon: Bell },
                        { label: 'Avg. Time Saved', value: '10 hrs/wk', icon: Clock },
                      ].map((stat, i) => (
                        <div key={i} className="neu-inset p-3 rounded-neu-sm text-center">
                          <stat.icon className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                          <p className="text-gray-500 text-xs">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Feature Cards */}
            {[
              { icon: UserCheck, title: 'Digital Check-In/Out', desc: 'Kiosk mode, QR codes, photo verification. Parents love it.', tag: 'TIME-SAVER' },
              { icon: CreditCard, title: 'Auto-Pilot Billing', desc: 'Invoices generate & send automatically. Get paid 3x faster.', tag: 'REVENUE' },
              { icon: Camera, title: 'Photo Updates', desc: 'Share moments with parents instantly. Build trust daily.', tag: 'ENGAGEMENT' },
              { icon: BarChart3, title: 'Smart Reports', desc: 'DCF compliance reports, attendance trends, revenue insights.', tag: 'INSIGHTS' },
              { icon: Bell, title: 'Incident Tracking', desc: 'Document, notify parents, maintain records automatically.', tag: 'COMPLIANCE' },
              { icon: Calendar, title: 'Staff Scheduling', desc: 'Create schedules, track hours, manage time-off requests.', tag: 'OPERATIONS' },
            ].map((feature, i) => (
              <div key={i} className="neu-hover p-6 rounded-neu group">
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

          {/* Feature CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="btn-neu-primary px-8 py-4 rounded-neu text-lg font-semibold inline-flex items-center gap-3"
            >
              Try All Features Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-gray-500 text-sm">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Florida Programs Section - Critical for SEO */}
      <section id="florida-programs" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-green-600 mb-4">
              <Landmark className="w-4 h-4" />
              Florida Programs
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Built for <span className="text-primary-500">Florida Childcare Programs</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Full support for VPK, School Readiness, CACFP, and DCF compliance - all the programs your center needs to succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {FLORIDA_PROGRAMS.map((program, i) => (
              <div key={i} className="neu-lg p-8 rounded-neu-lg group hover:shadow-neu-xl transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className={`${program.bgColor} w-20 h-20 rounded-neu flex items-center justify-center flex-shrink-0`}>
                    <program.icon className={`w-10 h-10 ${program.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{program.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{program.fullName}</p>
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {program.features.map((feature, j) => (
                        <span key={j} className="neu-inset px-3 py-1 rounded-neu-full text-xs font-medium text-gray-600">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="neu-lg p-8 rounded-neu-xl inline-block">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="neu w-20 h-20 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">100% DCF Compliant</h3>
                  <p className="text-gray-600">Our software meets all Florida Department of Children & Families requirements</p>
                </div>
                <Link
                  href="/register"
                  className="btn-neu-primary px-8 py-4 rounded-neu font-semibold inline-flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bilingual Support Section */}
      <section id="bilingual" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="neu-xl p-8 lg:p-16 rounded-neu-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-blue-600 mb-4">
                  <Languages className="w-4 h-4" />
                  Bilingual System
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                  <span className="text-primary-500">100% Bilingual</span> - English & Spanish
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Florida&apos;s diverse families deserve software that speaks their language. ChildCare Pro is fully available in English and Spanish.
                </p>

                <div className="space-y-4">
                  {[
                    { title: 'Parent Portal in Spanish', desc: 'Familias hispanas can view reports, photos, and payments in their native language' },
                    { title: 'Staff Interface Bilingual', desc: 'Your team can work in English or Spanish based on their preference' },
                    { title: 'All Reports & Documents', desc: 'Invoices, daily reports, and communications available in both languages' },
                    { title: 'Spanish Support Team', desc: 'Nuestro equipo de soporte habla español - call us anytime!' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="neu-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* Spanish Testimonial Highlight */}
                <div className="neu-lg p-6 rounded-neu-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">Miami, FL</span>
                  </div>
                  <p className="text-gray-700 italic mb-4">
                    &quot;¡El sistema en español es perfecto! Mis familias hispanas pueden usar el portal de padres sin problemas. El soporte CACFP nos ahorra horas cada mes.&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="neu w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-primary-400 to-primary-600">
                      R
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Rosa Martinez</p>
                      <p className="text-sm text-gray-500">Directora, Cariñitos Daycare</p>
                    </div>
                  </div>
                </div>

                {/* Language Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="neu-inset p-4 rounded-neu text-center">
                    <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">2</p>
                    <p className="text-sm text-gray-500">Languages</p>
                  </div>
                  <div className="neu-inset p-4 rounded-neu text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">40%+</p>
                    <p className="text-sm text-gray-500">Hispanic Families in FL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Screenshots Section */}
      <section id="screenshots" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-purple-600 mb-4">
              <Camera className="w-4 h-4" />
              See It In Action
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Beautiful, <span className="text-primary-500">Intuitive Interface</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed for busy childcare professionals - easy to learn, powerful to use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SYSTEM_SCREENSHOTS.map((screenshot, i) => (
              <div key={i} className="neu-lg rounded-neu-xl overflow-hidden group">
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  {/* Placeholder for screenshots - replace with actual images */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <div className="text-center p-8">
                      <div className="neu w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        {i === 0 && <BarChart3 className="w-10 h-10 text-primary-500" />}
                        {i === 1 && <UserCheck className="w-10 h-10 text-primary-500" />}
                        {i === 2 && <CreditCard className="w-10 h-10 text-primary-500" />}
                        {i === 3 && <MessageSquare className="w-10 h-10 text-primary-500" />}
                      </div>
                      <p className="text-primary-600 font-medium">{screenshot.title}</p>
                      <p className="text-primary-500/70 text-sm mt-1">Screenshot Preview</p>
                    </div>
                  </div>
                  {/* Uncomment when real images are available
                  <Image
                    src={screenshot.image}
                    alt={screenshot.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  */}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{screenshot.title}</h3>
                  <p className="text-gray-600">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="btn-neu-primary px-10 py-4 rounded-neu text-lg font-semibold inline-flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Try It Free - See For Yourself
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-gray-500">Full access to all features for 14 days</p>
          </div>
        </div>
      </section>

      {/* Expanded Features by Category */}
      <section id="all-features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-amber-600 mb-4">
              <Award className="w-4 h-4" />
              Complete Feature Set
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Everything Your Center <span className="text-primary-500">Needs to Succeed</span>
            </h2>
          </div>

          <div className="space-y-12">
            {EXPANDED_FEATURES.map((category, i) => (
              <div key={i}>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="neu-inset w-10 h-10 rounded-full flex items-center justify-center">
                    {i === 0 && <Shield className="w-5 h-5 text-primary-500" />}
                    {i === 1 && <BookOpen className="w-5 h-5 text-primary-500" />}
                    {i === 2 && <BarChart3 className="w-5 h-5 text-primary-500" />}
                  </span>
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.features.map((feature, j) => (
                    <div key={j} className="neu p-5 rounded-neu group hover:shadow-neu-lg transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="neu-inset w-10 h-10 rounded-neu-sm flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">{feature.title}</h4>
                          <p className="text-gray-500 text-xs mt-1">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Neumorphic */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-success mb-4">
              <CircleDollarSign className="w-4 h-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Plans That <span className="text-primary-500">Pay for Themselves</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Most centers save $500+/month in admin time alone.
            </p>

            {/* Urgency */}
            <div className="neu-inset px-6 py-3 rounded-neu-full inline-flex items-center gap-3 mb-8">
              <Gift className="w-5 h-5 text-primary-500" />
              <span className="text-gray-700">
                <strong>January Offer:</strong> First month <span className="text-primary-600 font-bold">50% OFF</span> + FREE onboarding
              </span>
            </div>

            {/* Billing Toggle - Neumorphic */}
            <div className="inline-flex neu-inset rounded-neu-full p-1.5">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-6 py-2.5 rounded-neu-full font-medium transition-all duration-300 ${
                  !billingAnnual ? 'neu text-primary-600' : 'text-gray-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-6 py-2.5 rounded-neu-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  billingAnnual ? 'neu text-primary-600' : 'text-gray-500'
                }`}
              >
                Annual
                <span className={`text-xs px-2 py-0.5 rounded-full ${billingAnnual ? 'bg-success/20 text-success' : 'bg-gray-200 text-gray-600'}`}>
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-neu-lg p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'neu-lg scale-105 shadow-neu-glow-primary'
                    : 'neu'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-6 py-1.5 rounded-neu-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <Star className="w-4 h-4 fill-white" />
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-800">
                      ${billingAnnual ? Math.round(plan.annual / 12) : plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  {billingAnnual && (
                    <p className="text-sm mt-1 text-success flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Billed ${plan.annual}/year (save ${(plan.price * 12) - plan.annual})
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Baby className="w-5 h-5 text-pink-500" />
                    Up to <strong>{plan.children}</strong> children
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5 text-primary-500" />
                    {plan.staff === 'Unlimited' ? <strong>Unlimited</strong> : `Up to ${plan.staff}`} staff
                  </div>
                  <div className="h-px bg-gray-300 my-4" />
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-success" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/register'}
                  className={`block w-full py-4 rounded-neu font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'btn-neu-primary'
                      : 'btn-neu'
                  }`}
                >
                  {plan.name === 'Enterprise' ? <Phone className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-12 text-center">
            <div className="neu-lg p-6 rounded-neu-xl inline-flex items-center gap-4 max-w-lg">
              <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800">30-Day Money Back Guarantee</h4>
                <p className="text-gray-600 text-sm">Not satisfied? Get a full refund, no questions asked.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Neumorphic */}
      <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-pink-600 mb-4">
              <Heart className="w-4 h-4" />
              Real Results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Loved by <span className="text-primary-500">127+ Florida Centers</span>
            </h2>
            <p className="text-xl text-gray-600">
              Don&apos;t take our word for it - see what owners say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className={`neu p-8 rounded-neu ${i === 1 ? 'md:scale-105 shadow-neu-lg' : ''}`}
              >
                {/* Results Badge */}
                <div className="bg-success/10 text-success px-4 py-2 rounded-neu-full text-sm font-bold mb-4 inline-flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {testimonial.savings}
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="neu w-14 h-14 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-primary-400 to-primary-600">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-primary-600 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Neumorphic */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 neu-sm px-5 py-2 rounded-neu-full text-sm font-medium text-purple-600 mb-4">
              <MessageSquare className="w-4 h-4" />
              Got Questions?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="neu rounded-neu overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="neu-inset w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="font-semibold text-gray-800 pr-4">{item.q}</span>
                  </div>
                  <div className={`neu-sm w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pl-20 text-gray-600">{item.a}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-12 text-center">
            <div className="neu-lg p-8 rounded-neu-xl">
              <Headphones className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Still Have Questions?</h3>
              <p className="text-gray-600 mb-4">Our Florida-based team is here to help!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+13212468614" className="btn-neu px-6 py-3 rounded-neu flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5 text-primary-500" />
                  (321) 246-8614
                </a>
                <a href="mailto:info@childcareai.com" className="btn-neu px-6 py-3 rounded-neu flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5 text-primary-500" />
                  info@childcareai.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Neumorphic */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="neu-xl p-8 lg:p-16 rounded-neu-xl text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              {/* Logo - Sin círculo */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <Image src={LOGO_URL} alt="ChildCare Pro" fill className="object-contain drop-shadow-lg" />
              </div>

              {/* Urgency */}
              <div className="bg-amber-100 text-amber-800 px-6 py-2 rounded-neu-full text-sm font-bold mb-6 inline-flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Only {spotsLeft} free onboarding spots left for January!
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                Ready to <span className="text-primary-500">Reclaim Your Time?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Join 127+ childcare centers in Florida who stopped drowning in paperwork and started focusing on what matters: <strong>the children</strong>.
              </p>
              <Link
                href="/register"
                className="btn-neu-primary px-12 py-5 rounded-neu text-xl font-bold inline-flex items-center gap-3 shadow-lg shadow-primary-500/30"
              >
                <Gift className="w-6 h-6" />
                Start Your FREE 14-Day Trial
                <ArrowRight className="w-6 h-6" />
              </Link>
              <p className="mt-6 text-gray-500 flex items-center justify-center gap-6 flex-wrap">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-success" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-success" />
                  Setup in 5 minutes
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-success" />
                  Cancel anytime
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Neumorphic */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="neu-lg rounded-neu-xl p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
              <div className="lg:col-span-1">
                <Link href="/" className="flex items-center gap-3 mb-6">
                  {/* Logo Footer - Mucho más grande */}
                  <div className="relative w-40 h-40">
                    <Image
                      src={LOGO_URL}
                      alt="ChildCare Pro"
                      fill
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                </Link>
                <p className="text-gray-600 mb-6">
                  The #1 childcare management software for Florida daycare centers.
                </p>
                <div className="flex gap-3">
                  {[
                    { icon: Phone, label: 'Call us' },
                    { icon: Mail, label: 'Email us' },
                    { icon: MapPin, label: 'Location' },
                  ].map((item, i) => (
                    <button key={i} className="neu-sm w-12 h-12 rounded-full flex items-center justify-center hover:shadow-neu transition-all">
                      <item.icon className="w-5 h-5 text-primary-500" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-6 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  Product
                </h4>
                <ul className="space-y-4 text-gray-600">
                  <li><a href="#features" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Features</a></li>
                  <li><a href="#pricing" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Pricing</a></li>
                  <li><Link href="/login" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Free Trial</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-6 text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-500" />
                  Company
                </h4>
                <ul className="space-y-4 text-gray-600">
                  <li><a href="#" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />About Us</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Contact</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Careers</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition flex items-center gap-2"><ArrowRight className="w-4 h-4" />Blog</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-6 text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  Serving Florida
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {CITIES.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/${city.slug}`}
                      className="text-gray-600 hover:text-primary-600 transition text-sm flex items-center gap-1"
                    >
                      <ChevronDown className="w-3 h-3 -rotate-90" />
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="neu-inset rounded-neu p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} ChildCare Pro. All rights reserved.
              </p>
              <div className="flex gap-8 text-sm text-gray-500">
                <a href="#" className="hover:text-primary-600 transition">Privacy Policy</a>
                <a href="#" className="hover:text-primary-600 transition">Terms of Service</a>
                <a href="#" className="hover:text-primary-600 transition">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}
