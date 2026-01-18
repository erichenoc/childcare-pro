'use client'

import { useState, useEffect, useMemo } from 'react'
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
  FileSpreadsheet,
  Table2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  GitCompare,
  Banknote,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  accountingService,
  type IncomeStatement,
  type BalanceSheet,
  type ComparativeIncomeStatement,
  type MonthlyTrend,
  type CashFlowStatement,
  type YearOverYearComparison,
} from '@/features/accounting/services/accounting.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassSelect,
} from '@/shared/components/ui'
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  type ReportData,
} from '@/shared/utils/report-export'

type ReportType = 'income-statement' | 'balance-sheet' | 'comparative' | 'trends' | 'cash-flow' | 'yoy'

export default function FinancialReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('income-statement')
  const [period, setPeriod] = useState<string>('this-month')
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null)
  const [comparative, setComparative] = useState<ComparativeIncomeStatement | null>(null)
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null)
  const [yoyComparison, setYoyComparison] = useState<YearOverYearComparison | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    try {
      setIsLoading(true)
      // Use mock data for development
      const statement = accountingService.getMockIncomeStatement()
      const comp = accountingService.getMockComparativeIncomeStatement()
      const trendData = accountingService.getMockMonthlyTrends()
      const cashFlowData = accountingService.getMockCashFlowStatement()
      const yoy = accountingService.getMockYearOverYearComparison()

      setIncomeStatement(statement)
      setComparative(comp)
      setTrends(trendData)
      setCashFlow(cashFlowData)
      setYoyComparison(yoy)
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
  const balanceSheet: BalanceSheet = useMemo(() => accountingService.getMockBalanceSheet(), [])

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const ChangeIndicator = ({ value, showPercent = false }: { value: number; showPercent?: boolean }) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-600 font-medium">
          <ArrowUpRight className="w-4 h-4 mr-1" />
          {showPercent ? `+${value.toFixed(1)}%` : `+${formatCurrency(value)}`}
        </span>
      )
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-600 font-medium">
          <ArrowDownRight className="w-4 h-4 mr-1" />
          {showPercent ? `${value.toFixed(1)}%` : formatCurrency(value)}
        </span>
      )
    }
    return (
      <span className="flex items-center text-gray-500 font-medium">
        <Minus className="w-4 h-4 mr-1" />
        0%
      </span>
    )
  }

  // Generate report data for export
  const generateReportData = (): ReportData => {
    if (reportType === 'income-statement' && incomeStatement) {
      const rows: Record<string, unknown>[] = []
      rows.push({ category: 'INGRESOS', account: '', amount: '' })
      incomeStatement.revenue.accounts.forEach(account => {
        rows.push({
          category: '',
          account: `${account.account_number} - ${account.account_name}`,
          amount: formatCurrency(account.closing_balance)
        })
      })
      rows.push({ category: '', account: 'Total Ingresos', amount: formatCurrency(incomeStatement.revenue.total) })
      rows.push({ category: '', account: '', amount: '' })
      rows.push({ category: 'GASTOS', account: '', amount: '' })
      incomeStatement.expenses.accounts.forEach(account => {
        rows.push({
          category: '',
          account: `${account.account_number} - ${account.account_name}`,
          amount: formatCurrency(account.closing_balance)
        })
      })
      rows.push({ category: '', account: 'Total Gastos', amount: formatCurrency(incomeStatement.expenses.total) })
      rows.push({ category: '', account: '', amount: '' })
      rows.push({ category: 'UTILIDAD NETA', account: '', amount: formatCurrency(incomeStatement.net_income) })

      return {
        title: 'Estado de Resultados',
        subtitle: `Período: ${formatDate(incomeStatement.period_start)} - ${formatDate(incomeStatement.period_end)}`,
        generatedAt: new Date(),
        columns: [
          { header: 'Categoría', key: 'category', width: 15 },
          { header: 'Cuenta', key: 'account', width: 35 },
          { header: 'Monto', key: 'amount', width: 15 },
        ],
        rows,
        summary: {
          'Total Ingresos': formatCurrency(incomeStatement.revenue.total),
          'Total Gastos': formatCurrency(incomeStatement.expenses.total),
          'Utilidad Neta': formatCurrency(incomeStatement.net_income),
        }
      }
    }

    // Default balance sheet
    const rows: Record<string, unknown>[] = []
    rows.push({ category: 'ACTIVOS', account: '', amount: '' })
    balanceSheet.assets.accounts.forEach(account => {
      rows.push({
        category: '',
        account: `${account.account_number} - ${account.account_name}`,
        amount: formatCurrency(account.closing_balance)
      })
    })
    rows.push({ category: '', account: 'Total Activos', amount: formatCurrency(balanceSheet.assets.total) })

    return {
      title: 'Balance General',
      subtitle: `Al ${formatDate(balanceSheet.as_of_date)}`,
      generatedAt: new Date(),
      columns: [
        { header: 'Categoría', key: 'category', width: 15 },
        { header: 'Cuenta', key: 'account', width: 35 },
        { header: 'Monto', key: 'amount', width: 15 },
      ],
      rows,
      summary: {
        'Total Activos': formatCurrency(balanceSheet.assets.total),
        'Total Pasivos': formatCurrency(balanceSheet.liabilities.total),
        'Total Capital': formatCurrency(balanceSheet.equity.total),
      }
    }
  }

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setIsExporting(format)
    setShowExportMenu(false)

    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const reportData = generateReportData()
      const filename = `reporte_financiero_${new Date().toISOString().split('T')[0]}`

      switch (format) {
        case 'excel':
          exportToExcel(reportData, filename)
          break
        case 'csv':
          exportToCSV(reportData, filename)
          break
        case 'pdf':
          exportToPDF(reportData, filename)
          break
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    } finally {
      setIsExporting(null)
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
            <h1 className="text-2xl font-bold text-gray-900">Reportes Financieros Avanzados</h1>
            <p className="text-gray-500">Análisis financiero completo con comparativos y tendencias</p>
          </div>
        </div>
        <div className="relative">
          <GlassButton
            variant="secondary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting !== null}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </GlassButton>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Excel (.xlsx)</p>
                  <p className="text-xs text-gray-500">Hoja de cálculo</p>
                </div>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-t border-gray-100"
              >
                <Table2 className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">CSV (.csv)</p>
                  <p className="text-xs text-gray-500">Datos separados por coma</p>
                </div>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-t border-gray-100"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">PDF (.pdf)</p>
                  <p className="text-xs text-gray-500">Documento imprimible</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Type Selection */}
      <GlassCard variant="clear" className="p-4">
        <div className="flex flex-wrap gap-2">
          <GlassButton
            variant={reportType === 'income-statement' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('income-statement')}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Estado de Resultados
          </GlassButton>
          <GlassButton
            variant={reportType === 'balance-sheet' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('balance-sheet')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Balance General
          </GlassButton>
          <GlassButton
            variant={reportType === 'comparative' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('comparative')}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Comparativo
          </GlassButton>
          <GlassButton
            variant={reportType === 'trends' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('trends')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Tendencias
          </GlassButton>
          <GlassButton
            variant={reportType === 'cash-flow' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('cash-flow')}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Flujo de Caja
          </GlassButton>
          <GlassButton
            variant={reportType === 'yoy' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReportType('yoy')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Año vs Año
          </GlassButton>
        </div>
      </GlassCard>

      {/* Income Statement */}
      {reportType === 'income-statement' && incomeStatement && (
        <div className="grid lg:grid-cols-3 gap-6">
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
                        <div key={account.account_id} className="flex items-center justify-between">
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
                        <div key={account.account_id} className="flex items-center justify-between">
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
                      <span className="text-xl font-bold text-gray-900">UTILIDAD NETA</span>
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
                  <p className="text-sm text-gray-500 mt-2">Utilidad / Ingresos</p>
                </div>
              </GlassCardContent>
            </GlassCard>

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
                              index === 0 ? 'bg-green-500' : index === 1 ? 'bg-green-400' : 'bg-green-300'
                            }`}
                            style={{ width: `${calculatePercentage(account.closing_balance, incomeStatement.revenue.total)}%` }}
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
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardHeader>
                <div>
                  <GlassCardTitle>Balance General</GlassCardTitle>
                  <p className="text-sm text-gray-500">Al {formatDate(balanceSheet.as_of_date)}</p>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-8">
                  {/* Assets */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-500" />
                        ACTIVOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.assets.accounts.map((account) => (
                        <div key={account.account_id} className="flex items-center justify-between">
                          <span className="text-gray-600">{account.account_number} - {account.account_name}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(account.closing_balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Activos</span>
                        <span className="font-bold text-blue-600 text-lg">{formatCurrency(balanceSheet.assets.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-orange-500" />
                        PASIVOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.liabilities.accounts.map((account) => (
                        <div key={account.account_id} className="flex items-center justify-between">
                          <span className="text-gray-600">{account.account_number} - {account.account_name}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(account.closing_balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Pasivos</span>
                        <span className="font-bold text-orange-600 text-lg">{formatCurrency(balanceSheet.liabilities.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                        CAPITAL
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {balanceSheet.equity.accounts.map((account) => (
                        <div key={account.account_id} className="flex items-center justify-between">
                          <span className="text-gray-600">{account.account_number} - {account.account_name}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(account.closing_balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total Capital</span>
                        <span className="font-bold text-purple-600 text-lg">{formatCurrency(balanceSheet.equity.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Financial Ratios Sidebar */}
          <div className="space-y-6">
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
          </div>
        </div>
      )}

      {/* Comparative Analysis */}
      {reportType === 'comparative' && comparative && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cambio en Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparative.variance.revenue_change)}</p>
                </div>
                <ChangeIndicator value={comparative.variance.revenue_change_pct} showPercent />
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cambio en Gastos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparative.variance.expense_change)}</p>
                </div>
                <ChangeIndicator value={-comparative.variance.expense_change_pct} showPercent />
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cambio en Utilidad</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparative.variance.net_income_change)}</p>
                </div>
                <ChangeIndicator value={comparative.variance.net_income_change_pct} showPercent />
              </div>
            </GlassCard>
          </div>

          {/* Comparative Table */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Comparativo de Ingresos vs Período Anterior</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cuenta</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Período Actual</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Período Anterior</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Variación</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-50">
                      <td colSpan={5} className="py-2 px-4 font-semibold text-green-800">INGRESOS</td>
                    </tr>
                    {comparative.current.revenue.accounts.map((account, index) => {
                      const prevAccount = comparative.previous.revenue.accounts[index]
                      const change = account.closing_balance - (prevAccount?.closing_balance || 0)
                      const changePct = prevAccount?.closing_balance
                        ? ((change / prevAccount.closing_balance) * 100)
                        : 0
                      return (
                        <tr key={account.account_id} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-600">{account.account_name}</td>
                          <td className="py-2 px-4 text-right font-medium">{formatCurrency(account.closing_balance)}</td>
                          <td className="py-2 px-4 text-right text-gray-500">{formatCurrency(prevAccount?.closing_balance || 0)}</td>
                          <td className="py-2 px-4 text-right">
                            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span className={changePct >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-green-100 font-semibold">
                      <td className="py-2 px-4">Total Ingresos</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(comparative.current.revenue.total)}</td>
                      <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(comparative.previous.revenue.total)}</td>
                      <td className="py-2 px-4 text-right text-green-700">+{formatCurrency(comparative.variance.revenue_change)}</td>
                      <td className="py-2 px-4 text-right text-green-700">+{comparative.variance.revenue_change_pct.toFixed(1)}%</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td colSpan={5} className="py-2 px-4 font-semibold text-red-800">GASTOS</td>
                    </tr>
                    {comparative.current.expenses.accounts.map((account, index) => {
                      const prevAccount = comparative.previous.expenses.accounts[index]
                      const change = account.closing_balance - (prevAccount?.closing_balance || 0)
                      const changePct = prevAccount?.closing_balance
                        ? ((change / prevAccount.closing_balance) * 100)
                        : 0
                      return (
                        <tr key={account.account_id} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-600">{account.account_name}</td>
                          <td className="py-2 px-4 text-right font-medium">{formatCurrency(account.closing_balance)}</td>
                          <td className="py-2 px-4 text-right text-gray-500">{formatCurrency(prevAccount?.closing_balance || 0)}</td>
                          <td className="py-2 px-4 text-right">
                            <span className={change <= 0 ? 'text-green-600' : 'text-red-600'}>
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span className={changePct <= 0 ? 'text-green-600' : 'text-red-600'}>
                              {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* Trends Analysis */}
      {reportType === 'trends' && trends.length > 0 && (
        <div className="space-y-6">
          {/* Income & Expenses Trend */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Tendencia de Ingresos vs Gastos (12 meses)</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month_name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="total_income" name="Ingresos" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                    <Area type="monotone" dataKey="total_expenses" name="Gastos" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Net Income & Profit Margin */}
          <div className="grid lg:grid-cols-2 gap-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Utilidad Neta Mensual</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month_name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="net_income" name="Utilidad Neta" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Margen de Utilidad (%)</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month_name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="profit_margin" name="Margen" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4 text-center">
              <p className="text-sm text-gray-500">Promedio Ingresos</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(trends.reduce((sum, t) => sum + t.total_income, 0) / trends.length)}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-sm text-gray-500">Promedio Gastos</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(trends.reduce((sum, t) => sum + t.total_expenses, 0) / trends.length)}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-sm text-gray-500">Mejor Mes</p>
              <p className="text-xl font-bold text-purple-600">
                {trends.reduce((best, t) => t.net_income > best.net_income ? t : best).month_name}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-sm text-gray-500">Margen Promedio</p>
              <p className="text-xl font-bold text-amber-600">
                {(trends.reduce((sum, t) => sum + t.profit_margin, 0) / trends.length).toFixed(1)}%
              </p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Cash Flow Statement */}
      {reportType === 'cash-flow' && cashFlow && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardHeader>
                <div>
                  <GlassCardTitle>Estado de Flujo de Efectivo</GlassCardTitle>
                  <p className="text-sm text-gray-500">
                    {formatDate(cashFlow.period_start)} - {formatDate(cashFlow.period_end)}
                  </p>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-8">
                  {/* Operating Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">ACTIVIDADES DE OPERACIÓN</h3>
                    </div>
                    <div className="space-y-2">
                      {cashFlow.operating_activities.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-600">{item.name}</span>
                          <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Flujo Neto de Operaciones</span>
                        <span className={`font-bold text-lg ${cashFlow.operating_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow.operating_activities.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">ACTIVIDADES DE INVERSIÓN</h3>
                    </div>
                    <div className="space-y-2">
                      {cashFlow.investing_activities.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-600">{item.name}</span>
                          <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Flujo Neto de Inversiones</span>
                        <span className={`font-bold text-lg ${cashFlow.investing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow.investing_activities.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">ACTIVIDADES DE FINANCIAMIENTO</h3>
                    </div>
                    <div className="space-y-2">
                      {cashFlow.financing_activities.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-600">{item.name}</span>
                          <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Flujo Neto de Financiamiento</span>
                        <span className={`font-bold text-lg ${cashFlow.financing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow.financing_activities.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Change */}
                  <div className="pt-4 border-t-2 border-gray-300">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Efectivo al Inicio</span>
                        <span className="font-medium">{formatCurrency(cashFlow.beginning_cash)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Cambio Neto en Efectivo</span>
                        <span className={`font-bold ${cashFlow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow.net_cash_change)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xl font-bold text-gray-900">EFECTIVO AL FINAL</span>
                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlow.ending_cash)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Cash Flow Summary */}
          <div className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Resumen de Flujos</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Operación', value: cashFlow.operating_activities.total },
                        { name: 'Inversión', value: cashFlow.investing_activities.total },
                        { name: 'Financiam.', value: cashFlow.financing_activities.total },
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Cambio Neto</p>
                <p className={`text-3xl font-bold ${cashFlow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashFlow.net_cash_change >= 0 ? '+' : ''}{formatCurrency(cashFlow.net_cash_change)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {((cashFlow.net_cash_change / cashFlow.beginning_cash) * 100).toFixed(1)}% vs inicio
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Year over Year Comparison */}
      {reportType === 'yoy' && yoyComparison && (
        <div className="space-y-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Comparación Año vs Año ({yoyComparison.current_year} vs {yoyComparison.previous_year})</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Métrica</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{yoyComparison.current_year}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{yoyComparison.previous_year}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cambio</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yoyComparison.metrics.map((metric, index) => {
                      const isPositiveGood = !metric.name.includes('Gastos')
                      const isPositive = metric.change >= 0
                      const colorClass = isPositiveGood === isPositive ? 'text-green-600' : 'text-red-600'
                      const isCurrency = metric.name.includes('$') || metric.name.includes('Ingresos') || metric.name.includes('Gastos') || metric.name.includes('Utilidad')

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{metric.name}</td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {isCurrency ? formatCurrency(metric.current) : metric.current.toLocaleString()}
                            {metric.name.includes('Margen') && '%'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500">
                            {isCurrency ? formatCurrency(metric.previous) : metric.previous.toLocaleString()}
                            {metric.name.includes('Margen') && '%'}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${colorClass}`}>
                            {metric.change >= 0 ? '+' : ''}
                            {isCurrency ? formatCurrency(metric.change) : metric.change.toLocaleString()}
                            {metric.name.includes('Margen') && ' pts'}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${colorClass}`}>
                            <div className="flex items-center justify-end gap-1">
                              {metric.change_pct >= 0 ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                              {metric.change_pct >= 0 ? '+' : ''}{metric.change_pct.toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Visual Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Ingresos vs Gastos por Año</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: yoyComparison.previous_year.toString(),
                          Ingresos: yoyComparison.metrics[0].previous,
                          Gastos: yoyComparison.metrics[1].previous,
                        },
                        {
                          name: yoyComparison.current_year.toString(),
                          Ingresos: yoyComparison.metrics[0].current,
                          Gastos: yoyComparison.metrics[1].current,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Crecimiento Interanual</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {yoyComparison.metrics.slice(0, 4).map((metric, index) => {
                    const isPositiveGood = !metric.name.includes('Gastos')
                    const isPositive = metric.change_pct >= 0
                    const bgColor = isPositiveGood === isPositive ? 'bg-green-50' : 'bg-red-50'
                    const textColor = isPositiveGood === isPositive ? 'text-green-700' : 'text-red-700'

                    return (
                      <div key={index} className={`p-3 rounded-lg ${bgColor}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                          <span className={`font-bold ${textColor}`}>
                            {metric.change_pct >= 0 ? '+' : ''}{metric.change_pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPositiveGood === isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.abs(metric.change_pct), 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
