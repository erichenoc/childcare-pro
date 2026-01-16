'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Shield,
  MessageSquare,
  BarChart3,
  Smartphone,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
  ChevronDown,
  Baby,
  GraduationCap,
  Building2,
  Zap,
  Heart,
  FileText,
  Bell,
  Calendar,
  CreditCard,
  UserCheck,
  AlertTriangle,
} from 'lucide-react'
import { AIChatWidget } from './components/AIChatWidget'

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

const FEATURES = [
  {
    icon: UserCheck,
    title: 'Easy Check-In/Out',
    description: 'Digital kiosk mode for fast, contactless check-ins. Parents sign with their phone.',
  },
  {
    icon: CreditCard,
    title: 'Automated Billing',
    description: 'Generate invoices, process payments with Stripe, and track balances automatically.',
  },
  {
    icon: Shield,
    title: 'DCF Compliance',
    description: 'Real-time ratio monitoring ensures you always meet Florida DCF requirements.',
  },
  {
    icon: MessageSquare,
    title: 'Parent Communication',
    description: 'Send updates, photos, and daily reports directly to parents in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Track attendance trends, revenue, and staff performance with visual dashboards.',
  },
  {
    icon: Bell,
    title: 'Incident Tracking',
    description: 'Document and report incidents with photos, timestamps, and parent notifications.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Maria Rodriguez',
    role: 'Owner, Little Stars Daycare',
    location: 'Orlando, FL',
    quote: 'ChildCare Pro saved us 10 hours a week on paperwork. The DCF ratio tracking gives me peace of mind.',
    rating: 5,
  },
  {
    name: 'Jennifer Williams',
    role: 'Director, Sunshine Academy',
    location: 'Kissimmee, FL',
    quote: 'Parents love the daily reports and photos. Our enrollment increased 30% since we started using it.',
    rating: 5,
  },
  {
    name: 'David Chen',
    role: 'Owner, Growing Minds Preschool',
    location: 'Winter Park, FL',
    quote: 'The billing automation alone pays for itself. No more chasing payments or manual invoices.',
    rating: 5,
  },
]

const FAQ = [
  {
    q: 'Is ChildCare Pro DCF compliant?',
    a: 'Yes! Our software is designed specifically for Florida childcare centers and includes real-time DCF ratio monitoring, compliance reporting, and all documentation features required by Florida regulations.',
  },
  {
    q: 'How long is the free trial?',
    a: 'You get 14 days to try all features with no credit card required. If you love it (and you will), simply choose a plan to continue.',
  },
  {
    q: 'Can I import my existing data?',
    a: 'Absolutely! Our onboarding team will help you migrate all your children, families, and staff data. Enterprise plans include dedicated migration support.',
  },
  {
    q: 'Is there a contract?',
    a: 'No long-term contracts. Pay monthly and cancel anytime. Annual plans save you 2 months free.',
  },
  {
    q: 'Do parents need to download an app?',
    a: 'No app download required! Parents access everything through a mobile-friendly web portal. They can check updates, pay invoices, and communicate with staff from any device.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards through Stripe. For billing parents, you can enable credit cards, ACH transfers, or record manual payments like cash and checks.',
  },
]

const CITIES = [
  'Orlando', 'Kissimmee', 'Sanford', 'Winter Park', 'Altamonte Springs',
  'Ocoee', 'Winter Garden', 'Clermont', 'Apopka', 'Lake Mary', 'Deltona', 'Daytona Beach',
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ChildCare Pro</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Reviews</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-600 py-2">Features</a>
              <a href="#pricing" className="text-gray-600 py-2">Pricing</a>
              <a href="#testimonials" className="text-gray-600 py-2">Reviews</a>
              <a href="#faq" className="text-gray-600 py-2">FAQ</a>
              <hr className="my-2" />
              <Link href="/login" className="text-gray-600 py-2">Sign In</Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium text-center"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              DCF Compliant Software for Florida Childcare Centers
            </div>

            {/* Main Headline - Pain Point */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Stop Drowning in{' '}
              <span className="text-red-500">Paperwork</span>
              <br />
              <span className="text-blue-600">Run Your Daycare Smarter</span>
            </h1>

            {/* Subheadline - Solution */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The all-in-one childcare management software that automates billing, tracks DCF ratios in real-time, and keeps parents happy with instant updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300 transition flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Hero Image/Screenshot */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-1 shadow-2xl shadow-blue-500/20">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center text-gray-400 text-sm">
                    childcarepro.com/dashboard
                  </div>
                </div>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Dashboard Preview</p>
                    <p className="text-gray-400 text-sm">Your childcare center at a glance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                  <p className="text-sm text-gray-500">Centers Using</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/3 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Baby className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">5,400+</p>
                  <p className="text-sm text-gray-500">Children Managed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Running a Daycare Shouldn&apos;t Be This Hard
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              If you&apos;re spending more time on admin than with children, something is broken.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hours Lost to Paperwork</h3>
              <p className="text-gray-600">
                Attendance sheets, billing spreadsheets, parent updates... You didn&apos;t open a daycare to do data entry.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-orange-100">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DCF Compliance Anxiety</h3>
              <p className="text-gray-600">
                Manually tracking ratios is stressful. One mistake during an inspection can cost you your license.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-yellow-100">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chasing Payments</h3>
              <p className="text-gray-600">
                Late payments, missing invoices, awkward conversations with parents. Cash flow chaos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Center
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for Florida childcare providers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                  <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Feature CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              See All Features in Action
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Start free for 14 days. No credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white rounded-full p-1 border border-gray-200">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  !billingAnnual ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  billingAnnual ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Annual
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 2 months
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-xl scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">
                      ${billingAnnual ? Math.round(plan.annual / 12) : plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  {billingAnnual && (
                    <p className="text-sm text-green-600 mt-1">
                      Billed ${plan.annual}/year
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Baby className="w-5 h-5 text-blue-500" />
                    Up to {plan.children} children
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5 text-blue-500" />
                    Up to {plan.staff} staff members
                  </div>
                  <hr />
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/register'}
                  className={`block w-full py-4 rounded-xl font-semibold text-center transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Childcare Centers Across Florida
            </h2>
            <p className="text-xl text-gray-600">
              See why daycare owners choose ChildCare Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-blue-600">{testimonial.location}</p>
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
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Childcare Center?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 127+ childcare centers in Florida who have simplified their operations with ChildCare Pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition shadow-xl flex items-center justify-center gap-2"
            >
              Start Your 14-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-4 text-blue-200 text-sm">
            No credit card required. Setup in under 5 minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Baby className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ChildCare Pro</span>
              </div>
              <p className="text-gray-400">
                The #1 childcare management software for Florida daycare centers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Serving Florida</h4>
              <div className="flex flex-wrap gap-2">
                {CITIES.slice(0, 6).map((city) => (
                  <span key={city} className="text-sm text-gray-400">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} ChildCare Pro. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}
