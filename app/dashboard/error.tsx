'use client'

// Segment error boundary for the whole dashboard. A thrown error in any dashboard
// page now renders a branded, recoverable fallback instead of taking the route down.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  if (typeof console !== 'undefined') {
    console.error('[dashboard-error]', error)
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          No pudimos cargar esta sección
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Ocurrió un error al cargar los datos. Esto puede ser temporal. Intenta de
          nuevo; si continúa, contacta a soporte.
        </p>
        {error?.digest && (
          <p className="mb-4 text-xs text-slate-400">Ref: {error.digest}</p>
        )}
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
