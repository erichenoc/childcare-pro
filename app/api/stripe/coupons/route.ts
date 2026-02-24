import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyAdminAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

/**
 * GET /api/stripe/coupons - List active coupons
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = checkRateLimit(request, RateLimits.authenticated, 'coupons-list')
    if (rateLimited) return rateLimited

    const auth = await verifyAdminAuth()
    if (isAuthError(auth)) return auth.response

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured', demo: true }, { status: 503 })
    }

    // List active coupons from Stripe
    const coupons = await stripe.coupons.list({ limit: 50 })

    // Also list promotion codes
    const promoCodes = await stripe.promotionCodes.list({ limit: 50, active: true })

    return NextResponse.json({
      coupons: coupons.data.map(c => ({
        id: c.id,
        name: c.name,
        percentOff: c.percent_off,
        amountOff: c.amount_off,
        currency: c.currency,
        duration: c.duration,
        durationInMonths: c.duration_in_months,
        maxRedemptions: c.max_redemptions,
        timesRedeemed: c.times_redeemed,
        valid: c.valid,
      })),
      promoCodes: promoCodes.data.map(p => ({
        id: p.id,
        code: p.code,
        couponId: typeof p.promotion.coupon === 'string'
          ? p.promotion.coupon
          : p.promotion.coupon?.id || null,
        active: p.active,
        maxRedemptions: p.max_redemptions,
        timesRedeemed: p.times_redeemed,
        expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
      })),
    })
  } catch (error) {
    console.error('Error listing coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/stripe/coupons - Create a new coupon + promotion code
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'coupons-create')
    if (rateLimited) return rateLimited

    const auth = await verifyAdminAuth()
    if (isAuthError(auth)) return auth.response

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured', demo: true }, { status: 503 })
    }

    const body = await request.json()
    const {
      name,
      code,
      percentOff,
      amountOffCents,
      duration = 'once',
      durationInMonths,
      maxRedemptions,
      expiresAt,
    } = body

    // Validate
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      )
    }

    if (!percentOff && !amountOffCents) {
      return NextResponse.json(
        { error: 'Must provide either percentOff or amountOffCents' },
        { status: 400 }
      )
    }

    if (!['once', 'repeating', 'forever'].includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be once, repeating, or forever.' },
        { status: 400 }
      )
    }

    if (duration === 'repeating' && !durationInMonths) {
      return NextResponse.json(
        { error: 'durationInMonths is required when duration is repeating.' },
        { status: 400 }
      )
    }

    // Create coupon in Stripe
    const couponParams: Stripe.CouponCreateParams = {
      name,
      duration: duration as Stripe.CouponCreateParams['duration'],
      ...(percentOff ? { percent_off: percentOff } : {}),
      ...(amountOffCents ? { amount_off: amountOffCents, currency: 'usd' } : {}),
      ...(duration === 'repeating' ? { duration_in_months: durationInMonths } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    }

    const coupon = await stripe.coupons.create(couponParams)

    // Create a promotion code (user-facing code) for the coupon
    const promoCode = await stripe.promotionCodes.create({
      promotion: { coupon: coupon.id, type: 'coupon' },
      code: code.toUpperCase(),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAt ? { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
    })

    // Save to Supabase for tracking
    const supabase = await createClient()
    await supabase.from('stripe_coupons').insert({
      stripe_coupon_id: coupon.id,
      code: code.toUpperCase(),
      name,
      percent_off: percentOff || null,
      amount_off: amountOffCents || null,
      duration,
      duration_in_months: durationInMonths || null,
      max_redemptions: maxRedemptions || null,
      valid: true,
      expires_at: expiresAt || null,
    })

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        duration: coupon.duration,
      },
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
      },
    })
  } catch (error) {
    console.error('Error creating coupon:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
