import * as Sentry from '@sentry/nextjs'

// Server-side Sentry. No-op until NEXT_PUBLIC_SENTRY_DSN is set, so the build and
// runtime are unaffected until you wire your Sentry project.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Don't capture request bodies / headers that may contain PII.
  sendDefaultPii: false,
})
