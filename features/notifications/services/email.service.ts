// Email Service - ChildCare Pro
// Uses Resend for transactional email delivery

import { Resend } from 'resend'

// ============================================
// TYPES
// ============================================

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  tags?: Array<{ name: string; value: string }>
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

export interface BulkEmailResult {
  total: number
  sent: number
  failed: number
  results: EmailResult[]
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export const EMAIL_TEMPLATES = {
  paymentFailed: (params: { organizationName: string; amount: string; retryUrl: string }) => ({
    subject: 'Action Required: Payment Failed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              We were unable to process your payment of <strong>${params.amount}</strong> for <strong>${params.organizationName}</strong>.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Please update your payment method to avoid any interruption to your service.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${params.retryUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Update Payment Method
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
              If you have any questions, please contact our support team.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ChildCare Pro - Professional Childcare Management
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  paymentSuccess: (params: { organizationName: string; amount: string; invoiceNumber: string }) => ({
    subject: `Payment Received - Invoice #${params.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Received</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Thank you! We've received your payment of <strong>${params.amount}</strong> for invoice <strong>#${params.invoiceNumber}</strong>.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; font-size: 14px; margin: 0;">
                ✓ Payment successfully processed
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
              If you have any questions, please contact us.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ${params.organizationName} - Powered by ChildCare Pro
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  invoiceDue: (params: { familyName: string; amount: string; dueDate: string; invoiceNumber: string; paymentUrl: string }) => ({
    subject: `Invoice #${params.invoiceNumber} Due ${params.dueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice Due</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Invoice Due</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Hello ${params.familyName},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              This is a reminder that invoice <strong>#${params.invoiceNumber}</strong> for <strong>${params.amount}</strong> is due on <strong>${params.dueDate}</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${params.paymentUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Pay Now
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
              Thank you for your prompt payment!
            </p>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ChildCare Pro - Professional Childcare Management
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  childCheckedIn: (params: { parentName: string; childName: string; time: string; checkedInBy: string }) => ({
    subject: `${params.childName} has arrived safely`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-In Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✓ Check-In Confirmed</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Good morning ${params.parentName}!
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              <strong>${params.childName}</strong> was checked in at <strong>${params.time}</strong> by ${params.checkedInBy}.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
              Have a great day!
            </p>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ChildCare Pro - Professional Childcare Management
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  emergencyAlert: (params: { title: string; message: string; centerName: string; contactPhone: string }) => ({
    subject: `🚨 URGENT: ${params.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emergency Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 16px;">
              ${params.title}
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${params.message}
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #dc2626; font-size: 14px; margin: 0; font-weight: 600;">
                For questions, call: ${params.contactPhone}
              </p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ${params.centerName}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  genericNotification: (params: { subject: string; body: string; centerName?: string }) => ({
    subject: params.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${params.subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${params.subject}</h1>
          </div>
          <div style="padding: 32px;">
            <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
              ${params.body}
            </div>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ${params.centerName || 'ChildCare Pro'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
}

// ============================================
// SERVICE CLASS
// ============================================

class EmailService {
  private resend: Resend | null = null
  private defaultFrom: string = 'ChildCare Pro <notifications@childcarepro.app>'

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    }
  }

  private getClient(): Resend | null {
    if (!this.resend && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    }
    return this.resend
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    const client = this.getClient()

    if (!client) {
      console.warn('Resend not configured - email not sent:', options.subject)
      return {
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      }
    }

    try {
      const { data, error } = await client.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      })

      if (error) {
        console.error('Resend error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Email send error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async sendBulk(emails: EmailOptions[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = []
    let sent = 0
    let failed = 0

    for (const email of emails) {
      const result = await this.send(email)
      results.push(result)
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    return {
      total: emails.length,
      sent,
      failed,
      results,
    }
  }

  // Convenience methods for common emails

  async sendPaymentFailed(to: string, params: { organizationName: string; amount: string; retryUrl: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.paymentFailed(params)
    return this.send({ to, ...template })
  }

  async sendPaymentSuccess(to: string, params: { organizationName: string; amount: string; invoiceNumber: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.paymentSuccess(params)
    return this.send({ to, ...template })
  }

  async sendInvoiceDue(to: string, params: { familyName: string; amount: string; dueDate: string; invoiceNumber: string; paymentUrl: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.invoiceDue(params)
    return this.send({ to, ...template })
  }

  async sendChildCheckedIn(to: string, params: { parentName: string; childName: string; time: string; checkedInBy: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.childCheckedIn(params)
    return this.send({ to, ...template })
  }

  async sendEmergencyAlert(to: string | string[], params: { title: string; message: string; centerName: string; contactPhone: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.emergencyAlert(params)
    return this.send({ to, ...template })
  }

  async sendGenericNotification(to: string | string[], params: { subject: string; body: string; centerName?: string }): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.genericNotification(params)
    return this.send({ to, ...template })
  }

  isConfigured(): boolean {
    return !!this.getClient()
  }
}

// Export singleton instance
export const emailService = new EmailService()
