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
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Niños y Familias',
    question: '¿Cómo registro un nuevo niño?',
    answer: 'Ve a la sección "Niños" en el menú lateral, haz clic en "Agregar Niño" y completa el formulario con la información requerida incluyendo datos de contacto de emergencia y autorizaciones.'
  },
  {
    category: 'Niños y Familias',
    question: '¿Cómo agrego una nueva familia?',
    answer: 'En la sección "Familias", haz clic en "Nueva Familia". Puedes agregar múltiples tutores y vincularlos con los niños registrados.'
  },
  {
    category: 'Asistencia',
    question: '¿Cómo funciona el registro de asistencia?',
    answer: 'En la sección "Asistencia" puedes registrar entradas y salidas de los niños. El sistema calcula automáticamente las horas de cuidado y verifica los ratios DCF en tiempo real.'
  },
  {
    category: 'Asistencia',
    question: '¿Qué son los ratios DCF?',
    answer: 'Los ratios DCF son las proporciones de personal por niños requeridas por el Departamento de Niños y Familias de Florida. El sistema monitorea estos ratios automáticamente y te alerta si hay incumplimiento.'
  },
  {
    category: 'Facturación',
    question: '¿Cómo genero una factura?',
    answer: 'Ve a "Facturación", selecciona la familia, el período de facturación y los servicios. Puedes enviar la factura por email o permitir el pago en línea con tarjeta.'
  },
  {
    category: 'Facturación',
    question: '¿Qué métodos de pago acepta el sistema?',
    answer: 'El sistema acepta pagos con tarjeta de crédito/débito a través de Stripe, y también puedes registrar pagos manuales (efectivo, cheque, transferencia).'
  },
  {
    category: 'Personal',
    question: '¿Cómo gestiono los horarios del personal?',
    answer: 'En la sección "Personal" puedes ver y editar los horarios de cada empleado, asignarlos a salones específicos y gestionar sus permisos de acceso.'
  },
  {
    category: 'Configuración',
    question: '¿Cómo cambio el idioma del sistema?',
    answer: 'Haz clic en el icono de idioma (globo) en la barra superior y selecciona entre Español e Inglés. Tu preferencia se guardará automáticamente.'
  },
]

const quickLinks = [
  { icon: Users, label: 'Gestión de Niños', href: '/dashboard/children', description: 'Registrar y administrar niños' },
  { icon: Calendar, label: 'Asistencia', href: '/dashboard/attendance', description: 'Control de entradas y salidas' },
  { icon: DollarSign, label: 'Facturación', href: '/dashboard/billing', description: 'Facturas y pagos' },
  { icon: ClipboardList, label: 'Reportes', href: '/dashboard/reports', description: 'Informes y estadísticas' },
  { icon: Shield, label: 'Ratios DCF', href: '/dashboard', description: 'Monitoreo de cumplimiento' },
  { icon: Settings, label: 'Configuración', href: '/dashboard/settings', description: 'Ajustes del sistema' },
]

export default function HelpPage() {
  const t = useTranslations()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...new Set(faqs.map(faq => faq.category))]

  const filteredFAQs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.nav.help}</h1>
        <p className="text-gray-500">Encuentra respuestas y recursos para usar ChildCare Pro</p>
      </div>

      {/* Quick Links */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-500" />
          Accesos Rápidos
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
          Preguntas Frecuentes
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Todas' : category}
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
          ¿Necesitas más ayuda?
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
              <p className="font-medium text-gray-800">Email</p>
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
              <p className="font-medium text-gray-800">Teléfono</p>
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
              <p className="font-medium text-gray-800">Documentación</p>
              <p className="text-sm text-gray-500">Guías completas</p>
            </div>
          </a>
        </div>
      </GlassCard>
    </div>
  )
}
