'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Plus,
  Download,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Send,
  Loader2,
  X,
  Banknote,
  CalendarDays,
  FileText,
  CheckSquare,
  Receipt,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { billingService } from '@/features/billing/services/billing.service'
import { stripeService } from '@/features/billing/services/stripe.service'
import type { InvoiceWithFamily } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassAvatar,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassTableEmpty,
  GlassWorkflowStepper,
  type WorkflowStep,
  GlassSmartEmptyState,
  GlassContextualHelp,
} from '@/shared/components/ui'

// Status options will be created inside component to use translations

type PaymentModalData = {
  invoiceId: string
  invoiceNumber: string
  familyName: string
  total: number
  amountPaid: number
  balance: number
}

export default function BillingPage() {
  const t = useTranslations()
  const { formatCurrency, formatDate } = useI18n()
  const searchParams = useSearchParams()

  // Status options with translations
  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'paid', label: t.billing.paid },
    { value: 'pending', label: t.billing.pending },
    { value: 'partial', label: t.billing.partiallyPaid },
    { value: 'overdue', label: t.billing.overdue },
  ]

  const [invoices, setInvoices] = useState<InvoiceWithFamily[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, paidCount: 0, overdueCount: 0 })

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'check' | 'bank_transfer'>('card')
  const [paymentPeriod, setPaymentPeriod] = useState<'1_week' | '2_weeks' | '3_weeks' | '1_month'>('1_week')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Success/Cancel messages from Stripe redirect
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check for Stripe redirect params
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setSuccessMessage(t.success.paymentProcessed)
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/billing')
    } else if (canceled === 'true') {
      setErrorMessage(t.billing.paymentCanceled || 'Payment was canceled')
      window.history.replaceState({}, '', '/dashboard/billing')
    }

    loadData()
  }, [searchParams])

  async function loadData() {
    try {
      setIsLoading(true)
      const [invoicesData, statsData] = await Promise.all([
        billingService.getInvoices(),
        billingService.getStats(),
      ])
      setInvoices(invoicesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function exportToCSV() {
    if (filteredInvoices.length === 0) {
      setErrorMessage(t.billing.noInvoicesFound)
      return
    }

    // Create CSV headers
    const headers = [
      t.billing.invoiceNumber || 'Invoice Number',
      t.families.familyName || 'Family',
      t.billing.period || 'Period',
      t.billing.total,
      t.billing.amountPaid || 'Amount Paid',
      t.billing.balance,
      t.billing.dueDate,
      t.common.status
    ]

    // Create CSV rows
    const rows = filteredInvoices.map(invoice => {
      const familyName = invoice.family ? invoice.family.primary_contact_name : ''
      const balance = invoice.total - (invoice.amount_paid || 0)
      const status = invoice.status || 'pending'

      return [
        invoice.invoice_number,
        familyName,
        formatPeriod(invoice.period_start),
        invoice.total.toFixed(2),
        (invoice.amount_paid || 0).toFixed(2),
        balance.toFixed(2),
        formatDate(invoice.due_date),
        status
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Helper to format period from period_start date
  function formatPeriod(periodStart: string): string {
    const date = new Date(periodStart)
    const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    // Use Spanish months as default (can be expanded with locale detection)
    const months = monthsEs
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Get unique periods from invoices
  const periodOptions = [
    { value: '', label: t.billing.allPeriods || 'All Periods' },
    ...Array.from(new Set(invoices.map(inv => formatPeriod(inv.period_start)))).map(period => ({
      value: period,
      label: period,
    })),
  ]

  const [selectedPeriod, setSelectedPeriod] = useState('')

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const familyName = invoice.family
      ? invoice.family.primary_contact_name
      : ''
    const matchesSearch =
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || invoice.status === selectedStatus
    const matchesPeriod = !selectedPeriod || formatPeriod(invoice.period_start) === selectedPeriod

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <GlassBadge variant="success" dot>{t.billing.paid}</GlassBadge>
      case 'pending':
        return <GlassBadge variant="default" dot>{t.billing.pending}</GlassBadge>
      case 'partial':
        return <GlassBadge variant="warning" dot>{t.billing.partiallyPaid}</GlassBadge>
      case 'overdue':
        return <GlassBadge variant="error" dot>{t.billing.overdue}</GlassBadge>
      default:
        return null
    }
  }

  function openPaymentModal(invoice: InvoiceWithFamily) {
    const familyName = invoice.family
      ? invoice.family.primary_contact_name
      : t.nav.families

    setPaymentModal({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      familyName,
      total: invoice.total,
      amountPaid: invoice.amount_paid || 0,
      balance: invoice.total - (invoice.amount_paid || 0),
    })
    setPaymentAmount(String(invoice.total - (invoice.amount_paid || 0)))
    setPaymentMethod('card')
    setPaymentPeriod('1_week')
    setPaymentNotes('')
  }

  function closePaymentModal() {
    setPaymentModal(null)
    setPaymentAmount('')
    setPaymentMethod('card')
    setPaymentPeriod('1_week')
    setPaymentNotes('')
  }

  async function handleSendInvoice(invoice: InvoiceWithFamily) {
    try {
      const result = await billingService.sendInvoiceEmail(invoice.id)
      if (result.success) {
        setSuccessMessage(result.message)
        await loadData()
      } else {
        setErrorMessage(result.message)
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      setErrorMessage(t.billing.sendError || 'Error sending invoice')
    }
  }

  async function handlePayment() {
    if (!paymentModal) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage(t.billing.invalidAmount || 'Please enter a valid amount')
      return
    }

    if (amount > paymentModal.balance) {
      setErrorMessage(t.billing.amountExceedsBalance || 'Amount cannot exceed the pending balance')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Map period to description
      const periodLabels: Record<string, string> = {
        '1_week': '1 semana',
        '2_weeks': '2 semanas',
        '3_weeks': '3 semanas',
        '1_month': '1 mes',
      }

      // Record payment (all methods are manual recording now)
      await stripeService.recordManualPayment({
        invoiceId: paymentModal.invoiceId,
        amount,
        paymentMethod,
        notes: `Período: ${periodLabels[paymentPeriod]}${paymentNotes ? ` | ${paymentNotes}` : ''}`,
      })

      setSuccessMessage(t.billing.paymentRecorded || 'Payment recorded successfully!')
      closePaymentModal()
      await loadData()
    } catch (error) {
      console.error('Error recording payment:', error)
      setErrorMessage(t.billing.paymentError || 'Error recording payment')
    } finally {
      setIsProcessing(false)
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
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.billing.title}
          </h1>
          <p className="text-gray-500">
            {t.billing.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlassButton
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={exportToCSV}
          >
            {t.common.export}
          </GlassButton>
          <Link href="/dashboard/billing/multi-week">
            <GlassButton variant="secondary" leftIcon={<CalendarDays className="w-4 h-4" />}>
              Multi-Semana
            </GlassButton>
          </Link>
          <Link href="/dashboard/billing/new">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.billing.createInvoice}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Billing Workflow */}
      {(() => {
        const workflowSteps: WorkflowStep[] = [
          {
            key: 'create',
            label: t.workflow.billingCreate,
            icon: <FileText className="w-4 h-4" />,
            status: (invoices.length > 0 ? 'completed' : 'current') as any,
            count: invoices.filter(i => i.status === 'draft').length || undefined,
          },
          {
            key: 'send',
            label: t.workflow.billingSend,
            icon: <Send className="w-4 h-4" />,
            status: (invoices.some(i => i.status === 'pending' || i.status === 'paid') ? 'completed' : invoices.length > 0 ? 'current' : 'upcoming') as any,
            count: invoices.filter(i => i.status === 'pending').length || undefined,
          },
          {
            key: 'collect',
            label: t.workflow.billingCollect,
            icon: <CreditCard className="w-4 h-4" />,
            status: (invoices.some(i => i.status === 'paid') ? 'completed' : invoices.some(i => i.status === 'pending') ? 'current' : 'upcoming') as any,
            count: invoices.filter(i => i.status === 'paid').length || undefined,
          },
          {
            key: 'reconcile',
            label: t.workflow.billingReconcile,
            icon: <CheckSquare className="w-4 h-4" />,
            status: 'upcoming' as any,
          },
        ]
        return <GlassWorkflowStepper steps={workflowSteps} />
      })()}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(stats.totalCollected)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.billing.collected || 'Collected'}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(stats.totalPending)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.billing.pending}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.paidCount}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.billing.paidInvoices || 'Paid'}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.billing.overdueInvoices || 'Overdue'}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <GlassInput
                placeholder={t.billing.searchInvoices}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-48"
              />
              <GlassSelect
                options={periodOptions}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Invoices List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <GlassSmartEmptyState
            icon={<Receipt className="w-8 h-8" />}
            title={t.emptyStates.billingTitle}
            steps={[
              { label: t.workflow.billingCreate, icon: <FileText className="w-4 h-4" /> },
              { label: t.workflow.billingSend, icon: <Send className="w-4 h-4" /> },
              { label: t.workflow.billingCollect, icon: <CreditCard className="w-4 h-4" /> },
            ]}
            primaryAction={{
              label: t.emptyStates.billingAction,
              href: '/dashboard/billing/new',
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        ) : (
          filteredInvoices.map((invoice) => {
            const familyName = invoice.family
              ? invoice.family.primary_contact_name
              : t.nav.families
            const balance = invoice.total - (invoice.amount_paid || 0)

            return (
              <GlassCard key={invoice.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <GlassAvatar name={familyName} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{familyName}</p>
                      <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
                    </div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.billing.period || 'Period'}:</span>
                    <span className="text-gray-900">{formatPeriod(invoice.period_start)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.billing.total}:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.billing.amountPaid}:</span>
                    <span className="text-gray-900">{formatCurrency(invoice.amount_paid || 0)}</span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t.billing.balance}:</span>
                      <span className="text-orange-600 font-semibold">
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.billing.dueDate}:</span>
                    <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-100 flex justify-end gap-2">
                  <Link href={`/dashboard/billing/${invoice.id}`}>
                    <GlassButton variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      {t.common.view}
                    </GlassButton>
                  </Link>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendInvoice(invoice)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {t.billing.send || 'Send'}
                  </GlassButton>
                  {invoice.status !== 'paid' && (
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => openPaymentModal(invoice)}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      {t.billing.recordPayment}
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            )
          })
        )}
      </div>

      {/* Invoices Table - Desktop */}
      <div className="hidden md:block">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.billing.invoices}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>{t.billing.invoice || 'Invoice'}</GlassTableHead>
                  <GlassTableHead>{t.families.familyName || 'Family'}</GlassTableHead>
                  <GlassTableHead>{t.billing.period || 'Period'}</GlassTableHead>
                  <GlassTableHead>{t.billing.total}</GlassTableHead>
                  <GlassTableHead>{t.billing.balance}</GlassTableHead>
                  <GlassTableHead>{t.billing.dueDate}</GlassTableHead>
                  <GlassTableHead>{t.common.status}</GlassTableHead>
                  <GlassTableHead className="text-right">{t.common.actions}</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {filteredInvoices.length === 0 ? (
                  <GlassTableEmpty title={t.billing.noInvoicesFound} />
                ) : (
                  filteredInvoices.map((invoice) => {
                    const familyName = invoice.family
                      ? invoice.family.primary_contact_name
                      : t.nav.families
                    const balance = invoice.total - (invoice.amount_paid || 0)

                    return (
                      <GlassTableRow key={invoice.id}>
                        <GlassTableCell>
                          <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex items-center gap-2">
                            <GlassAvatar name={familyName} size="sm" />
                            <span className="text-gray-900">{familyName}</span>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>{formatPeriod(invoice.period_start)}</GlassTableCell>
                        <GlassTableCell className="font-semibold">
                          {formatCurrency(invoice.total)}
                        </GlassTableCell>
                        <GlassTableCell>
                          {balance > 0 ? (
                            <span className="text-orange-600 font-semibold">
                              {formatCurrency(balance)}
                            </span>
                          ) : (
                            <span className="text-green-600">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>{formatDate(invoice.due_date)}</GlassTableCell>
                        <GlassTableCell>{getStatusBadge(invoice.status)}</GlassTableCell>
                        <GlassTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/billing/${invoice.id}`}>
                              <GlassButton variant="ghost" size="sm" title={t.common.view}>
                                <Eye className="w-4 h-4" />
                              </GlassButton>
                            </Link>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              title={t.billing.sendInvoice || 'Send Invoice'}
                              onClick={() => handleSendInvoice(invoice)}
                            >
                              <Send className="w-4 h-4" />
                            </GlassButton>
                            {invoice.status !== 'paid' && (
                              <GlassButton
                                variant="ghost"
                                size="sm"
                                title={t.billing.recordPayment}
                                onClick={() => openPaymentModal(invoice)}
                              >
                                <CreditCard className="w-4 h-4" />
                              </GlassButton>
                            )}
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    )
                  })
                )}
              </GlassTableBody>
            </GlassTable>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md animate-scale-in">
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>{t.billing.recordPayment}</GlassCardTitle>
              <button
                onClick={closePaymentModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {/* Invoice Info */}
              <div className="p-4 rounded-xl bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t.billing.invoice || 'Invoice'}:</span>
                  <span className="font-semibold text-gray-900">{paymentModal.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t.families.familyName || 'Family'}:</span>
                  <span className="text-gray-900">{paymentModal.familyName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t.billing.total}:</span>
                  <span className="text-gray-900">{formatCurrency(paymentModal.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t.billing.outstandingBalance}:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(paymentModal.balance)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.billing.paymentMethod}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">{t.billing.creditCard}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="font-medium">{t.billing.cash}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('check')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'check'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">{t.billing.check}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">{t.billing.bankTransfer}</span>
                  </button>
                </div>
              </div>

              {/* Payment Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {'Período de Pago'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentPeriod('1_week')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentPeriod === '1_week'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">1 Semana</span>
                  </button>
                  <button
                    onClick={() => setPaymentPeriod('2_weeks')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentPeriod === '2_weeks'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">2 Semanas</span>
                  </button>
                  <button
                    onClick={() => setPaymentPeriod('3_weeks')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentPeriod === '3_weeks'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">3 Semanas</span>
                  </button>
                  <button
                    onClick={() => setPaymentPeriod('1_month')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentPeriod === '1_month'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">1 Mes</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <GlassInput
                type="number"
                label={t.billing.amountToPay || 'Amount to Pay'}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                leftIcon={<DollarSign className="w-5 h-5" />}
              />

              {/* Notes */}
              <GlassInput
                label={`${t.billing.notes || 'Notes'} (${t.common.optional.toLowerCase()})`}
                placeholder={t.billing.notesPlaceholder || 'Reference number, check #, etc.'}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <GlassButton
                  variant="secondary"
                  fullWidth
                  onClick={closePaymentModal}
                  disabled={isProcessing}
                >
                  {t.common.cancel}
                </GlassButton>
                <GlassButton
                  variant="primary"
                  fullWidth
                  onClick={handlePayment}
                  isLoading={isProcessing}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  {t.billing.recordPayment || 'Registrar Pago'}
                </GlassButton>
              </div>

              <p className="text-xs text-gray-500 text-center">
                {'Este registro es solo para control interno. El pago se procesa por su pasarela externa.'}
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
