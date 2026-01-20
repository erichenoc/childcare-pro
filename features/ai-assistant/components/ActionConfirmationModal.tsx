'use client'

// =====================================================
// Action Confirmation Modal
// =====================================================
// Modal for confirming AI-initiated actions

import { AlertTriangle, Check, X, Info } from 'lucide-react'
import type { PendingConfirmation } from '../types'
import { getToolInfo } from '../tools/definitions'

interface ActionConfirmationModalProps {
  action: PendingConfirmation
  onConfirm: () => void
  onCancel: () => void
}

// Category icons
const categoryIcons: Record<string, string> = {
  attendance: '👶',
  billing: '💰',
  incidents: '⚠️',
  communication: '✉️',
  children: '🧒',
  families: '👨‍👩‍👧',
  staff: '👤',
  classrooms: '🏫',
}

// Category colors
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  attendance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  billing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  incidents: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  communication: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  children: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  families: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  staff: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  classrooms: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

// Format parameter value for display
function formatParamValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'number') {
    if (key.includes('amount') || key.includes('price') || key.includes('rate')) {
      return `$${value.toFixed(2)}`
    }
    return value.toString()
  }
  if (typeof value === 'string') {
    // Format dates
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    return value
  }
  return JSON.stringify(value)
}

// Format parameter key for display
function formatParamKey(key: string): string {
  const translations: Record<string, string> = {
    child_id: 'ID Niño',
    family_id: 'ID Familia',
    classroom_id: 'ID Salón',
    staff_id: 'ID Empleado',
    invoice_id: 'ID Factura',
    amount: 'Monto',
    description: 'Descripción',
    due_date: 'Fecha de Vencimiento',
    incident_type: 'Tipo de Incidente',
    severity: 'Severidad',
    first_aid_given: 'Primeros Auxilios',
    drop_off_person: 'Persona que Entrega',
    pickup_person: 'Persona que Recoge',
    recipients: 'Destinatarios',
    subject: 'Asunto',
    body: 'Mensaje',
    message: 'Mensaje',
  }

  return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function ActionConfirmationModal({
  action,
  onConfirm,
  onCancel,
}: ActionConfirmationModalProps) {
  const toolInfo = getToolInfo(action.action_type)
  const category = toolInfo?.category || 'default'
  const colors = categoryColors[category] || categoryColors.attendance
  const icon = categoryIcons[category] || '🔧'

  // Filter out empty or internal params
  const displayParams = Object.entries(action.params).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !key.startsWith('_')
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`${colors.bg} px-6 py-4 border-b ${colors.border}`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{icon}</div>
            <div className="flex-1">
              <h3 className={`font-semibold ${colors.text}`}>
                Confirmar Acción
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {toolInfo?.name || action.action_type}
              </p>
            </div>
            <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {toolInfo?.description || action.description}
            </p>
          </div>

          {/* Parameters */}
          {displayParams.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Detalles de la Acción
              </p>
              <div className="space-y-2">
                {displayParams.map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatParamKey(key)}:
                    </span>
                    <span className="text-sm text-gray-800 dark:text-gray-200 text-right font-medium max-w-[60%] break-words">
                      {formatParamValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Esta acción modificará datos del sistema. Por favor, verifica que la información sea correcta antes de confirmar.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80 transition font-medium flex items-center justify-center gap-2`}
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
