'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Save,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { billingService } from '@/features/billing/services/billing.service'
import { familiesService } from '@/features/families/services/families.service'
import type { Family } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export default function NewInvoicePage() {
  const t = useTranslations()
  const { formatCurrency } = useI18n()
  const router = useRouter()

  const [families, setFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
  ])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [familiesData, nextNumber] = await Promise.all([
        familiesService.getAll(),
        billingService.getNextInvoiceNumber(),
      ])
      setFamilies(familiesData)
      setInvoiceNumber(nextNumber)

      // Set default dates (current month)
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const dueDay = new Date(now.getFullYear(), now.getMonth() + 1, 15)

      setPeriodStart(firstDay.toISOString().split('T')[0])
      setPeriodEnd(lastDay.toISOString().split('T')[0])
      setDueDate(dueDay.toISOString().split('T')[0])
    } catch (err) {
      console.error('Error loading data:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
    ])
  }

  function removeLineItem(id: string) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const discountAmount = discount
  const taxAmount = (subtotal - discountAmount) * (tax / 100)
  const total = subtotal - discountAmount + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFamilyId) {
      setError(t.billing.selectFamily || 'Por favor selecciona una familia')
      return
    }

    if (lineItems.every(item => !item.description || item.unitPrice === 0)) {
      setError(t.billing.addLineItems || 'Agrega al menos una línea de factura')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await billingService.createInvoice({
        family_id: selectedFamilyId,
        invoice_number: invoiceNumber,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        amount_paid: 0,
        status: 'pending',
        notes: notes || null,
        line_items: lineItems.filter(item => item.description && item.unitPrice > 0).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.quantity * item.unitPrice
        })),
      })

      router.push('/dashboard/billing')
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(t.errors.somethingWentWrong)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const familyOptions = [
    { value: '', label: t.common.selectOption },
    ...families.map(f => ({
      value: f.id,
      label: f.primary_contact_name
    }))
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.billing.createInvoice}
          </h1>
          <p className="text-gray-500">{invoiceNumber}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family Selection */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.families.familyName || 'Familia'}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <GlassSelect
                  label={t.families.familyName}
                  options={familyOptions}
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  required
                />
              </GlassCardContent>
            </GlassCard>

            {/* Period & Due Date */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.billing.period || 'Período'}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassInput
                    type="date"
                    label={t.billing.periodStart}
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    leftIcon={<Calendar className="w-5 h-5" />}
                    required
                  />
                  <GlassInput
                    type="date"
                    label={t.billing.periodEnd}
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    leftIcon={<Calendar className="w-5 h-5" />}
                    required
                  />
                  <GlassInput
                    type="date"
                    label={t.billing.dueDate}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    leftIcon={<Calendar className="w-5 h-5" />}
                    required
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Line Items */}
            <GlassCard>
              <GlassCardHeader className="flex flex-row items-center justify-between">
                <GlassCardTitle>{t.billing.lineItems}</GlassCardTitle>
                <GlassButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addLineItem}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t.billing.addLineItem}
                </GlassButton>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 text-sm font-medium text-gray-600 px-2">
                    <div className="col-span-5">{t.billing.description}</div>
                    <div className="col-span-2 text-center">{t.billing.quantity}</div>
                    <div className="col-span-2 text-center">{t.billing.unitPrice}</div>
                    <div className="col-span-2 text-right">{t.billing.total}</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Line Items */}
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="sm:col-span-5">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">{t.billing.description}</label>
                        <GlassInput
                          placeholder={t.billing.description}
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">{t.billing.quantity}</label>
                        <GlassInput
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-center"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">{t.billing.unitPrice}</label>
                        <GlassInput
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          leftIcon={<DollarSign className="w-4 h-4" />}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-end">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Notes */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>{t.billing.notes}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <textarea
                  className="w-full p-3 rounded-xl bg-neu-bg shadow-neu-inset dark:bg-neu-bg-dark dark:shadow-neu-inset-dark border-0 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                  rows={3}
                  placeholder={t.billing.notesPlaceholder || 'Notas adicionales...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Totals Card */}
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>{t.billing.amount || 'Resumen'}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.billing.subtotal}</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">{t.billing.discount}</label>
                    <GlassInput
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      leftIcon={<DollarSign className="w-4 h-4" />}
                    />
                  </div>

                  {/* Tax */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">{t.billing.tax} (%)</label>
                    <GlassInput
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      value={tax || ''}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    />
                    {tax > 0 && (
                      <p className="text-xs text-gray-500 text-right">
                        = {formatCurrency(taxAmount)}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">{t.billing.total}</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Actions */}
              <div className="space-y-3">
                <GlassButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {t.billing.createInvoice}
                </GlassButton>
                <Link href="/dashboard/billing" className="block">
                  <GlassButton type="button" variant="secondary" fullWidth>
                    {t.common.cancel}
                  </GlassButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
