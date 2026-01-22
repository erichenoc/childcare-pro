/**
 * Zod validation schemas for Leads API
 *
 * Used to validate input data and prevent injection attacks
 */

import { z } from 'zod'

// Schema for creating a new lead (POST /api/leads)
export const createLeadSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email('Invalid email format').max(255).optional(),
  phone: z.string().max(20).regex(/^[\d\s\-+()]*$/, 'Invalid phone format').optional(),
  company_name: z.string().max(200).optional(),
  source: z.enum([
    'chat_widget',
    'landing_page',
    'referral',
    'organic',
    'paid_ads',
    'social_media',
    'email_campaign',
    'other'
  ]).default('chat_widget'),
  daycare_size: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  current_pain_points: z.array(z.string().max(500)).max(10).optional(),
  interested_features: z.array(z.string().max(100)).max(20).optional(),
  conversation_history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(10000)
    })
  ).max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  referrer_url: z.string().url().max(2000).optional().or(z.literal('')),
  landing_page: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional()
}).refine(
  (data) => data.email || data.phone || data.name,
  { message: 'At least one contact field is required (name, email, or phone)' }
)

// Schema for GET query parameters
export const getLeadsQuerySchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'demo_scheduled', 'converted', 'lost']).optional(),
  source: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'score', 'name']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type GetLeadsQuery = z.infer<typeof getLeadsQuerySchema>
