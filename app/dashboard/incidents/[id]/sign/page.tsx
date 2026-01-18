'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PenTool,
  RotateCcw,
  User,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  incidentsEnhancedService,
  type IncidentWithDetails,
} from '@/features/incidents/services/incidents-enhanced.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassBadge,
} from '@/shared/components/ui'

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  injury: 'Lesión',
  illness: 'Enfermedad',
  behavioral: 'Conductual',
  medication: 'Medicamento',
  property_damage: 'Daño a Propiedad',
  security: 'Seguridad',
  other: 'Otro',
}

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  minor: { label: 'Menor', color: 'success' },
  moderate: { label: 'Moderado', color: 'warning' },
  serious: { label: 'Serio', color: 'error' },
  critical: { label: 'Crítico', color: 'error' },
}

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Seleccionar relación...' },
  { value: 'mother', label: 'Madre' },
  { value: 'father', label: 'Padre' },
  { value: 'grandmother', label: 'Abuela' },
  { value: 'grandfather', label: 'Abuelo' },
  { value: 'legal_guardian', label: 'Tutor Legal' },
  { value: 'other', label: 'Otro' },
]

export default function IncidentSignPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [incident, setIncident] = useState<IncidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedByName, setSignedByName] = useState('')
  const [signedByRelationship, setSignedByRelationship] = useState('')
  const [hasSignature, setHasSignature] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadIncident()
  }, [incidentId])

  useEffect(() => {
    initCanvas()
  }, [incident])

  async function loadIncident() {
    try {
      setIsLoading(true)
      const data = await incidentsEnhancedService.getById(incidentId)
      setIncident(data)

      // If already signed, show message
      if (data?.parent_signed_at) {
        setResult({
          success: true,
          message: 'Este incidente ya fue firmado',
        })
      }
    } catch (error) {
      console.error('Error loading incident:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function initCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    // Set drawing style
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear canvas
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearSignature() {
    initCanvas()
    setHasSignature(false)
  }

  function getSignatureData(): string | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  async function handleSubmit() {
    if (!signedByName.trim()) {
      alert('Por favor ingrese su nombre')
      return
    }
    if (!signedByRelationship) {
      alert('Por favor seleccione su relación con el niño')
      return
    }
    if (!hasSignature) {
      alert('Por favor firme en el área de firma')
      return
    }

    const signatureData = getSignatureData()
    if (!signatureData) {
      alert('Error al capturar la firma')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await incidentsEnhancedService.recordSignature(incidentId, {
        signed_by_name: signedByName.trim(),
        signed_by_relationship: signedByRelationship,
        signature_data: signatureData,
      })

      setResult(response)

      if (response.success) {
        setTimeout(() => {
          router.push(`/dashboard/incidents/${incidentId}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Error submitting signature:', error)
      setResult({
        success: false,
        message: 'Error al registrar la firma',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Incidente no encontrado</p>
        <Link href="/dashboard/incidents">
          <GlassButton variant="secondary" className="mt-4">
            Volver a Incidentes
          </GlassButton>
        </Link>
      </div>
    )
  }

  // Already signed
  if (incident.parent_signed_at) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard className="text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Incidente Ya Firmado</h2>
          <p className="text-gray-500 mb-4">
            Este incidente fue firmado por <strong>{incident.parent_signed_by_name}</strong> el{' '}
            {formatDate(incident.parent_signed_at)}
          </p>
          <Link href={`/dashboard/incidents/${incidentId}`}>
            <GlassButton variant="primary">
              Ver Detalles del Incidente
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    )
  }

  const childName = incident.child
    ? `${incident.child.first_name} ${incident.child.last_name}`
    : 'Niño'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/incidents/${incidentId}`}>
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firmar Incidente</h1>
          <p className="text-gray-500">
            {incident.incident_number || `#${incidentId.slice(0, 8)}`}
          </p>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <GlassCard className={`p-6 text-center ${
          result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        } border-2`}>
          {result.success ? (
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          )}
          <p className={`text-lg font-semibold ${
            result.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.message}
          </p>
        </GlassCard>
      )}

      {!result?.success && (
        <>
          {/* Incident Summary */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resumen del Incidente
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Niño/a</p>
                    <p className="font-medium text-gray-900">{childName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GlassBadge variant="default">
                    {INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}
                  </GlassBadge>
                  <GlassBadge variant={SEVERITY_LABELS[incident.severity]?.color as 'success' | 'warning' | 'error' || 'default'}>
                    {SEVERITY_LABELS[incident.severity]?.label || incident.severity}
                  </GlassBadge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(incident.occurred_at)}
                    </p>
                  </div>
                </div>
                {incident.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium text-gray-900">{incident.location}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-900 whitespace-pre-wrap">{incident.description}</p>
              </div>

              {incident.action_taken && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Acción Tomada</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{incident.action_taken}</p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Signature Form */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Firma del Padre/Tutor
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Al firmar este documento, confirmo que he sido notificado del incidente
                y he revisado la información proporcionada.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nombre Completo *
                  </label>
                  <GlassInput
                    placeholder="Nombre del padre/tutor"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Relación con el Niño *
                  </label>
                  <GlassSelect
                    options={RELATIONSHIP_OPTIONS}
                    value={signedByRelationship}
                    onChange={(e) => setSignedByRelationship(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Firma *
                  </label>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Limpiar
                  </GlassButton>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-40 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use el mouse o el dedo para firmar en el área de arriba
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Link href={`/dashboard/incidents/${incidentId}`} className="flex-1">
                  <GlassButton variant="secondary" fullWidth disabled={isSubmitting}>
                    Cancelar
                  </GlassButton>
                </Link>
                <GlassButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasSignature || !signedByName || !signedByRelationship}
                  leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Firma'}
                </GlassButton>
              </div>
            </GlassCardContent>
          </GlassCard>
        </>
      )}
    </div>
  )
}
