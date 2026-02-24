'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ChevronDown,
  DollarSign,
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'
import { stripeService } from '@/features/billing/services/stripe.service'

type Invoice = {
  id: string
  invoice_number: string
  total_amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  billing_period_start: string
  billing_period_end: string
  paid_at: string | null
  child_id: string
  child?: {
    first_name: string
    last_name: string
  }
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  paid: {
    label: 'Pagada',
    icon: CheckCircle,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  overdue: {
    label: 'Vencida',
    icon: AlertTriangle,
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  cancelled: {
    label: 'Cancelada',
    icon: Clock,
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
}

export default function FamilyPortalBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoices() {
      try {
        const guardian = await guardianAuthService.getCurrentGuardian()
        if (!guardian) return

        const childIds = guardian.children.map(c => c.id)

        if (childIds.length === 0) {
          setIsLoading(false)
          return
        }

        const supabase = createClient()

        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            total_amount,
            due_date,
            status,
            billing_period_start,
            billing_period_end,
            paid_at,
            child_id,
            child:children(first_name, last_name)
          `)
          .in('child_id', childIds)
          .order('due_date', { ascending: false })

        if (error) throw error
        setInvoices((data || []).map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          ...r,
          child: Array.isArray(r.child) ? r.child[0] : r.child,
        })))
      } catch (error) {
        console.error('Error loading invoices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [])

  const handlePayInvoice = async (invoice: Invoice) => {
    setPayingInvoice(invoice.id)
    try {
      const result = await stripeService.createCheckoutSession({
        invoiceId: invoice.id,
        amount: invoice.total_amount,
        familyName: `${invoice.child?.first_name ?? ''} ${invoice.child?.last_name ?? ''}`.trim(),
        invoiceNumber: invoice.invoice_number,
        description: `Factura #${invoice.invoice_number} - ${invoice.child?.first_name} ${invoice.child?.last_name}`,
      })

      if ('error' in result) {
        alert(result.error)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url
    } catch (error) {
      console.error('Error initiating payment:', error)
      alert('Error al procesar el pago. Intenta de nuevo.')
    } finally {
      setPayingInvoice(null)
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    if (filter === 'pending') return inv.status === 'pending' || inv.status === 'overdue'
    if (filter === 'paid') return inv.status === 'paid'
    return true
  })

  const totalPending = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Cargando facturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-green-600" />
          Mis Facturas
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Historial de pagos y facturas pendientes
        </p>
      </div>

      {/* Summary Card */}
      {totalPending > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total pendiente de pago</p>
              <p className="text-3xl font-bold mt-1">${totalPending.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-white/30" />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Pagadas'}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay facturas para mostrar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const status = statusConfig[invoice.status]
            const StatusIcon = status.icon

            return (
              <div
                key={invoice.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Factura #{invoice.invoice_number}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {invoice.child?.first_name} {invoice.child?.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      Periodo: {new Date(invoice.billing_period_start).toLocaleDateString('es')} - {new Date(invoice.billing_period_end).toLocaleDateString('es')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {invoice.status === 'paid' && invoice.paid_at
                        ? `Pagada el ${new Date(invoice.paid_at).toLocaleDateString('es')}`
                        : `Vence: ${new Date(invoice.due_date).toLocaleDateString('es')}`
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${invoice.total_amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handlePayInvoice(invoice)}
                          disabled={payingInvoice === invoice.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {payingInvoice === invoice.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              Pagar
                            </>
                          )}
                        </button>
                      )}
                      <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
