/**
 * Audit Logger for Security-Sensitive Operations
 *
 * Logs important actions for compliance, security monitoring, and debugging.
 * Stores logs in Supabase audit_logs table and optionally to console.
 */

import { createClient } from '@/shared/lib/supabase/server'

export type AuditAction =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'ADMIN_ACCESS'
  | 'ADMIN_DENIED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'LEAD_CREATED'
  | 'APPOINTMENT_CREATED'
  | 'DATA_EXPORT'
  | 'SENSITIVE_DATA_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_FAILED'
  | 'SECURITY_ALERT'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

interface AuditLogEntry {
  action: AuditAction
  severity: AuditSeverity
  userId?: string
  userEmail?: string
  organizationId?: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Log an audit event
 *
 * This logs to both console and Supabase for persistence.
 * Console logging allows immediate visibility in logs.
 * Supabase storage enables querying and compliance reporting.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date().toISOString()

  // Create structured log message for console
  const consoleEntry = {
    timestamp,
    ...entry,
    // Mask sensitive data in console logs
    details: entry.details ? maskSensitiveData(entry.details) : undefined,
  }

  // Log to console based on severity
  const logPrefix = `[AUDIT:${entry.severity.toUpperCase()}]`
  switch (entry.severity) {
    case 'critical':
    case 'error':
      console.error(logPrefix, JSON.stringify(consoleEntry))
      break
    case 'warning':
      console.warn(logPrefix, JSON.stringify(consoleEntry))
      break
    default:
      console.log(logPrefix, JSON.stringify(consoleEntry))
  }

  // Persist to Supabase (async, don't block the request)
  persistAuditLog(entry, timestamp).catch((error) => {
    console.error('[Audit Logger] Failed to persist audit log:', error)
  })
}

/**
 * Persist audit log to Supabase
 */
async function persistAuditLog(entry: AuditLogEntry, timestamp: string): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('audit_logs').insert({
      action: entry.action,
      severity: entry.severity,
      user_id: entry.userId,
      user_email: entry.userEmail,
      organization_id: entry.organizationId,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      details: entry.details,
      metadata: entry.metadata,
      created_at: timestamp,
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break main functionality
    console.error('[Audit Logger] Database insert failed:', error)
  }
}

/**
 * Mask sensitive data before logging to console
 */
function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'credit_card', 'ssn']
  const masked: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      masked[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>)
    } else {
      masked[key] = value
    }
  }

  return masked
}

/**
 * Helper to extract client info from request headers
 */
export function getClientInfo(headers: Headers): { ipAddress: string; userAgent: string } {
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const userAgent = headers.get('user-agent') || 'unknown'

  let ipAddress = 'unknown'
  if (forwardedFor) {
    ipAddress = forwardedFor.split(',')[0].trim()
  } else if (realIp) {
    ipAddress = realIp
  }

  return { ipAddress, userAgent }
}

/**
 * Pre-configured audit loggers for common scenarios
 */
export const AuditLogger = {
  async adminAccess(
    userEmail: string,
    userId: string,
    resource: string,
    headers: Headers
  ): Promise<void> {
    const { ipAddress, userAgent } = getClientInfo(headers)
    await logAuditEvent({
      action: 'ADMIN_ACCESS',
      severity: 'info',
      userId,
      userEmail,
      resourceType: 'admin_panel',
      resourceId: resource,
      ipAddress,
      userAgent,
    })
  },

  async adminDenied(
    userEmail: string | undefined,
    reason: string,
    headers: Headers
  ): Promise<void> {
    const { ipAddress, userAgent } = getClientInfo(headers)
    await logAuditEvent({
      action: 'ADMIN_DENIED',
      severity: 'warning',
      userEmail,
      ipAddress,
      userAgent,
      details: { reason },
    })
  },

  async paymentInitiated(
    userId: string,
    organizationId: string,
    invoiceId: string,
    amount: number,
    headers: Headers
  ): Promise<void> {
    const { ipAddress, userAgent } = getClientInfo(headers)
    await logAuditEvent({
      action: 'PAYMENT_INITIATED',
      severity: 'info',
      userId,
      organizationId,
      resourceType: 'invoice',
      resourceId: invoiceId,
      ipAddress,
      userAgent,
      details: { amount },
    })
  },

  async paymentCompleted(
    invoiceId: string,
    organizationId: string,
    amount: number,
    stripeSessionId?: string
  ): Promise<void> {
    await logAuditEvent({
      action: 'PAYMENT_COMPLETED',
      severity: 'info',
      organizationId,
      resourceType: 'invoice',
      resourceId: invoiceId,
      details: { amount, stripeSessionId },
    })
  },

  async securityAlert(
    message: string,
    details: Record<string, unknown>,
    headers?: Headers
  ): Promise<void> {
    const clientInfo = headers ? getClientInfo(headers) : { ipAddress: 'unknown', userAgent: 'unknown' }
    await logAuditEvent({
      action: 'SECURITY_ALERT',
      severity: 'critical',
      ...clientInfo,
      details: { message, ...details },
    })
  },

  async leadCreated(
    leadId: string,
    source: string,
    headers: Headers
  ): Promise<void> {
    const { ipAddress, userAgent } = getClientInfo(headers)
    await logAuditEvent({
      action: 'LEAD_CREATED',
      severity: 'info',
      resourceType: 'lead',
      resourceId: leadId,
      ipAddress,
      userAgent,
      details: { source },
    })
  },
}
