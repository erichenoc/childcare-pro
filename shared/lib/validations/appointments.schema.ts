/**
 * Zod validation schemas for Appointments API
 *
 * Used to validate input data and prevent injection attacks
 */

import { z } from 'zod'

// Schema for creating a new appointment (POST /api/appointments)
export const createAppointmentSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID format').optional(),
  title: z.string().max(200).default('Product Demo - ChildCare AI'),
  description: z.string().max(2000).optional(),
  appointment_type: z.enum([
    'demo',
    'consultation',
    'follow_up',
    'onboarding',
    'support',
    'other'
  ]).default('demo'),
  scheduled_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
  ),
  scheduled_time: z.string().regex(
    /^\d{2}:\d{2}(:\d{2})?$/,
    'Time must be in HH:MM or HH:MM:SS format'
  ),
  duration_minutes: z.coerce.number().int().min(15).max(480).default(30),
  timezone: z.string().max(50).default('America/New_York'),
  lead_name: z.string().max(100).optional(),
  lead_email: z.string().email('Invalid email format').max(255).optional(),
  lead_phone: z.string().max(20).regex(/^[\d\s\-+()]*$/, 'Invalid phone format').optional(),
  meeting_notes: z.string().max(5000).optional()
})

// Schema for GET query parameters
export const getAppointmentsQuerySchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  lead_id: z.string().uuid('Invalid lead ID format').optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>
