'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

// Root error boundary. Catches errors thrown in the root layout/template and
// any unhandled render error not caught by a nested error.tsx. Must render its
// own <html>/<body>. Replaces the previous behavior where any such error showed
// Next.js's default screen with no recovery and no record.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            Ocurrió un error inesperado. Puedes intentar de nuevo. Si el problema
            persiste, contacta a soporte.
          </p>
          {error?.digest && (
            <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
