'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  Bell,
  CreditCard,
  AlertTriangle,
  Clock,
  Megaphone,
  ShieldAlert,
  Edit,
  Trash2,
  Loader2,
  Eye,
  Copy,
} from 'lucide-react'
import {
  notificationsService,
  type NotificationTemplate,
  type TemplateCategory,
} from '@/features/notifications/services/notifications.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassModal,
} from '@/shared/components/ui'

const CATEGORY_INFO: Record<TemplateCategory, { label: string; color: string; icon: React.ElementType }> = {
  attendance: { label: 'Asistencia', color: 'bg-blue-100 text-blue-700', icon: Bell },
  billing: { label: 'Facturación', color: 'bg-green-100 text-green-700', icon: CreditCard },
  incident: { label: 'Incidentes', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  announcement: { label: 'Anuncios', color: 'bg-purple-100 text-purple-700', icon: Megaphone },
  reminder: { label: 'Recordatorios', color: 'bg-orange-100 text-orange-700', icon: Clock },
  emergency: { label: 'Emergencias', color: 'bg-rose-100 text-rose-700', icon: ShieldAlert },
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      setIsLoading(true)
      const data = notificationsService.getMockTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Group by category
  const templatesByCategory = filteredTemplates.reduce((groups, template) => {
    const category = template.category
    if (!groups[category]) groups[category] = []
    groups[category].push(template)
    return groups
  }, {} as Record<TemplateCategory, NotificationTemplate[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plantillas de Notificación</h1>
            <p className="text-gray-500">
              {templates.length} plantillas disponibles
            </p>
          </div>
        </div>
        <GlassButton>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </GlassButton>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(['attendance', 'billing', 'incident', 'announcement', 'reminder', 'emergency'] as TemplateCategory[]).map((category) => {
          const info = CATEGORY_INFO[category]
          const Icon = info.icon
          const count = templates.filter(t => t.category === category).length

          return (
            <button
              key={category}
              onClick={() => setFilterCategory(filterCategory === category ? 'all' : category)}
              className={`p-4 rounded-xl transition-all ${
                filterCategory === category
                  ? 'bg-primary-100 ring-2 ring-primary-500'
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm`}
            >
              <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-900 text-center">{info.label}</p>
              <p className="text-xs text-gray-500 text-center">{count} plantillas</p>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <GlassCard variant="clear" className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <GlassInput
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterCategory !== 'all' && (
            <GlassButton variant="secondary" onClick={() => setFilterCategory('all')}>
              Mostrar Todas
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Templates List */}
      <div className="space-y-6">
        {(['attendance', 'billing', 'incident', 'announcement', 'reminder', 'emergency'] as TemplateCategory[]).map((category) => {
          const categoryTemplates = templatesByCategory[category]
          if (!categoryTemplates || categoryTemplates.length === 0) return null
          if (filterCategory !== 'all' && filterCategory !== category) return null

          const info = CATEGORY_INFO[category]
          const Icon = info.icon

          return (
            <GlassCard key={category}>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${info.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <GlassCardTitle>{info.label}</GlassCardTitle>
                    <p className="text-sm text-gray-500">
                      {categoryTemplates.length} plantillas
                    </p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          {!template.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 truncate">{template.subject}</p>
                        {template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map(variable => (
                              <span
                                key={variable}
                                className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template)
                            setShowPreview(true)
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Vista previa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link href={`/dashboard/notifications/new?template=${template.id}`}>
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Usar plantilla"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          )
        })}

        {filteredTemplates.length === 0 && (
          <GlassCard variant="clear" className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron plantillas
            </h3>
            <p className="text-gray-500 mb-4">
              No hay plantillas que coincidan con tu búsqueda.
            </p>
            <GlassButton variant="secondary" onClick={() => {
              setSearchTerm('')
              setFilterCategory('all')
            }}>
              Limpiar Filtros
            </GlassButton>
          </GlassCard>
        )}
      </div>

      {/* Preview Modal */}
      <GlassModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de Plantilla"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre</label>
              <p className="font-medium text-gray-900">{selectedTemplate.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Categoría</label>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${CATEGORY_INFO[selectedTemplate.category].color}`}>
                {CATEGORY_INFO[selectedTemplate.category].label}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Asunto</label>
              <div className="p-3 rounded-lg bg-gray-50 font-mono text-sm">
                {selectedTemplate.subject}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Mensaje</label>
              <div className="p-3 rounded-lg bg-gray-50 font-mono text-sm whitespace-pre-wrap">
                {selectedTemplate.body}
              </div>
            </div>
            {selectedTemplate.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Variables Disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(variable => (
                    <code
                      key={variable}
                      className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm"
                    >
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <GlassButton variant="secondary" onClick={() => setShowPreview(false)}>
                Cerrar
              </GlassButton>
              <Link href={`/dashboard/notifications/new?template=${selectedTemplate.id}`}>
                <GlassButton onClick={() => setShowPreview(false)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Usar Plantilla
                </GlassButton>
              </Link>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  )
}
