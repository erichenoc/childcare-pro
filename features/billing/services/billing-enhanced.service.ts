import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Invoice, InvoiceWithFamily, Payment } from '@/shared/types/database.types'

// Types for enhanced billing
export type BillingPeriod = 'weekly' | 'biweekly' | 'monthly'
export type InvoiceLineItemType = 'tuition' | 'registration' | 'materials' | 'meals' | 'late_fee' | 'discount' | 'other'

export interface InvoiceLineItem {
  id?: string
  invoice_id?: string
  item_type: InvoiceLineItemType
  description: string
  quantity: number
  unit_price: number
  total: number
  child_id?: string
  child_name?: string
  period_start?: string
  period_end?: string
}

export interface MultiWeekInvoiceData {
  family_id: string
  billing_period?: BillingPeriod
  start_date?: string
  end_date?: string
  children?: {
    child_id: string
    child_name: string
    weekly_rate: number
    days_per_week: number
    weeks_included: number
  }[]
  // Alternative format used by multi-week page
  child_rates?: {
    child_id: string
    child_name: string
    weekly_rate: number
    days_per_week: number
  }[]
  billing_periods?: {
    week_start: string
    week_end: string
    days_attended: number
  }[]
  due_date?: string
  discount?: number
  additional_items?: InvoiceLineItem[]
  discount_percent?: number
  discount_amount?: number
  notes?: string
}

export interface InvoiceWithLineItems extends Omit<Invoice, 'line_items'> {
  line_items?: InvoiceLineItem[]
  family?: {
    id: string
    primary_contact_name: string
    primary_contact_email: string | null
    primary_contact_phone: string | null
    address: string | null
  }
  payments?: Payment[]
}

export interface InvoicePDFData {
  invoice: InvoiceWithLineItems
  organization: {
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    phone: string | null
    email: string | null
    logo_url: string | null
    tax_id: string | null
  }
}

// Rate templates for common scenarios
export const RATE_TEMPLATES = {
  infant_fulltime: {
    name: 'Infante - Tiempo Completo',
    weekly_rate: 350,
    age_group: 'infant',
    days_per_week: 5,
  },
  infant_parttime: {
    name: 'Infante - Medio Tiempo',
    weekly_rate: 225,
    age_group: 'infant',
    days_per_week: 3,
  },
  toddler_fulltime: {
    name: 'Toddler - Tiempo Completo',
    weekly_rate: 300,
    age_group: 'toddler',
    days_per_week: 5,
  },
  toddler_parttime: {
    name: 'Toddler - Medio Tiempo',
    weekly_rate: 195,
    age_group: 'toddler',
    days_per_week: 3,
  },
  preschool_fulltime: {
    name: 'Preescolar - Tiempo Completo',
    weekly_rate: 275,
    age_group: 'preschool',
    days_per_week: 5,
  },
  preschool_parttime: {
    name: 'Preescolar - Medio Tiempo',
    weekly_rate: 175,
    age_group: 'preschool',
    days_per_week: 3,
  },
  school_age_afterschool: {
    name: 'Edad Escolar - After School',
    weekly_rate: 150,
    age_group: 'school_age',
    days_per_week: 5,
  },
  twos_fulltime: {
    name: '2 Años - Tiempo Completo',
    weekly_rate: 285,
    age_group: 'twos',
    days_per_week: 5,
  },
  twos_parttime: {
    name: '2 Años - Medio Tiempo',
    weekly_rate: 185,
    age_group: 'twos',
    days_per_week: 3,
  },
  schoolage_fulltime: {
    name: 'Edad Escolar - Tiempo Completo',
    weekly_rate: 200,
    age_group: 'school_age',
    days_per_week: 5,
  },
  schoolage_parttime: {
    name: 'Edad Escolar - Medio Tiempo',
    weekly_rate: 125,
    age_group: 'school_age',
    days_per_week: 3,
  },
}

// Export the type for rate template keys
export type RateTemplateKey = keyof typeof RATE_TEMPLATES

export const billingEnhancedService = {
  /**
   * Generate a multi-week invoice
   */
  async generateMultiWeekInvoice(data: MultiWeekInvoiceData): Promise<InvoiceWithLineItems> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Generate invoice number
    const year = new Date().getFullYear()
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', orgId)
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (lastInvoice && lastInvoice.length > 0) {
      const lastNum = parseInt(lastInvoice[0].invoice_number.split('-')[2]) || 0
      nextNumber = lastNum + 1
    }
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`

    // Calculate totals from line items
    const lineItems: InvoiceLineItem[] = []
    let subtotal = 0

    // Add tuition for each child
    const children = data.children || data.child_rates || []
    const numWeeks = data.billing_periods?.length || 1
    for (const child of children) {
      const weeksIncluded: number = 'weeks_included' in child ? (child.weeks_included as number) : numWeeks
      const total = child.weekly_rate * weeksIncluded
      subtotal += total

      lineItems.push({
        item_type: 'tuition',
        description: `Tuición - ${child.child_name} (${weeksIncluded} semanas)`,
        quantity: weeksIncluded,
        unit_price: child.weekly_rate,
        total,
        child_id: child.child_id,
        child_name: child.child_name,
        period_start: data.start_date,
        period_end: data.end_date,
      })
    }

    // Add additional items
    if (data.additional_items) {
      for (const item of data.additional_items) {
        subtotal += item.total
        lineItems.push(item)
      }
    }

    // Apply discounts
    let discountTotal = 0
    if (data.discount_percent && data.discount_percent > 0) {
      discountTotal = subtotal * (data.discount_percent / 100)
      lineItems.push({
        item_type: 'discount',
        description: `Descuento (${data.discount_percent}%)`,
        quantity: 1,
        unit_price: -discountTotal,
        total: -discountTotal,
      })
    } else if (data.discount_amount && data.discount_amount > 0) {
      discountTotal = data.discount_amount
      lineItems.push({
        item_type: 'discount',
        description: 'Descuento aplicado',
        quantity: 1,
        unit_price: -discountTotal,
        total: -discountTotal,
      })
    }

    const grandTotal = subtotal - discountTotal

    // Calculate due date based on billing period
    const startDateStr = data.start_date || data.billing_periods?.[0]?.week_start || new Date().toISOString()
    const dueDate = new Date(startDateStr)
    dueDate.setDate(dueDate.getDate() - 3) // Due 3 days before period starts

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        family_id: data.family_id,
        invoice_number: invoiceNumber,
        total: grandTotal,
        subtotal,
        discount: discountTotal,
        amount_paid: 0,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        period_start: data.start_date,
        period_end: data.end_date,
        billing_period: data.billing_period,
        notes: data.notes || null,
        line_items: lineItems,
      })
      .select(`
        *,
        family:families(id, primary_contact_name, primary_contact_email, primary_contact_phone, address)
      `)
      .single()

    if (invoiceError) throw invoiceError

    return {
      ...invoice,
      line_items: lineItems,
    } as InvoiceWithLineItems
  },

  /**
   * Get invoice with line items
   */
  async getInvoiceWithDetails(id: string): Promise<InvoiceWithLineItems | null> {
    const supabase = createClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        family:families(id, primary_contact_name, primary_contact_email, primary_contact_phone, address)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('paid_at', { ascending: false })

    // Parse line items from JSON column
    const lineItems = (invoice.line_items as InvoiceLineItem[]) || []

    return {
      ...invoice,
      line_items: lineItems,
      payments: payments || [],
    } as InvoiceWithLineItems
  },

  /**
   * Get data for PDF generation
   */
  async getInvoicePDFData(id: string): Promise<InvoicePDFData | null> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get invoice with details
    const invoice = await this.getInvoiceWithDetails(id)
    if (!invoice) return null

    // Get organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, address, city, state, zip, phone, email, logo_url, tax_id')
      .eq('id', orgId)
      .single()

    return {
      invoice,
      organization: org || {
        name: 'ChildCare Pro',
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        email: null,
        logo_url: null,
        tax_id: null,
      },
    }
  },

  /**
   * Generate invoices for multiple families at once
   */
  async bulkGenerateInvoices(
    familyIds: string[],
    billingPeriod: BillingPeriod,
    startDate: string,
    endDate: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] }
    const supabase = createClient()

    for (const familyId of familyIds) {
      try {
        // Get children in this family with their rates
        const { data: children } = await supabase
          .from('children')
          .select('id, first_name, last_name, weekly_rate')
          .eq('family_id', familyId)
          .eq('status', 'active')

        if (!children || children.length === 0) {
          results.errors.push(`Family ${familyId}: No active children found`)
          results.failed++
          continue
        }

        // Calculate weeks in period
        const start = new Date(startDate)
        const end = new Date(endDate)
        const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))

        await this.generateMultiWeekInvoice({
          family_id: familyId,
          billing_period: billingPeriod,
          start_date: startDate,
          end_date: endDate,
          children: children.map(c => ({
            child_id: c.id,
            child_name: `${c.first_name} ${c.last_name}`,
            weekly_rate: c.weekly_rate || 250,
            days_per_week: 5,
            weeks_included: weeks,
          })),
        })

        results.success++
      } catch (error) {
        results.errors.push(`Family ${familyId}: ${(error as Error).message}`)
        results.failed++
      }
    }

    return results
  },

  /**
   * Get billing summary by period
   */
  async getBillingSummary(startDate: string, endDate: string) {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, amount_paid, status, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_method, paid_at')
      .eq('organization_id', orgId)
      .gte('paid_at', startDate)
      .lte('paid_at', endDate)

    const data = invoices || []
    const paymentData = payments || []

    // Calculate totals
    const totalInvoiced = data.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const totalCollected = paymentData.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalOutstanding = totalInvoiced - totalCollected

    // Group by payment method
    const byPaymentMethod = paymentData.reduce((acc, p) => {
      const method = p.payment_method || 'other'
      if (!acc[method]) acc[method] = 0
      acc[method] += p.amount || 0
      return acc
    }, {} as Record<string, number>)

    // Count by status
    const byStatus = data.reduce((acc, inv) => {
      const status = inv.status || 'draft'
      if (!acc[status]) acc[status] = 0
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      invoiceCount: data.length,
      paymentCount: paymentData.length,
      byPaymentMethod,
      byStatus,
    }
  },

  /**
   * Apply late fee to overdue invoices
   */
  async applyLateFees(feeAmount: number, feePercent?: number): Promise<number> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get overdue invoices without late fee applied
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, total, line_items')
      .eq('organization_id', orgId)
      .eq('status', 'overdue')
      .lt('due_date', today)

    let updated = 0

    for (const invoice of overdueInvoices || []) {
      const lineItems = (invoice.line_items as InvoiceLineItem[]) || []

      // Check if late fee already applied
      const hasLateFee = lineItems.some(item => item.item_type === 'late_fee')
      if (hasLateFee) continue

      // Calculate fee
      const fee = feePercent
        ? invoice.total * (feePercent / 100)
        : feeAmount

      // Add late fee line item
      lineItems.push({
        item_type: 'late_fee',
        description: 'Cargo por Pago Tardío',
        quantity: 1,
        unit_price: fee,
        total: fee,
      })

      // Update invoice
      await supabase
        .from('invoices')
        .update({
          total: invoice.total + fee,
          line_items: lineItems,
        })
        .eq('id', invoice.id)

      updated++
    }

    return updated
  },

  /**
   * Get families with outstanding balances
   */
  async getFamiliesWithBalance(): Promise<{
    family_id: string
    family_name: string
    total_owed: number
    oldest_invoice_date: string
    invoice_count: number
  }[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        family_id,
        total,
        amount_paid,
        created_at,
        family:families(primary_contact_name)
      `)
      .eq('organization_id', orgId)
      .in('status', ['sent', 'partial', 'overdue'])

    if (!invoices) return []

    // Group by family
    const familyBalances = new Map<string, {
      family_id: string
      family_name: string
      total_owed: number
      oldest_invoice_date: string
      invoice_count: number
    }>()

    for (const inv of invoices) {
      const balance = (inv.total || 0) - (inv.amount_paid || 0)
      if (balance <= 0) continue

      const existing = familyBalances.get(inv.family_id)
      const familyData = inv.family
      const family = Array.isArray(familyData) ? familyData[0] : familyData

      if (existing) {
        existing.total_owed += balance
        existing.invoice_count++
        if (inv.created_at < existing.oldest_invoice_date) {
          existing.oldest_invoice_date = inv.created_at
        }
      } else {
        familyBalances.set(inv.family_id, {
          family_id: inv.family_id,
          family_name: family?.primary_contact_name || 'Desconocido',
          total_owed: balance,
          oldest_invoice_date: inv.created_at,
          invoice_count: 1,
        })
      }
    }

    return Array.from(familyBalances.values())
      .sort((a, b) => b.total_owed - a.total_owed)
  },
}
