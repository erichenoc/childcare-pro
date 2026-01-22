/**
 * Rate Limiter for API Routes
 *
 * Simple in-memory rate limiter using sliding window algorithm.
 * Suitable for serverless environments like Vercel.
 *
 * For production at scale, consider using:
 * - Upstash Redis rate limiter
 * - Vercel KV
 * - CloudFlare Workers KV
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string // Custom error message
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: This resets on cold starts in serverless, which is acceptable for basic protection
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (set by Vercel) or falls back to a default
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  // Fallback for local development
  return 'localhost'
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or NextResponse if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string = 'default'
): NextResponse | null {
  cleanupExpiredEntries()

  const clientId = getClientIdentifier(request)
  const key = `${prefix}:${clientId}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    return null
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    console.warn(`[Rate Limit] Exceeded for ${key}: ${entry.count}/${config.max}`)

    return NextResponse.json(
      {
        error: config.message || 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // For public endpoints (leads, appointments from chat widget)
  public: {
    windowMs: 60000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests. Please wait a moment before trying again.',
  },

  // For authenticated endpoints
  authenticated: {
    windowMs: 60000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Request limit exceeded. Please slow down.',
  },

  // For sensitive operations (password reset, etc.)
  strict: {
    windowMs: 300000, // 5 minutes
    max: 5, // 5 requests per 5 minutes
    message: 'Too many attempts. Please wait before trying again.',
  },

  // For chat/AI endpoints (expensive operations)
  ai: {
    windowMs: 60000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Chat rate limit reached. Please wait a moment.',
  },
} as const

export type RateLimitType = keyof typeof RateLimits
