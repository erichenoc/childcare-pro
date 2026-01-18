'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Receipt,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  X,
} from 'lucide-react'
import {
  accountingService,
  type IncomeTransaction,
  type ExpenseTransaction,
  type AccountCategory,
  type IncomeSourceType,
  type ExpenseType,
} from '@/features/accounting/services/accounting.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'

type CombinedTransaction = (IncomeTransaction & { _type: 'income' }) | (ExpenseTransaction & { _type: 'expense' })

export default function TransactionsPage() {
  const [incomeTransactions, setIncomeTransactions] = useState<IncomeTransaction[]>([])
  const [expenseTransactions, setExpenseTransactions] = useState<ExpenseTransaction[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [selectedTransaction, setSelectedTransaction] = useState<CombinedTransaction | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const income = accountingService.getMockIncomeTransactions()
      const expenses = accountingService.getMockExpenseTransactions()
      const cats = accountingService.getMockAccountCategories()
      setIncomeTransactions(income)
      setExpenseTransactions(expenses)
      setCategories(cats)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Combine and filter transactions
  const allTransactions: CombinedTransaction[] = [
    ...incomeTransactions.map(t => ({ ...t, _type: 'income' as const })),
    ...expenseTransactions.map(t => ({ ...t, _type: 'expense' as const })),
  ]

  const filteredTransactions = allTransactions.filter(txn => {
    const searchString = txn._type === 'income'
      ? `${(txn as IncomeTransaction).payer_name || ''} ${txn.category_name} ${txn.description || ''}`
      : `${(txn as ExpenseTransaction).vendor_name} ${txn.category_name} ${txn.description || ''}`

    const matchesSearch = searchString.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || txn._type === filterType

    let matchesDate = true
    if (dateRange.start) {
      matchesDate = matchesDate && txn.date >= dateRange.start
    }
    if (dateRange.end) {
      matchesDate = matchesDate && txn.date <= dateRange.end
    }

    return matchesSearch && matchesType && matchesDate
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t._type === 'income')
    .reduce((sum, t) => sum + t.total_amount, 0)
  const totalExpenses = filteredTransactions
    .filter(t => t._type === 'expense')
    .reduce((sum, t) => sum + t.total_amount, 0)

  const getSourceTypeLabel = (txn: CombinedTransaction) => {
    if (txn._type === 'income') {
      const sourceLabels: Record<IncomeSourceType, string> = {
        tuition: 'Tuition',
        registration: 'Registro',
        late_fee: 'Multa',
        vpk: 'VPK',
        sr: 'School Readiness',
        food_program: 'Alimentación',
        other: 'Otro',
      }
      return sourceLabels[(txn as IncomeTransaction).source_type] || 'Otro'
    } else {
      const expenseLabels: Record<ExpenseType, string> = {
        payroll: 'Nómina',
        rent: 'Alquiler',
        utilities: 'Servicios',
        supplies: 'Suministros',
        food: 'Alimentación',
        insurance: 'Seguro',
        maintenance: 'Mantenimiento',
        other: 'Otro',
      }
      return expenseLabels[(txn as ExpenseTransaction).expense_type] || 'Otro'
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
            <p className="text-gray-500">
              {filteredTransactions.length} transacciones
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </GlassButton>
          <GlassButton>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
          </GlassButton>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              <p className="text-sm text-gray-500">Total Ingresos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-gray-500">Total Egresos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totalIncome - totalExpenses >= 0 ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              <Receipt className={`w-5 h-5 ${
                totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${
                totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
              <p className="text-sm text-gray-500">Balance</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard variant="clear" className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <GlassInput
              type="text"
              placeholder="Buscar por descripción, pagador o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <GlassSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="w-40"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </GlassSelect>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <GlassInput
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-36"
            />
            <span className="text-gray-400">-</span>
            <GlassInput
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-36"
            />
          </div>
        </div>
      </GlassCard>

      {/* Transactions Table */}
      <GlassCard>
        <GlassCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Categoría</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Monto</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((txn) => {
                  const isIncome = txn._type === 'income'
                  const displayName = isIncome
                    ? (txn as IncomeTransaction).payer_name || txn.category_name
                    : (txn as ExpenseTransaction).vendor_name

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(txn.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${
                            isIncome ? 'bg-green-100' : 'bg-red-100'
                          } flex items-center justify-center`}>
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{displayName}</span>
                            {txn.description && (
                              <p className="text-xs text-gray-500">{txn.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {txn.category_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {getSourceTypeLabel(txn)}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(txn.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          txn.status === 'void' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {txn.status === 'completed' ? 'Completada' :
                           txn.status === 'void' ? 'Anulada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(txn)}
                        >
                          <Eye className="w-4 h-4" />
                        </GlassButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay transacciones
              </h3>
              <p className="text-gray-500 mb-4">
                No se encontraron transacciones con los filtros aplicados.
              </p>
              <GlassButton variant="secondary" onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setDateRange({ start: '', end: '' })
              }}>
                Limpiar Filtros
              </GlassButton>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>Detalle de Transacción</GlassCardTitle>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                >
                  <X className="w-4 h-4" />
                </GlassButton>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction._type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedTransaction._type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Categoría</p>
                    <p className="font-medium">{selectedTransaction.category_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      selectedTransaction.status === 'void' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedTransaction.status === 'completed' ? 'Completada' :
                       selectedTransaction.status === 'void' ? 'Anulada' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {selectedTransaction._type === 'income' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Pagador</p>
                      <p className="font-medium">{(selectedTransaction as IncomeTransaction).payer_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fuente</p>
                      <p className="font-medium">{getSourceTypeLabel(selectedTransaction)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Método de Pago</p>
                      <p className="font-medium">{(selectedTransaction as IncomeTransaction).payment_method || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Proveedor</p>
                      <p className="font-medium">{(selectedTransaction as ExpenseTransaction).vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Gasto</p>
                      <p className="font-medium">{getSourceTypeLabel(selectedTransaction)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deducible de Impuestos</p>
                      <p className="font-medium">
                        {(selectedTransaction as ExpenseTransaction).is_tax_deductible ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTransaction.description && (
                  <div>
                    <p className="text-sm text-gray-500">Descripción</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                )}

                {/* Amount Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span>
                  </div>
                  {selectedTransaction.tax_amount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">Impuesto</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total</span>
                    <span className={`text-lg font-bold ${
                      selectedTransaction._type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(selectedTransaction.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Registrada el {formatDate(selectedTransaction.created_at)}
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
