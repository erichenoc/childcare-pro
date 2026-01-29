'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BookOpen,
  Receipt,
  BarChart3,
  Loader2,
  Calculator,
  Sun,
} from 'lucide-react'
import {
  accountingService,
  type MonthlyPnL,
  type IncomeTransaction,
  type ExpenseTransaction,
  type AccountCategory,
} from '@/features/accounting/services/accounting.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
} from '@/shared/components/ui'
import { useTranslations } from '@/shared/lib/i18n'

export default function AccountingDashboardPage() {
  const t = useTranslations()
  const [monthlyPnL, setMonthlyPnL] = useState<MonthlyPnL | null>(null)
  const [recentIncome, setRecentIncome] = useState<IncomeTransaction[]>([])
  const [recentExpenses, setRecentExpenses] = useState<ExpenseTransaction[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [dashboardStats, setDashboardStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    pendingReceivables: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      // Use mock data for development
      const pnl = accountingService.getMockMonthlyPnL()
      const income = accountingService.getMockIncomeTransactions()
      const expenses = accountingService.getMockExpenseTransactions()
      const cats = accountingService.getMockAccountCategories()
      const stats = accountingService.getMockDashboardStats()

      setMonthlyPnL(pnl)
      setRecentIncome(income.slice(0, 3))
      setRecentExpenses(expenses.slice(0, 3))
      setCategories(cats)
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error loading accounting data:', error)
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

  // Combine recent transactions for display
  const recentTransactions = [
    ...recentIncome.map(t => ({ ...t, _type: 'income' as const })),
    ...recentExpenses.map(t => ({ ...t, _type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.accounting.title}</h1>
          <p className="text-gray-500">
            {t.accounting.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/accounting/transactions">
            <GlassButton variant="secondary">
              <Receipt className="w-4 h-4 mr-2" />
              {t.accounting.recordTransaction}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.monthlyIncome)}</p>
              <p className="text-sm text-gray-500">{t.accounting.income}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.monthlyExpenses)}</p>
              <p className="text-sm text-gray-500">{t.accounting.expenses}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.pendingReceivables)}</p>
              <p className="text-sm text-gray-500">{t.accounting.accountsReceivable}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              dashboardStats.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                dashboardStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                dashboardStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(dashboardStats.netProfit)}
              </p>
              <p className="text-sm text-gray-500">{t.accounting.netProfit}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Income Statement Summary */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <GlassCardTitle>{t.accounting.generalBalance}</GlassCardTitle>
                    <p className="text-sm text-gray-500">{t.dashboard.thisMonth}</p>
                  </div>
                </div>
                <Link href="/dashboard/accounting/reports">
                  <GlassButton variant="ghost" size="sm">
                    {t.common.view}
                  </GlassButton>
                </Link>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              {monthlyPnL && (
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        {t.accounting.income}
                      </h3>
                      <span className="font-bold text-green-600">
                        {formatCurrency(monthlyPnL.total_income)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {monthlyPnL.income_by_category.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                        >
                          <span className="text-sm text-gray-600">
                            {item.category}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        {t.accounting.expenses}
                      </h3>
                      <span className="font-bold text-red-600">
                        {formatCurrency(monthlyPnL.total_expenses)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {monthlyPnL.expenses_by_category.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                        >
                          <span className="text-sm text-gray-600">
                            {item.category}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        {t.accounting.netProfit}
                      </span>
                      <span className={`text-xl font-bold ${
                        monthlyPnL.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(monthlyPnL.net_profit)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Margen de ganancia: {monthlyPnL.profit_margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Recent Transactions */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <GlassCardTitle>{t.accounting.recentTransactions}</GlassCardTitle>
                </div>
                <Link href="/dashboard/accounting/transactions">
                  <GlassButton variant="ghost" size="sm">
                    {t.common.view}
                  </GlassButton>
                </Link>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {recentTransactions.map((txn) => {
                  const isIncome = txn._type === 'income'
                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isIncome ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isIncome
                              ? (txn as IncomeTransaction).payer_name || txn.category_name
                              : (txn as ExpenseTransaction).vendor_name
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(txn.date)} • {txn.category_name}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(txn.total_amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.quickActions}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-5">
              <div className="flex flex-col gap-4">
                <Link href="/dashboard/accounting/program-income" className="block">
                  <GlassButton variant="primary" className="w-full justify-start py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Calculator className="w-4 h-4 mr-2" />
                    Ingresos por Programa
                  </GlassButton>
                </Link>
                <Link href="/dashboard/accounting/summer-camp" className="block">
                  <GlassButton variant="secondary" className="w-full justify-start py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600">
                    <Sun className="w-4 h-4 mr-2" />
                    Summer Camp
                  </GlassButton>
                </Link>
                <Link href="/dashboard/accounting/transactions" className="block">
                  <GlassButton variant="secondary" className="w-full justify-start py-3">
                    <Receipt className="w-4 h-4 mr-2" />
                    {t.accounting.recordTransaction}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/accounting/chart-of-accounts" className="block">
                  <GlassButton variant="secondary" className="w-full justify-start py-3">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t.accounting.chartOfAccounts}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/accounting/reports" className="block">
                  <GlassButton variant="secondary" className="w-full justify-start py-3">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t.accounting.financialReports}
                  </GlassButton>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Account Types Summary */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.reports.summary}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <span className="text-sm font-medium text-green-700">{t.accounting.income}</span>
                  <span className="font-semibold text-green-800">
                    {formatCurrency(dashboardStats.monthlyIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                  <span className="text-sm font-medium text-red-700">{t.accounting.expenses}</span>
                  <span className="font-semibold text-red-800">
                    {formatCurrency(dashboardStats.monthlyExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm font-medium text-blue-700">{t.accounting.accountsReceivable}</span>
                  <span className="font-semibold text-blue-800">
                    {formatCurrency(dashboardStats.pendingReceivables)}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  dashboardStats.netProfit >= 0 ? 'bg-emerald-50' : 'bg-amber-50'
                }`}>
                  <span className={`text-sm font-medium ${
                    dashboardStats.netProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>{t.accounting.netProfit}</span>
                  <span className={`font-semibold ${
                    dashboardStats.netProfit >= 0 ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {formatCurrency(dashboardStats.netProfit)}
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Financial Tips */}
          <GlassCard variant="clear" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tip: Reconciliación</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Recuerda reconciliar tus cuentas bancarias al menos una vez por semana
                  para mantener registros precisos.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
