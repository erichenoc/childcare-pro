'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  DollarSign,
  ClipboardList,
  Shield,
  Settings
} from 'lucide-react'
import { GlassCard } from '@/shared/components/ui'
import { useTranslations } from '@/shared/lib/i18n'

interface FAQItem {
  questionKey: string
  answerKey: string
  categoryKey: string
}

const faqKeys: FAQItem[] = [
  { categoryKey: 'childrenAndFamilies', questionKey: 'faqRegisterChild', answerKey: 'faqRegisterChildAnswer' },
  { categoryKey: 'childrenAndFamilies', questionKey: 'faqAddFamily', answerKey: 'faqAddFamilyAnswer' },
  { categoryKey: 'attendanceCategory', questionKey: 'faqAttendanceHow', answerKey: 'faqAttendanceHowAnswer' },
  { categoryKey: 'attendanceCategory', questionKey: 'faqDcfRatios', answerKey: 'faqDcfRatiosAnswer' },
  { categoryKey: 'billingCategory', questionKey: 'faqGenerateInvoice', answerKey: 'faqGenerateInvoiceAnswer' },
  { categoryKey: 'billingCategory', questionKey: 'faqPaymentMethods', answerKey: 'faqPaymentMethodsAnswer' },
  { categoryKey: 'staffCategory', questionKey: 'faqStaffSchedules', answerKey: 'faqStaffSchedulesAnswer' },
  { categoryKey: 'settingsCategory', questionKey: 'faqChangeLanguage', answerKey: 'faqChangeLanguageAnswer' },
]

interface QuickLinkItem {
  icon: React.ElementType
  labelKey: string
  href: string
  descKey: string
}

export default function HelpPage() {
  const t = useTranslations()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Build FAQs with translations
  const faqs = faqKeys.map(item => ({
    category: t.help[item.categoryKey as keyof typeof t.help] as string,
    question: t.help[item.questionKey as keyof typeof t.help] as string,
    answer: t.help[item.answerKey as keyof typeof t.help] as string,
    categoryKey: item.categoryKey,
  }))

  // Quick links with translations
  const quickLinks = [
    { icon: Users, label: t.nav.children, href: '/dashboard/children', description: t.children.subtitle },
    { icon: Calendar, label: t.nav.attendance, href: '/dashboard/attendance', description: t.attendance.subtitle },
    { icon: DollarSign, label: t.nav.billing, href: '/dashboard/billing', description: t.billing.subtitle },
    { icon: ClipboardList, label: t.nav.reports, href: '/dashboard/reports', description: t.reports.subtitle },
    { icon: Shield, label: t.dcfRatios.title, href: '/dashboard', description: t.dcfRatios.complianceStatus },
    { icon: Settings, label: t.nav.settings, href: '/dashboard/settings', description: t.settings.subtitle },
  ]

  const categoryKeys = ['all', ...new Set(faqKeys.map(faq => faq.categoryKey))]
  const getCategoryLabel = (key: string) => {
    if (key === 'all') return t.help.allCategories
    return t.help[key as keyof typeof t.help] as string
  }

  const filteredFAQs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.categoryKey === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.help.title}</h1>
        <p className="text-gray-500">{t.help.subtitle}</p>
      </div>

      {/* Quick Links */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-500" />
          {t.help.quickLinks}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center p-4 rounded-xl hover:bg-blue-50 transition-colors text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                <link.icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">{link.label}</span>
              <span className="text-xs text-gray-500 mt-1">{link.description}</span>
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* FAQ Section */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          {t.help.faqTitle}
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryKeys.map((categoryKey) => (
            <button
              key={categoryKey}
              onClick={() => setSelectedCategory(categoryKey)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === categoryKey
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(categoryKey)}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="text-xs text-blue-600 font-medium">{faq.category}</span>
                  <p className="font-medium text-gray-800">{faq.question}</p>
                </div>
                {expandedFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedFAQ === index && (
                <div className="px-4 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Contact Section */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          {t.help.needMoreHelp}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="mailto:soporte@childcarepro.com"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{t.help.contactEmail}</p>
              <p className="text-sm text-gray-500">soporte@childcarepro.com</p>
            </div>
          </a>
          <a
            href="tel:+18005551234"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{t.help.contactPhone}</p>
              <p className="text-sm text-gray-500">1-800-555-1234</p>
            </div>
          </a>
          <a
            href="https://docs.childcarepro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{t.help.documentation}</p>
              <p className="text-sm text-gray-500">{t.help.completeGuides}</p>
            </div>
          </a>
        </div>
      </GlassCard>
    </div>
  )
}
