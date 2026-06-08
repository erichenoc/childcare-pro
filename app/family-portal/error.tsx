'use client'

// Segment error boundary for the parent (family) portal.
export default function FamilyPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  if (typeof console !== 'undefined') {
    console.error('[family-portal-error]', error)
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          Algo salió mal
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          No pudimos cargar esta página. Intenta de nuevo en un momento.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
