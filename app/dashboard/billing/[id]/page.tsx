'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Send,
  Printer,
  Edit,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Banknote,
  Mail,
  Phone,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { billingService } from '@/features/billing/services/billing.service'
import { stripeService } from '@/features/billing/services/stripe.service'
import { billingEnhancedService } from '@/features/billing/services/billing-enhanced.service'
import { printInvoice, downloadInvoiceHTML } from '@/features/billing/utils/invoice-pdf'
import type { InvoiceWithFamily, Payment } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassBadge,
} from '@/shared/components/ui'

type PaymentMethod = 'card' | 'cash' | 'check' | 'bank_transfer'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations()
  const { formatCurrency, formatDate } = useI18n()
  const router = useRouter()

  const [invoice, setInvoice] = useState<InvoiceWithFamily | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Send email state
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setIsLoading(true)
      const [invoiceData, paymentsData] = await Promise.all([
        billingService.getInvoiceById(id),
        billingService.getPaymentsByInvoice(id),
      ])

      if (!invoiceData) {
        setError(t.errors.notFound)
        return
      }

      setInvoice(invoiceData)
      setPayments(paymentsData)
    } catch (err) {
      console.error('Error loading invoice:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendInvoice() {
    if (!invoice?.family) return

    setIsSending(true)
    setError(null)

    try {
      const result = await billingService.sendInvoiceEmail(invoice.id)
      if (result.success) {
        setSuccessMessage(result.message || t.success.invoiceSent || 'Factura enviada exitosamente')
        await loadData() // Reload to get updated status
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Error sending invoice:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsSending(false)
    }
  }

  async function handlePayment() {
    if (!invoice) return

    const amount = parseFloat(paymentAmount)
    const balance = invoice.total - (invoice.amount_paid || 0)

    if (isNaN(amount) || amount <= 0) {
      setError(t.billing.invalidAmount || 'Ingrese un monto válido')
      return
    }

    if (amount > balance) {
      setError(t.billing.amountExceedsBalance || 'El monto excede el saldo')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      if (paymentMethod === 'card') {
        const result = await stripeService.createCheckoutSession({
          invoiceId: invoice.id,
          amount,
          familyName: invoice.family?.primary_contact_name || '',
          invoiceNumber: invoice.invoice_number,
          description: `${t.billing.invoicePayment || 'Pago de factura'} ${invoice.invoice_number}`,
        })

        if ('error' in result) {
          setError(result.error)
        } else if (result.url) {
          window.location.href = result.url
        }
      } else {
        await stripeService.recordManualPayment({
          invoiceId: invoice.id,
          amount,
          paymentMethod,
          notes: paymentNotes || undefined,
        })

        setSuccessMessage(t.billing.paymentRecorded || 'Pago registrado exitosamente')
        setShowPaymentModal(false)
        setPaymentAmount('')
        setPaymentNotes('')
        await loadData()
      }
    } catch (err) {
      console.error('Error processing payment:', err)
      setError(t.billing.paymentError || 'Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePrint() {
    if (!invoice) return
    try {
      const pdfData = await billingEnhancedService.getInvoicePDFData(invoice.id)
      printInvoice(pdfData)
    } catch (err) {
      console.error('Error generating print view:', err)
      // Fallback to simple print
      window.print()
    }
  }

  async function handleDownloadPDF() {
    if (!invoice) return
    try {
      const pdfData = await billingEnhancedService.getInvoicePDFData(invoice.id)
      downloadInvoiceHTML(pdfData)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Error al generar el PDF')
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error}</p>
        <Link href="/dashboard/billing" className="mt-4">
          <GlassButton variant="secondary">{t.common.back}</GlassButton>
        </Link>
      </div>
    )
  }

  if (!invoice) return null

  const balance = invoice.total - (invoice.amount_paid || 0)
  const lineItems = (invoice.line_items as Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>) || []

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between animate-fade-in print:hidden">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between animate-fade-in print:hidden">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-gray-500">{t.billing.viewInvoice}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            {t.billing.printInvoice || 'Imprimir'}
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleDownloadPDF}
            leftIcon={<Download className="w-4 h-4" />}
          >
            PDF
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleSendInvoice}
            isLoading={isSending}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {t.billing.sendInvoice || 'Enviar'}
          </GlassButton>
          {invoice.status !== 'paid' && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => {
                setPaymentAmount(String(balance))
                setShowPaymentModal(true)
              }}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {t.billing.recordPayment}
            </GlassButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice */}
        <div className="lg:col-span-2">
          <GlassCard className="print:shadow-none print:border">
            {/* Invoice Header */}
            <GlassCardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">FACTURA</h2>
                <p className="text-lg font-semibold text-primary-600">{invoice.invoice_number}</p>
              </div>
              <div className="text-right print:text-left">
                <div className="flex items-center gap-2 justify-end print:justify-start mb-2">
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{t.billing.invoiceDate}:</span> {formatDate(invoice.created_at || '')}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{t.billing.dueDate}:</span> {formatDate(invoice.due_date)}
                </p>
              </div>
            </GlassCardHeader>

            <GlassCardContent className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Facturar a</h3>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{invoice.family?.primary_contact_name}</p>
                    {invoice.family?.primary_contact_email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {invoice.family.primary_contact_email}
                      </p>
                    )}
                    {invoice.family?.primary_contact_phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {invoice.family.primary_contact_phone}
                      </p>
                    )}
                    {invoice.family?.address && (
                      <p className="text-sm text-gray-600">
                        {invoice.family.address}
                        {invoice.family.city && `, ${invoice.family.city}`}
                        {invoice.family.state && `, ${invoice.family.state}`}
                        {invoice.family.zip_code && ` ${invoice.family.zip_code}`}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t.billing.period}</h3>
                  <p className="text-gray-900">
                    {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{t.billing.description}</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">{t.billing.quantity}</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">{t.billing.unitPrice}</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">{t.billing.total}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineItems.length > 0 ? (
                      lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 text-gray-900">Servicios de cuidado infantil</td>
                        <td className="px-4 py-3 text-center text-gray-600">1</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(invoice.subtotal)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.billing.subtotal}</span>
                    <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {(invoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.billing.discount}</span>
                      <span className="text-green-600">-{formatCurrency(invoice.discount || 0)}</span>
                    </div>
                  )}
                  {(invoice.tax || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.billing.tax}</span>
                      <span className="text-gray-900">{formatCurrency(invoice.tax || 0)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">{t.billing.total}</span>
                      <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                  {(invoice.amount_paid || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.billing.amountPaid}</span>
                      <span className="text-green-600">-{formatCurrency(invoice.amount_paid || 0)}</span>
                    </div>
                  )}
                  {balance > 0 && (
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                      <span className="text-gray-900">{t.billing.balance}</span>
                      <span className="text-orange-600">{formatCurrency(balance)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t.billing.notes}</h3>
                  <p className="text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Payment History */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.billing.paymentHistory}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay pagos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.paid_at || payment.created_at || '')}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {payment.payment_method === 'card' ? 'Tarjeta' :
                            payment.payment_method === 'cash' ? 'Efectivo' :
                              payment.payment_method === 'check' ? 'Cheque' :
                                payment.payment_method === 'bank_transfer' ? 'Transferencia' :
                                  payment.payment_method}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.dashboard.quickActions}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              <Link href={`/dashboard/families/${invoice.family_id}`} className="block">
                <GlassButton variant="ghost" fullWidth className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Ver Familia
                </GlassButton>
              </Link>
              <Link href={`/dashboard/billing/new?family=${invoice.family_id}`} className="block">
                <GlassButton variant="ghost" fullWidth className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Nueva Factura
                </GlassButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md animate-scale-in">
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>{t.billing.recordPayment}</GlassCardTitle>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {/* Invoice Info */}
              <div className="p-4 rounded-xl bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t.billing.invoice}:</span>
                  <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t.billing.total}:</span>
                  <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t.billing.outstandingBalance}:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(balance)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.billing.paymentMethod}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['card', 'cash', 'check', 'bank_transfer'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === method
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {method === 'card' ? <CreditCard className="w-5 h-5" /> :
                        method === 'cash' ? <Banknote className="w-5 h-5" /> :
                          <DollarSign className="w-5 h-5" />}
                      <span className="font-medium text-sm">
                        {method === 'card' ? t.billing.creditCard :
                          method === 'cash' ? t.billing.cash :
                            method === 'check' ? t.billing.check :
                              t.billing.bankTransfer}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <GlassInput
                type="number"
                label={t.billing.amountToPay || 'Monto a Pagar'}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                leftIcon={<DollarSign className="w-5 h-5" />}
              />

              {/* Notes */}
              {paymentMethod !== 'card' && (
                <GlassInput
                  label={`${t.billing.notes} (${t.common.optional.toLowerCase()})`}
                  placeholder={t.billing.notesPlaceholder}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <GlassButton
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessing}
                >
                  {t.common.cancel}
                </GlassButton>
                <GlassButton
                  variant="primary"
                  fullWidth
                  onClick={handlePayment}
                  isLoading={isProcessing}
                  leftIcon={paymentMethod === 'card' ? <CreditCard className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {paymentMethod === 'card' ? (t.billing.payWithCard || 'Pagar con Tarjeta') : t.billing.recordPayment}
                </GlassButton>
              </div>

              {paymentMethod === 'card' && (
                <p className="text-xs text-gray-500 text-center">
                  {t.billing.stripeRedirectMessage}
                </p>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
