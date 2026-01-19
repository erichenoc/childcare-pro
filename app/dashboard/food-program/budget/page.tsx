'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Plus,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Receipt,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import { foodProgramService } from '@/features/food-program/services/food-program.service'
import type { FoodBudgetSummary, FoodExpense, FoodExpenseFormData, FoodExpenseCategory, PaymentMethod } from '@/shared/types/food-program'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassBadge,
} from '@/shared/components/ui'

const EXPENSE_CATEGORIES: { value: FoodExpenseCategory; label: string }[] = [
  { value: 'groceries', label: 'Comestibles' },
  { value: 'dairy', label: 'Lácteos' },
  { value: 'produce', label: 'Frutas/Verduras' },
  { value: 'meat', label: 'Carnes' },
  { value: 'supplies', label: 'Suministros' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'account', label: 'Cuenta' },
]

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function BudgetPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [summary, setSummary] = useState<FoodBudgetSummary | null>(null)
  const [expenses, setExpenses] = useState<FoodExpense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FoodExpense | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Budget form state
  const [budgetAmount, setBudgetAmount] = useState<number>(0)
  const [budgetNotes, setBudgetNotes] = useState('')

  // Expense form state
  const [expenseForm, setExpenseForm] = useState<FoodExpenseFormData>({
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    category: 'groceries',
    amount: 0,
    tax_amount: 0,
  })

  useEffect(() => {
    loadData()
  }, [currentYear, currentMonth])

  async function loadData() {
    try {
      setIsLoading(true)
      setError(null)

      const [summaryData, expensesData] = await Promise.all([
        foodProgramService.getBudgetSummary(currentYear, currentMonth),
        foodProgramService.getExpenses(currentYear, currentMonth),
      ])

      setSummary(summaryData)
      setExpenses(expensesData)

      if (summaryData.budget) {
        setBudgetAmount(summaryData.budget.budgeted_amount)
        setBudgetNotes(summaryData.budget.notes || '')
      } else {
        setBudgetAmount(0)
        setBudgetNotes('')
      }
    } catch (err) {
      console.error('Error loading budget data:', err)
      setError('Error al cargar datos del presupuesto')
    } finally {
      setIsLoading(false)
    }
  }

  function navigateMonth(delta: number) {
    let newMonth = currentMonth + delta
    let newYear = currentYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  function resetExpenseForm() {
    setExpenseForm({
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      category: 'groceries',
      amount: 0,
      tax_amount: 0,
    })
    setEditingExpense(null)
    setShowExpenseForm(false)
  }

  function handleEditExpense(expense: FoodExpense) {
    setExpenseForm({
      expense_date: expense.expense_date,
      vendor: expense.vendor,
      description: expense.description || undefined,
      category: expense.category,
      amount: expense.amount,
      tax_amount: expense.tax_amount,
      payment_method: expense.payment_method || undefined,
      receipt_url: expense.receipt_url || undefined,
    })
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await foodProgramService.setBudget({
        year: currentYear,
        month: currentMonth,
        budgeted_amount: budgetAmount,
        notes: budgetNotes || undefined,
      })

      setSuccess('Presupuesto guardado exitosamente')
      setShowBudgetForm(false)
      await loadData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving budget:', err)
      setError('Error al guardar presupuesto')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (editingExpense) {
        await foodProgramService.updateExpense(editingExpense.id, expenseForm)
        setSuccess('Gasto actualizado exitosamente')
      } else {
        await foodProgramService.createExpense(expenseForm)
        setSuccess('Gasto registrado exitosamente')
      }

      resetExpenseForm()
      await loadData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving expense:', err)
      setError('Error al guardar gasto')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return

    try {
      await foodProgramService.deleteExpense(id)
      setSuccess('Gasto eliminado')
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError('Error al eliminar gasto')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getPaymentLabel = (method: string | null) => {
    if (!method) return '-'
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method
  }

  const budgetPercentUsed = summary?.budget
    ? (summary.total_spent / summary.budget.budgeted_amount) * 100
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/food-program">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-primary-600" />
              Presupuesto y Gastos
            </h1>
            <p className="text-gray-500">Control de costos de alimentos</p>
          </div>
        </div>

        <GlassButton variant="primary" onClick={() => setShowExpenseForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Gasto
        </GlassButton>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Month Navigation */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex items-center justify-between">
            <GlassButton variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </GlassButton>

            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900">
                {MONTHS[currentMonth - 1]} {currentYear}
              </span>
            </div>

            <GlassButton variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </GlassButton>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget Card */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Presupuesto del Mes
              </GlassCardTitle>
              <GlassButton variant="ghost" size="sm" onClick={() => setShowBudgetForm(true)}>
                <Edit2 className="w-4 h-4" />
              </GlassButton>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {summary?.budget ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(summary.budget.budgeted_amount)}
                    </p>
                    <p className="text-sm text-blue-700">Presupuestado</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(summary.total_spent)}
                    </p>
                    <p className="text-sm text-amber-700">Gastado</p>
                  </div>
                  <div className={`text-center p-4 rounded-xl ${summary.remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-2xl font-bold ${summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(summary.remaining))}
                    </p>
                    <p className={`text-sm ${summary.remaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {summary.remaining >= 0 ? 'Disponible' : 'Excedido'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Uso del presupuesto</span>
                    <span className={`font-medium ${budgetPercentUsed > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                      {budgetPercentUsed.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        budgetPercentUsed > 100 ? 'bg-red-500' :
                        budgetPercentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, budgetPercentUsed)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay presupuesto definido para este mes</p>
                <GlassButton variant="primary" onClick={() => setShowBudgetForm(true)}>
                  Definir Presupuesto
                </GlassButton>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Category Breakdown */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Por Categoría</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {summary?.categories_breakdown && summary.categories_breakdown.length > 0 ? (
              <div className="space-y-3">
                {summary.categories_breakdown.map(({ category, amount, percentage }) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{getCategoryLabel(category)}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Sin gastos registrados</p>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Definir Presupuesto</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <GlassInput
                label={`Presupuesto para ${MONTHS[currentMonth - 1]} ${currentYear} *`}
                type="number"
                min="0"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                required
              />

              <GlassInput
                label="Notas"
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <GlassButton type="button" variant="ghost" onClick={() => setShowBudgetForm(false)}>
                  Cancelar
                </GlassButton>
                <GlassButton type="submit" variant="primary" isLoading={isSaving}>
                  Guardar Presupuesto
                </GlassButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Expense Form */}
      {showExpenseForm && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              {editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <GlassInput
                  label="Fecha *"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  required
                />

                <GlassInput
                  label="Proveedor *"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  required
                />

                <GlassSelect
                  label="Categoría *"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as FoodExpenseCategory })}
                  options={EXPENSE_CATEGORIES}
                />

                <GlassInput
                  label="Monto *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  required
                />

                <GlassInput
                  label="Impuesto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.tax_amount || 0}
                  onChange={(e) => setExpenseForm({ ...expenseForm, tax_amount: parseFloat(e.target.value) || 0 })}
                />

                <GlassSelect
                  label="Método de Pago"
                  value={expenseForm.payment_method || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: (e.target.value || undefined) as PaymentMethod | undefined })}
                  options={[{ value: '', label: 'Seleccionar...' }, ...PAYMENT_METHODS]}
                />

                <div className="md:col-span-2 lg:col-span-3">
                  <GlassInput
                    label="Descripción"
                    value={expenseForm.description || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <GlassButton type="button" variant="ghost" onClick={resetExpenseForm}>
                  Cancelar
                </GlassButton>
                <GlassButton type="submit" variant="primary" isLoading={isSaving}>
                  {editingExpense ? 'Actualizar' : 'Registrar'}
                </GlassButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Expenses Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Gastos del Mes ({expenses.length})
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Impuesto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pago</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No hay gastos registrados este mes
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {expense.expense_date}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{expense.vendor}</p>
                          {expense.description && (
                            <p className="text-xs text-gray-500">{expense.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <GlassBadge variant="secondary">
                          {getCategoryLabel(expense.category)}
                        </GlassBadge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCurrency(expense.tax_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(expense.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {getPaymentLabel(expense.payment_method)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-700">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(expenses.reduce((sum, e) => sum + e.total_amount, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
