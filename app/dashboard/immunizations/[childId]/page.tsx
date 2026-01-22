'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Syringe,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Shield,
  Loader2,
  Trash2,
  Edit2,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
} from '@/shared/components/ui'
import { immunizationsService } from '@/features/immunizations/services/immunizations.service'
import { ImmunizationRecordModal } from '@/features/immunizations/components/ImmunizationRecordModal'
import { ImmunizationStatusBadge } from '@/features/immunizations/components'
import type {
  ChildImmunizationReport,
  DcfVaccineRequirement,
  ImmunizationRecordFormData,
} from '@/shared/types/immunizations'

interface PageProps {
  params: Promise<{ childId: string }>
}

export default function ChildImmunizationPage({ params }: PageProps) {
  const { childId } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<ChildImmunizationReport | null>(null)
  const [requirements, setRequirements] = useState<DcfVaccineRequirement[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ImmunizationRecordFormData | undefined>()

  useEffect(() => {
    loadData()
  }, [childId])

  async function loadData() {
    try {
      setIsLoading(true)
      const [reportData, requirementsData] = await Promise.all([
        immunizationsService.getChildReport(childId),
        immunizationsService.getVaccineRequirements(),
      ])
      setReport(reportData)
      setRequirements(requirementsData)
    } catch (error) {
      console.error('Error loading immunization data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddRecord(data: ImmunizationRecordFormData) {
    try {
      setIsSubmitting(true)
      await immunizationsService.createRecord(data)
      setIsModalOpen(false)
      setEditingRecord(undefined)
      await loadData()
    } catch (error) {
      console.error('Error adding record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyRecord(recordId: string) {
    try {
      await immunizationsService.verifyRecord(recordId)
      await loadData()
    } catch (error) {
      console.error('Error verifying record:', error)
    }
  }

  async function handleDeleteRecord(recordId: string) {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await immunizationsService.deleteRecord(recordId)
      await loadData()
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Child Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Could not load immunization data for this child.
        </p>
        <Link href="/dashboard/immunizations">
          <GlassButton variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Immunizations
          </GlassButton>
        </Link>
      </div>
    )
  }

  const completedVaccines = report.vaccines_status.filter(v => v.is_complete || v.is_exempt).length
  const totalRequired = report.vaccines_status.length
  const progressPercent = totalRequired > 0 ? Math.round((completedVaccines / totalRequired) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/immunizations">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Syringe className="w-7 h-7 text-primary-600" />
              {report.child.first_name} {report.child.last_name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Age: {Math.floor(report.child.age_months / 12)} years, {report.child.age_months % 12} months
            </p>
          </div>
        </div>

        <GlassButton
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingRecord(undefined)
            setIsModalOpen(true)
          }}
        >
          Add Vaccine Record
        </GlassButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compliance Status */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                report.compliance?.compliance_status === 'compliant'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : report.compliance?.compliance_status === 'overdue'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                {report.compliance?.compliance_status === 'compliant' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : report.compliance?.compliance_status === 'overdue' ? (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <ImmunizationStatusBadge status={report.compliance?.compliance_status || 'incomplete'} />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Progress */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {completedVaccines}/{totalRequired}
                  </span>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Exemptions */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exemptions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {report.exemptions.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Vaccine Status Grid */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Required Vaccines</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.vaccines_status.map((vaccine) => (
              <div
                key={vaccine.vaccine_code}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  vaccine.is_complete
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : vaccine.is_exempt
                      ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {vaccine.vaccine_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vaccine.doses_received} of {vaccine.required_doses} doses
                    </p>
                  </div>
                  {vaccine.is_complete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : vaccine.is_exempt ? (
                    <Shield className="w-5 h-5 text-purple-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                {vaccine.last_dose_date && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last dose: {new Date(vaccine.last_dose_date).toLocaleDateString()}
                  </p>
                )}
                {vaccine.next_dose_due && !vaccine.is_complete && !vaccine.is_exempt && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Next due: {new Date(vaccine.next_dose_due).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Immunization Records */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle>Immunization Records</GlassCardTitle>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {report.records.length} records
            </span>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {report.records.length === 0 ? (
            <div className="text-center py-8">
              <Syringe className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No immunization records yet
              </p>
              <GlassButton
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Record
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-3">
              {report.records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-xl shadow-neu dark:shadow-neu-dark"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      record.status === 'verified'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      <Syringe className={`w-5 h-5 ${
                        record.status === 'verified'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.vaccine_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.date_administered).toLocaleDateString()}
                        </span>
                        {record.dose_number && (
                          <span>Dose #{record.dose_number}</span>
                        )}
                        {record.provider_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.provider_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.status === 'pending' && (
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerifyRecord(record.id)}
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </GlassButton>
                    )}
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </GlassButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Active Exemptions */}
      {report.exemptions.filter(e => e.status === 'active').length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Active Exemptions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              {report.exemptions
                .filter(e => e.status === 'active')
                .map((exemption) => (
                  <div
                    key={exemption.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-center gap-4">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {exemption.exemption_type === 'medical' ? 'Medical Exemption' :
                            exemption.exemption_type === 'religious' ? 'Religious Exemption' :
                              'Philosophical Exemption'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Vaccines: {exemption.vaccine_codes?.join(', ') || 'All'}
                        </p>
                        {exemption.end_date && (
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Expires: {new Date(exemption.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Add Record Modal */}
      <ImmunizationRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecord(undefined)
        }}
        onSubmit={handleAddRecord}
        childId={childId}
        childName={`${report.child.first_name} ${report.child.last_name}`}
        vaccineRequirements={requirements}
        existingRecord={editingRecord}
        isLoading={isSubmitting}
      />
    </div>
  )
}
