'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  Loader2,
  X,
  User,
} from 'lucide-react'
import {
  programsService,
  VPK_REQUIREMENTS,
  type VPKEnrollment,
  type VPKHoursSummary,
  type VPKScheduleType,
} from '@/features/programs/services/programs.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassBadge,
} from '@/shared/components/ui'

const STATUS_COLORS = {
  pending: 'warning',
  active: 'success',
  completed: 'info',
  withdrawn: 'error',
  expired: 'error',
} as const

const STATUS_LABELS = {
  pending: 'Pendiente',
  active: 'Activo',
  completed: 'Completado',
  withdrawn: 'Retirado',
  expired: 'Expirado',
} as const

export default function VPKManagementPage() {
  const [enrollments, setEnrollments] = useState<VPKEnrollment[]>([])
  const [summaries, setSummaries] = useState<VPKHoursSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [eligibleChildren, setEligibleChildren] = useState<Array<{
    id: string
    first_name: string
    last_name: string
    already_enrolled: boolean
  }>>([])

  // Form state
  const [formData, setFormData] = useState({
    child_id: '',
    schedule_type: 'school_year' as VPKScheduleType,
    student_cert_number: '',
    start_date: '',
    provider_id: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [enrollmentData, summaryData, eligibleData] = await Promise.all([
        programsService.getVPKEnrollments(),
        programsService.getVPKHoursSummary(),
        programsService.getChildrenEligibleForVPK(),
      ])
      setEnrollments(enrollmentData)
      setSummaries(summaryData)
      setEligibleChildren(eligibleData)
    } catch (error) {
      console.error('Error loading VPK data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.child_id || !formData.student_cert_number || !formData.start_date) {
      return
    }

    try {
      const result = await programsService.createVPKEnrollment({
        organization_id: '', // Will be set by RLS
        child_id: formData.child_id,
        schedule_type: formData.schedule_type,
        student_cert_number: formData.student_cert_number,
        enrollment_date: new Date().toISOString().split('T')[0],
        start_date: formData.start_date,
        status: 'active',
        total_hours_required: VPK_REQUIREMENTS[formData.schedule_type].total_hours,
        provider_id: formData.provider_id || undefined,
        notes: formData.notes || undefined,
      })

      if (result) {
        setShowAddModal(false)
        setFormData({
          child_id: '',
          schedule_type: 'school_year',
          student_cert_number: '',
          start_date: '',
          provider_id: '',
          notes: '',
        })
        loadData()
      }
    } catch (error) {
      console.error('Error creating VPK enrollment:', error)
    }
  }

  function exportToCSV() {
    const headers = [
      'Nombre',
      'Certificado VPK',
      'Tipo Programa',
      'Inicio',
      'Estado',
      'Horas Requeridas',
      'Horas Asistidas',
      'Horas Restantes',
      '% Completado',
    ]

    const rows = enrollments.map(e => {
      const summary = summaries.find(s => s.enrollment_id === e.id)
      return [
        e.child_name || 'N/A',
        e.student_cert_number,
        e.schedule_type === 'school_year' ? 'Escolar' : 'Verano',
        e.start_date,
        STATUS_LABELS[e.status],
        e.total_hours_required,
        e.hours_attended,
        e.hours_remaining,
        summary ? `${summary.percent_complete}%` : 'N/A',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vpk_enrollments_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = !searchTerm ||
      e.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.student_cert_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalHoursAttended = enrollments
    .filter(e => e.status === 'active')
    .reduce((sum, e) => sum + e.hours_attended, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/programs">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              VPK - Voluntary Prekindergarten
            </h1>
            <p className="text-gray-500">
              Programa gratuito de prekindergarten para niños de 4 años
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <GlassButton
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={exportToCSV}
          >
            Exportar
          </GlassButton>
          <GlassButton
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Nueva Inscripción
          </GlassButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter(e => e.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter(e => e.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Completados</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalHoursAttended.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Horas Totales</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              summaries.filter(s => !s.on_track).length > 0 ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              <AlertCircle className={`w-5 h-5 ${
                summaries.filter(s => !s.on_track).length > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {summaries.filter(s => !s.on_track).length}
              </p>
              <p className="text-sm text-gray-500">Atrasados</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <GlassInput
                placeholder="Buscar por nombre o certificado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <GlassSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="completed">Completados</option>
                <option value="pending">Pendientes</option>
                <option value="withdrawn">Retirados</option>
              </GlassSelect>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Enrollments Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Inscripciones VPK ({filteredEnrollments.length})</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          {filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron inscripciones VPK</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Estudiante</GlassTableHead>
                    <GlassTableHead>Certificado</GlassTableHead>
                    <GlassTableHead>Programa</GlassTableHead>
                    <GlassTableHead className="text-center">Progreso</GlassTableHead>
                    <GlassTableHead className="text-center">Horas</GlassTableHead>
                    <GlassTableHead className="text-center">Estado</GlassTableHead>
                    <GlassTableHead>Inicio</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const summary = summaries.find(s => s.enrollment_id === enrollment.id)

                    return (
                      <GlassTableRow key={enrollment.id}>
                        <GlassTableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {enrollment.child_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="font-medium">{enrollment.child_name || 'N/A'}</span>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {enrollment.student_cert_number}
                          </code>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className={`text-sm px-2 py-1 rounded ${
                            enrollment.schedule_type === 'school_year'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {enrollment.schedule_type === 'school_year' ? 'Escolar' : 'Verano'}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  summary?.on_track ? 'bg-green-500' : 'bg-amber-500'
                                }`}
                                style={{
                                  width: `${Math.min(summary?.percent_complete || 0, 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {summary?.percent_complete || 0}%
                            </span>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell className="text-center">
                          <div className="text-sm">
                            <span className="font-medium">{enrollment.hours_attended}</span>
                            <span className="text-gray-400"> / {enrollment.total_hours_required}</span>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell className="text-center">
                          <GlassBadge variant={STATUS_COLORS[enrollment.status]}>
                            {STATUS_LABELS[enrollment.status]}
                          </GlassBadge>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(enrollment.start_date).toLocaleDateString('es-ES')}
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    )
                  })}
                </GlassTableBody>
              </GlassTable>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>Nueva Inscripción VPK</GlassCardTitle>
                <GlassButton variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </GlassButton>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleCreateEnrollment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estudiante *
                  </label>
                  <GlassSelect
                    value={formData.child_id}
                    onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar estudiante...</option>
                    {eligibleChildren.map(child => (
                      <option
                        key={child.id}
                        value={child.id}
                        disabled={child.already_enrolled}
                      >
                        {child.first_name} {child.last_name}
                        {child.already_enrolled ? ' (Ya inscrito)' : ''}
                      </option>
                    ))}
                  </GlassSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Certificado VPK *
                  </label>
                  <GlassInput
                    placeholder="Ej: 123456789"
                    value={formData.student_cert_number}
                    onChange={(e) => setFormData({ ...formData, student_cert_number: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Programa *
                  </label>
                  <GlassSelect
                    value={formData.schedule_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule_type: e.target.value as VPKScheduleType
                    })}
                  >
                    <option value="school_year">Año Escolar (540 horas)</option>
                    <option value="summer">Verano (300 horas)</option>
                  </GlassSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <GlassInput
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID de Proveedor ELC (opcional)
                  </label>
                  <GlassInput
                    placeholder="Ej: ELC-OC-12345"
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Notas adicionales..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <GlassButton
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </GlassButton>
                  <GlassButton type="submit" variant="primary" className="flex-1">
                    Crear Inscripción
                  </GlassButton>
                </div>
              </form>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
