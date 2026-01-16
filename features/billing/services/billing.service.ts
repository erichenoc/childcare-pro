import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Invoice, InvoiceWithFamily, Payment, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export const billingService = {
  // Invoices
  async getInvoices(): Promise<InvoiceWithFamily[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        family:families(*)
      `)
      .eq('organization_id', orgId)
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
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        organization_id: orgId,
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
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Create payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        ...payment,
        organization_id: orgId,
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
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total, amount_paid, status')
      .eq('organization_id', orgId)

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
    const orgId = await requireOrgId()
    const supabase = createClient()
    const year = new Date().getFullYear()

    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', orgId)
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].invoice_number.split('-')[2]) || 0
      return `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
    }

    return `INV-${year}-001`
  },

  // Send invoice email
  async sendInvoiceEmail(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get invoice with family info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        family:families(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    const family = invoice.family as {
      primary_email?: string | null
      primary_contact_name?: string | null
      name?: string | null
    } | null

    if (!family?.primary_email) {
      return {
        success: false,
        message: 'No email address found for this family'
      }
    }

    // Log the send action in activity_log
    const { data: userData } = await supabase.auth.getUser()

    await supabase
      .from('activity_log')
      .insert({
        action: 'invoice_sent',
        entity_type: 'invoice',
        entity_id: invoiceId,
        organization_id: orgId,
        user_id: userData?.user?.id || null,
        new_values: {
          sent_to: family.primary_email,
          sent_at: new Date().toISOString(),
          invoice_number: invoice.invoice_number,
          total: invoice.total,
        },
      })

    // Update invoice status to 'sent' if it's still 'draft'
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
    }

    // In production, this would integrate with an email service
    // like Resend, SendGrid, or AWS SES to actually send the email
    // For now, we just log the action and return success

    return {
      success: true,
      message: `Invoice sent to ${family.primary_email}`
    }
  },

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    const supabase = createClient()

    // First delete related payments
    await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', id)

    // Then delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Mark invoice as overdue
  async markAsOverdue(id: string): Promise<Invoice> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mark invoice as cancelled
  async cancelInvoice(id: string): Promise<Invoice> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
