'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  PieChart,
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Wallet,
} from 'lucide-react'
import {
  accountingService,
  type IncomeStatement,
  type BalanceSheet,
} from '@/features/accounting/services/accounting.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassSelect,
} from '@/shared/components/ui'

type ReportType = 'income-statement' | 'balance-sheet'

export default function FinancialReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('income-statement')
  const [period, setPeriod] = useState<string>('this-month')
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    try {
      setIsLoading(true)
      // Use mock data for development
      const statement = accountingService.getMockIncomeStatement()
      setIncomeStatement(statement)
    } catch (error) {
      console.error('Error loading report data:', error)
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Mock balance sheet data
  const balanceSheet: BalanceSheet = {
    as_of_date: new Date().toISOString().split('T')[0],
    assets: {
      accounts: [
        { account_id: '1', account_number: '1000', account_name: 'Cash', account_type: 'asset', opening_balance: 0, debits: 0, credits: 0, closing_balance: 5250 },
        { account_id: '2', account_number: '1010', account_name: 'Checking Account', account_type: 'asset', opening_balance: 0, debits: 0, credits: 0, closing_balance: 40000 },
        { account_id: '3', account_number: '1100', account_name: 'Accounts Receivable', account_type: 'asset', opening_balance: 0, debits: 0, credits: 0, closing_balance: 8750 },
        { account_id: '4', account_number: '1500', account_name: 'Equipment', account_type: 'asset', opening_balance: 0, debits: 0, credits: 0, closing_balance: 15000 },
      ],
      total: 69000,
    },
    liabilities: {
      accounts: [
        { account_id: '5', account_number: '2000', account_name: 'Accounts Payable', account_type: 'liability', opening_balance: 0, debits: 0, credits: 0, closing_balance: 2300 },
        { account_id: '6', account_number: '2100', account_name: 'Deferred Revenue', account_type: 'liability', opening_balance: 0, debits: 0, credits: 0, closing_balance: 4500 },
        { account_id: '7', account_number: '2200', account_name: 'Payroll Liabilities', account_type: 'liability', opening_balance: 0, debits: 0, credits: 0, closing_balance: 3200 },
      ],
      total: 10000,
    },
    equity: {
      accounts: [
        { account_id: '8', account_number: '3000', account_name: 'Owner\'s Equity', account_type: 'equity', opening_balance: 0, debits: 0, credits: 0, closing_balance: 50000 },
        { account_id: '9', account_number: '3100', account_name: 'Retained Earnings', account_type: 'equity', opening_balance: 0, debits: 0, credits: 0, closing_balance: 9000 },
      ],
      total: 59000,
    },
  }

  // Calculate percentages for visual indicators
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
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
            <h1 className="text-2xl font-bold text-gray-900">Reportes Financieros</h1>
            <p className="text-gray-500">
              Análisis financiero del centro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </GlassButton>
        </div>
      </div>

      {/* Report Selection */}
      <GlassCard variant="clear" className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <GlassButton
              variant={reportType === 'income-statement' ? 'primary' : 'secondary'}
              onClick={() => setReportType('income-statement')}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Estado de Resultados
            </GlassButton>
            <GlassButton
              variant={reportType === 'balance-sheet' ? 'primary' : 'secondary'}
              onClick={() => setReportType('balance-sheet')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Balance General
            </GlassButton>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-gray-400" />
            <GlassSelect
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-48"
            >
              <option value="this-month">Este Mes</option>
              <option value="last-month">Mes Pasado</option>
              <option value="this-quarter">Este Trimestre</option>
              <option value="this-year">Este Año</option>
            </GlassSelect>
          </div>
        </div>
      </GlassCard>

      {/* Income Statement */}
      {reportType === 'income-statement' && incomeStatement && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Report */}
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle>Estado de Resultados</GlassCardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDate(incomeStatement.period_start)} - {formatDate(incomeStatement.period_end)}
                    </p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-8">
                  {/* Revenue Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        INGRESOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {incomeStatement.revenue.accounts.map((account) => (
                        <div
                          key={account.account_id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-600">
                            {account.account_number} - {account.account_name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Ingresos</span>
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(incomeStatement.revenue.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        GASTOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {incomeStatement.expenses.accounts.map((account) => (
                        <div
                          key={account.account_id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-600">
                            {account.account_number} - {account.account_name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Gastos</span>
                        <span className="font-bold text-red-600 text-lg">
                          {formatCurrency(incomeStatement.expenses.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="pt-4 border-t-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        UTILIDAD NETA
                      </span>
                      <span className={`text-2xl font-bold ${
                        incomeStatement.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(incomeStatement.net_income)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Profit Margin */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Margen de Utilidad</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${
                    incomeStatement.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {calculatePercentage(incomeStatement.net_income, incomeStatement.revenue.total)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Utilidad / Ingresos
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Top Revenue Sources */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Principales Ingresos</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {incomeStatement.revenue.accounts
                    .sort((a, b) => b.closing_balance - a.closing_balance)
                    .slice(0, 3)
                    .map((account, index) => (
                      <div key={account.account_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{account.account_name}</span>
                          <span className="text-sm font-medium">
                            {calculatePercentage(account.closing_balance, incomeStatement.revenue.total)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-green-500' :
                              index === 1 ? 'bg-green-400' :
                              'bg-green-300'
                            }`}
                            style={{
                              width: `${calculatePercentage(account.closing_balance, incomeStatement.revenue.total)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Top Expenses */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Principales Gastos</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {incomeStatement.expenses.accounts
                    .sort((a, b) => b.closing_balance - a.closing_balance)
                    .slice(0, 3)
                    .map((account, index) => (
                      <div key={account.account_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{account.account_name}</span>
                          <span className="text-sm font-medium">
                            {calculatePercentage(account.closing_balance, incomeStatement.expenses.total)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-red-500' :
                              index === 1 ? 'bg-red-400' :
                              'bg-red-300'
                            }`}
                            style={{
                              width: `${calculatePercentage(account.closing_balance, incomeStatement.expenses.total)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {reportType === 'balance-sheet' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Report */}
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle>Balance General</GlassCardTitle>
                    <p className="text-sm text-gray-500">
                      Al {formatDate(balanceSheet.as_of_date)}
                    </p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-8">
                  {/* Assets Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-500" />
                        ACTIVOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.assets.accounts.map((account) => (
                        <div
                          key={account.account_id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-600">
                            {account.account_number} - {account.account_name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Activos</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {formatCurrency(balanceSheet.assets.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-orange-500" />
                        PASIVOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.liabilities.accounts.map((account) => (
                        <div
                          key={account.account_id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-600">
                            {account.account_number} - {account.account_name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Pasivos</span>
                        <span className="font-bold text-orange-600 text-lg">
                          {formatCurrency(balanceSheet.liabilities.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equity Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                        CAPITAL
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.equity.accounts.map((account) => (
                        <div
                          key={account.account_id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-600">
                            {account.account_number} - {account.account_name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(account.closing_balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Capital</span>
                        <span className="font-bold text-purple-600 text-lg">
                          {formatCurrency(balanceSheet.equity.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="pt-4 border-t-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        PASIVO + CAPITAL
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-right">
                      {balanceSheet.assets.total === balanceSheet.liabilities.total + balanceSheet.equity.total
                        ? '✓ Balance cuadrado correctamente'
                        : '⚠ Balance no cuadra'}
                    </p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Financial Ratios */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Ratios Financieros</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                    <span className="text-sm font-medium text-blue-700">Liquidez</span>
                    <span className="font-semibold text-blue-800">
                      {(balanceSheet.assets.total / balanceSheet.liabilities.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                    <span className="text-sm font-medium text-purple-700">Endeudamiento</span>
                    <span className="font-semibold text-purple-800">
                      {((balanceSheet.liabilities.total / balanceSheet.assets.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                    <span className="text-sm font-medium text-green-700">Capital de Trabajo</span>
                    <span className="font-semibold text-green-800">
                      {formatCurrency(balanceSheet.assets.total - balanceSheet.liabilities.total)}
                    </span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Asset Composition */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Composición de Activos</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {balanceSheet.assets.accounts.map((account) => (
                    <div key={account.account_id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{account.account_name}</span>
                        <span className="text-sm font-medium">
                          {calculatePercentage(account.closing_balance, balanceSheet.assets.total)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${calculatePercentage(account.closing_balance, balanceSheet.assets.total)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
