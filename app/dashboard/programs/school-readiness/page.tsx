'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Clock,
  Calendar,
  Users,
  Search,
  Download,
  Loader2,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react'
import {
  programsService,
  SR_RATE_TYPES,
  type SchoolReadinessEnrollment,
  type SRBillingSummary,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function SchoolReadinessPage() {
  const [enrollments, setEnrollments] = useState<SchoolReadinessEnrollment[]>([])
  const [billingSummary, setBillingSummary] = useState<SRBillingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    child_id: '',
    family_id: '',
    case_number: '',
    eligibility_start: '',
    eligibility_end: '',
    authorized_hours_weekly: 50,
    rate_type: 'full_time' as 'full_time' | 'part_time' | 'hourly',
    weekly_rate: 0,
    copay_amount: 0,
    copay_frequency: 'weekly' as 'weekly' | 'monthly',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)

      // Calculate current month period
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0]

      const [enrollmentData, billingData] = await Promise.all([
        programsService.getSREnrollments(),
        programsService.getSRBillingSummary(undefined, periodStart, periodEnd),
      ])
      setEnrollments(enrollmentData)
      setBillingSummary(billingData)
    } catch (error) {
      console.error('Error loading SR data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.case_number || !formData.eligibility_start || !formData.eligibility_end) {
      return
    }

    try {
      const result = await programsService.createSREnrollment({
        organization_id: '', // Will be set by RLS
        child_id: formData.child_id,
        family_id: formData.family_id,
        case_number: formData.case_number,
        eligibility_start: formData.eligibility_start,
        eligibility_end: formData.eligibility_end,
        status: 'active',
        authorized_hours_weekly: formData.authorized_hours_weekly,
        rate_type: formData.rate_type,
        weekly_rate: formData.weekly_rate || undefined,
        copay_amount: formData.copay_amount || undefined,
        copay_frequency: formData.copay_frequency,
        notes: formData.notes || undefined,
      })

      if (result) {
        setShowAddModal(false)
        setFormData({
          child_id: '',
          family_id: '',
          case_number: '',
          eligibility_start: '',
          eligibility_end: '',
          authorized_hours_weekly: 50,
          rate_type: 'full_time',
          weekly_rate: 0,
          copay_amount: 0,
          copay_frequency: 'weekly',
          notes: '',
        })
        loadData()
      }
    } catch (error) {
      console.error('Error creating SR enrollment:', error)
    }
  }

  function exportToCSV() {
    const headers = [
      'Nombre',
      'Número de Caso',
      'Inicio Elegibilidad',
      'Fin Elegibilidad',
      'Horas/Semana',
      'Tipo Tarifa',
      'Copago',
      'Estado',
    ]

    const rows = enrollments.map(e => [
      e.child_name || 'N/A',
      e.case_number,
      e.eligibility_start,
      e.eligibility_end,
      e.authorized_hours_weekly,
      e.rate_type,
      e.copay_amount || 0,
      STATUS_LABELS[e.status],
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `school_readiness_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = !searchTerm ||
      e.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.case_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const totalWeeklyHours = activeEnrollments.reduce((sum, e) => sum + e.authorized_hours_weekly, 0)
  const totalMonthlyReimbursement = billingSummary.reduce((sum, b) => sum + b.net_reimbursement, 0)

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
              <DollarSign className="w-6 h-6 text-green-600" />
              School Readiness
            </h1>
            <p className="text-gray-500">
              Subsidio de cuidado infantil de Florida
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
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalWeeklyHours}</p>
              <p className="text-sm text-gray-500">Horas/Semana</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(totalMonthlyReimbursement)}
              </p>
              <p className="text-sm text-gray-500">Reembolso/Mes Est.</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter(e => e.rate_type === 'full_time').length}
              </p>
              <p className="text-sm text-gray-500">Full Time</p>
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
                placeholder="Buscar por nombre o número de caso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <GlassSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los Estados' },
                  { value: 'active', label: 'Activos' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'expired', label: 'Expirados' },
                ]}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Enrollments Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Inscripciones SR ({filteredEnrollments.length})</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          {filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron inscripciones SR</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Niño</GlassTableHead>
                    <GlassTableHead>Caso</GlassTableHead>
                    <GlassTableHead>Tipo</GlassTableHead>
                    <GlassTableHead className="text-center">Hrs/Sem</GlassTableHead>
                    <GlassTableHead className="text-right">Copago</GlassTableHead>
                    <GlassTableHead className="text-center">Estado</GlassTableHead>
                    <GlassTableHead>Elegibilidad</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const isExpiringSoon = new Date(enrollment.eligibility_end) <
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

                    return (
                      <GlassTableRow key={enrollment.id}>
                        <GlassTableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {enrollment.child_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="font-medium">{enrollment.child_name || 'N/A'}</span>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {enrollment.case_number}
                          </code>
                        </GlassTableCell>
                        <GlassTableCell>
                          <span className={`text-sm px-2 py-1 rounded ${
                            enrollment.rate_type === 'full_time'
                              ? 'bg-green-100 text-green-700'
                              : enrollment.rate_type === 'part_time'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {SR_RATE_TYPES.find(r => r.value === enrollment.rate_type)?.label || enrollment.rate_type}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell className="text-center">
                          <span className="font-medium">{enrollment.authorized_hours_weekly}</span>
                        </GlassTableCell>
                        <GlassTableCell className="text-right">
                          {enrollment.copay_amount
                            ? `${formatCurrency(enrollment.copay_amount)}/${enrollment.copay_frequency === 'weekly' ? 'sem' : 'mes'}`
                            : '-'
                          }
                        </GlassTableCell>
                        <GlassTableCell className="text-center">
                          <GlassBadge variant={STATUS_COLORS[enrollment.status]}>
                            {STATUS_LABELS[enrollment.status]}
                          </GlassBadge>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(enrollment.eligibility_end).toLocaleDateString('es-ES')}
                            </div>
                            {isExpiringSoon && enrollment.status === 'active' && (
                              <span className="text-xs text-amber-600">Expira pronto</span>
                            )}
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

      {/* Monthly Billing Summary */}
      {billingSummary.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Resumen de Facturación - Este Mes</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableHead>Niño</GlassTableHead>
                    <GlassTableHead className="text-center">Hrs Autorizadas</GlassTableHead>
                    <GlassTableHead className="text-center">Hrs Reales</GlassTableHead>
                    <GlassTableHead className="text-center">% Asistencia</GlassTableHead>
                    <GlassTableHead className="text-right">Facturado</GlassTableHead>
                    <GlassTableHead className="text-right">Copago</GlassTableHead>
                    <GlassTableHead className="text-right">Neto</GlassTableHead>
                  </GlassTableRow>
                </GlassTableHeader>
                <GlassTableBody>
                  {billingSummary.map((summary) => (
                    <GlassTableRow key={summary.enrollment_id}>
                      <GlassTableCell className="font-medium">
                        {summary.child_name}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {summary.authorized_hours}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        {summary.actual_hours}
                      </GlassTableCell>
                      <GlassTableCell className="text-center">
                        <span className={`${
                          summary.attendance_rate >= 80 ? 'text-green-600' :
                          summary.attendance_rate >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {summary.attendance_rate}%
                        </span>
                      </GlassTableCell>
                      <GlassTableCell className="text-right">
                        {formatCurrency(summary.billable_amount)}
                      </GlassTableCell>
                      <GlassTableCell className="text-right text-red-600">
                        -{formatCurrency(summary.copay_amount)}
                      </GlassTableCell>
                      <GlassTableCell className="text-right font-medium text-green-600">
                        {formatCurrency(summary.net_reimbursement)}
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                  {/* Totals Row */}
                  <GlassTableRow className="bg-gray-50 font-semibold">
                    <GlassTableCell>TOTAL</GlassTableCell>
                    <GlassTableCell className="text-center">
                      {billingSummary.reduce((s, b) => s + b.authorized_hours, 0)}
                    </GlassTableCell>
                    <GlassTableCell className="text-center">
                      {billingSummary.reduce((s, b) => s + b.actual_hours, 0)}
                    </GlassTableCell>
                    <GlassTableCell className="text-center">-</GlassTableCell>
                    <GlassTableCell className="text-right">
                      {formatCurrency(billingSummary.reduce((s, b) => s + b.billable_amount, 0))}
                    </GlassTableCell>
                    <GlassTableCell className="text-right text-red-600">
                      -{formatCurrency(billingSummary.reduce((s, b) => s + b.copay_amount, 0))}
                    </GlassTableCell>
                    <GlassTableCell className="text-right text-green-600">
                      {formatCurrency(totalMonthlyReimbursement)}
                    </GlassTableCell>
                  </GlassTableRow>
                </GlassTableBody>
              </GlassTable>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <GlassCardTitle>Nueva Inscripción School Readiness</GlassCardTitle>
                <GlassButton variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </GlassButton>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleCreateEnrollment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Caso *
                  </label>
                  <GlassInput
                    placeholder="Ej: SR-123456"
                    value={formData.case_number}
                    onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inicio Elegibilidad *
                    </label>
                    <GlassInput
                      type="date"
                      value={formData.eligibility_start}
                      onChange={(e) => setFormData({ ...formData, eligibility_start: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fin Elegibilidad *
                    </label>
                    <GlassInput
                      type="date"
                      value={formData.eligibility_end}
                      onChange={(e) => setFormData({ ...formData, eligibility_end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Tarifa
                    </label>
                    <GlassSelect
                      value={formData.rate_type}
                      onChange={(e) => setFormData({
                        ...formData,
                        rate_type: e.target.value as 'full_time' | 'part_time' | 'hourly'
                      })}
                      options={SR_RATE_TYPES.map(type => ({
                        value: type.value,
                        label: type.label,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Autorizadas/Semana
                    </label>
                    <GlassInput
                      type="number"
                      min={1}
                      max={60}
                      value={formData.authorized_hours_weekly}
                      onChange={(e) => setFormData({
                        ...formData,
                        authorized_hours_weekly: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Copago Familiar
                    </label>
                    <GlassInput
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={formData.copay_amount || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        copay_amount: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia Copago
                    </label>
                    <GlassSelect
                      value={formData.copay_frequency}
                      onChange={(e) => setFormData({
                        ...formData,
                        copay_frequency: e.target.value as 'weekly' | 'monthly'
                      })}
                      options={[
                        { value: 'weekly', label: 'Semanal' },
                        { value: 'monthly', label: 'Mensual' },
                      ]}
                    />
                  </div>
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
