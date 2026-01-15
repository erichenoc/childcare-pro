import { createClient } from '@/shared/lib/supabase/client'
import type { Invoice, InvoiceWithFamily, Payment, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export const billingService = {
  // Invoices
  async getInvoices(): Promise<InvoiceWithFamily[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        family:families(*)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as InvoiceWithFamily[]
  },

  async getInvoiceById(id: string): Promise<InvoiceWithFamily | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        family:families(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as InvoiceWithFamily
  },

  async getInvoicesByFamily(familyId: string): Promise<Invoice[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createInvoice(invoice: Omit<TablesInsert<'invoices'>, 'organization_id'>): Promise<Invoice> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateInvoice(id: string, invoice: TablesUpdate<'invoices'>): Promise<Invoice> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Payments
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async recordPayment(payment: Omit<TablesInsert<'payments'>, 'organization_id'>): Promise<Payment> {
    const supabase = createClient()

    // Create payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        ...payment,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update invoice amount_paid
    const { data: invoice } = await supabase
      .from('invoices')
      .select('amount_paid, total')
      .eq('id', payment.invoice_id)
      .single()

    if (invoice) {
      const newAmountPaid = (invoice.amount_paid || 0) + payment.amount
      const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'

      await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', payment.invoice_id)
    }

    return paymentData
  },

  // Stats
  async getStats() {
    const supabase = createClient()
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total, amount_paid, status')
      .eq('organization_id', DEMO_ORG_ID)

    if (error) throw error

    const data = invoices || []
    const totalCollected = data.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
    const totalPending = data.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.amount_paid || 0)), 0)
    const paidCount = data.filter(inv => inv.status === 'paid').length
    const overdueCount = data.filter(inv => inv.status === 'overdue').length

    return {
      totalCollected,
      totalPending,
      paidCount,
      overdueCount,
    }
  },

  // Generate next invoice number
  async getNextInvoiceNumber(): Promise<string> {
    const supabase = createClient()
    const year = new Date().getFullYear()

    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', DEMO_ORG_ID)
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].invoice_number.split('-')[2]) || 0
      return `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
    }

    return `INV-${year}-001`
  }
}
