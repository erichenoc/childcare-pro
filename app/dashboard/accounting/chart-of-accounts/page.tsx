'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
} from 'lucide-react'
import {
  accountingService,
  type AccountCategory,
  type AccountCategoryType,
} from '@/features/accounting/services/accounting.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
} from '@/shared/components/ui'

const ACCOUNT_TYPE_INFO: Record<AccountCategoryType, { label: string; color: string; icon: React.ElementType }> = {
  asset: { label: 'Activo', color: 'bg-blue-100 text-blue-700', icon: Wallet },
  liability: { label: 'Pasivo', color: 'bg-orange-100 text-orange-700', icon: Building2 },
  income: { label: 'Ingreso', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  expense: { label: 'Gasto', color: 'bg-red-100 text-red-700', icon: TrendingDown },
}

export default function ChartOfAccountsPage() {
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<AccountCategoryType | 'all'>('all')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setIsLoading(true)
      // Use mock data for development
      const data = accountingService.getMockAccountCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading account categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.code?.includes(searchTerm) ?? false)
    const matchesType = filterType === 'all' || category.type === filterType
    return matchesSearch && matchesType
  })

  // Group by type
  const categoriesByType = filteredCategories.reduce((groups, category) => {
    const type = category.type
    if (!groups[type]) groups[type] = []
    groups[type].push(category)
    return groups
  }, {} as Record<AccountCategoryType, AccountCategory[]>)

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
          <Link href="/dashboard/accounting">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plan de Cuentas</h1>
            <p className="text-gray-500">
              {categories.length} categorías configuradas
            </p>
          </div>
        </div>
        <GlassButton>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </GlassButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['income', 'expense', 'asset', 'liability'] as AccountCategoryType[]).map((type) => {
          const info = ACCOUNT_TYPE_INFO[type]
          const Icon = info.icon
          const count = categoriesByType[type]?.length || 0

          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={`p-4 rounded-xl transition-all ${
                filterType === type
                  ? 'bg-primary-100 ring-2 ring-primary-500'
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${info.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{info.label}s</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{count} categorías</p>
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
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterType !== 'all' && (
            <GlassButton variant="secondary" onClick={() => setFilterType('all')}>
              Mostrar Todos
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Categories List by Type */}
      <div className="space-y-6">
        {(['income', 'expense', 'asset', 'liability'] as AccountCategoryType[]).map((type) => {
          const typeCategories = categoriesByType[type]
          if (!typeCategories || typeCategories.length === 0) return null
          if (filterType !== 'all' && filterType !== type) return null

          const info = ACCOUNT_TYPE_INFO[type]
          const Icon = info.icon

          return (
            <GlassCard key={type}>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${info.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <GlassCardTitle>{info.label}s</GlassCardTitle>
                      <p className="text-sm text-gray-500">
                        {typeCategories.length} categorías
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="divide-y divide-gray-100">
                  {typeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-gray-500 w-12">
                          {category.code || '-'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {category.is_tax_deductible && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            Deducible
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          )
        })}
      </div>

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <GlassCard variant="clear" className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron categorías
          </h3>
          <p className="text-gray-500 mb-4">
            No hay categorías que coincidan con tu búsqueda.
          </p>
          <GlassButton variant="secondary" onClick={() => {
            setSearchTerm('')
            setFilterType('all')
          }}>
            Limpiar Filtros
          </GlassButton>
        </GlassCard>
      )}
    </div>
  )
}
