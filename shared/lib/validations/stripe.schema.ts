/**
 * Zod validation schemas for Stripe API
 *
 * Used to validate input data and prevent injection attacks
 */

import { z } from 'zod'

// Schema for creating a Stripe checkout session (POST /api/stripe/checkout)
export const createCheckoutSessionSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID format'),
  amount: z.coerce.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum'),
  invoiceNumber: z.string().max(50),
  familyName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  successUrl: z.string().url('Invalid success URL').max(2000).optional(),
  cancelUrl: z.string().url('Invalid cancel URL').max(2000).optional()
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
