'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Syringe,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react'
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
  GlassTableEmpty,
} from '@/shared/components/ui'
import { immunizationsService } from '@/features/immunizations/services/immunizations.service'
import {
  ImmunizationStatusBadge,
  ProvisionalBadge,
  ImmunizationSummaryCard,
} from '@/features/immunizations/components'
import type {
  OrganizationImmunizationSummary,
  ChildImmunizationStatus,
  OverdueImmunization,
  ComplianceStatus,
} from '@/shared/types/immunizations'

export default function ImmunizationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<OrganizationImmunizationSummary | null>(null)
  const [children, setChildren] = useState<ChildImmunizationStatus[]>([])
  const [overdueList, setOverdueList] = useState<OverdueImmunization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [summaryData, childrenData, overdueData] = await Promise.all([
        immunizationsService.getOrganizationSummary(),
        immunizationsService.getAllCompliance(),
        immunizationsService.getOverdueImmunizations(),
      ])

      setSummary(summaryData)
      setChildren(childrenData)
      setOverdueList(overdueData)
    } catch (error) {
      console.error('Error loading immunization data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter children
  const filteredChildren = children.filter(child => {
    const matchesSearch =
      child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || child.compliance_status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Group overdue by child
  const overdueByChild = overdueList.reduce((acc, item) => {
    if (!acc[item.child_id]) {
      acc[item.child_id] = {
        name: item.child_name,
        vaccines: [],
      }
    }
    acc[item.child_id].vaccines.push(item)
    return acc
  }, {} as Record<string, { name: string; vaccines: OverdueImmunization[] }>)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Syringe className="w-7 h-7 text-primary-600" />
            Immunization Tracking
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            DCF Florida compliance tracking and management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" leftIcon={<Download className="w-4 h-4" />}>
            Export Report
          </GlassButton>
          <Link href="/dashboard/immunizations/requirements">
            <GlassButton variant="secondary" leftIcon={<FileText className="w-4 h-4" />}>
              DCF Requirements
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <ImmunizationSummaryCard summary={summary} isLoading={isLoading} />
      )}

      {/* Overdue Alerts */}
      {Object.keys(overdueByChild).length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <GlassCardTitle>Overdue Immunizations</GlassCardTitle>
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {overdueList.length} vaccines overdue
              </span>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(overdueByChild).slice(0, 5).map(([childId, data]) => (
                <Link
                  key={childId}
                  href={`/dashboard/immunizations/${childId}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {data.name}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {data.vaccines.map(v => v.vaccine_name).join(', ')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
              {Object.keys(overdueByChild).length > 5 && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-2">
                  +{Object.keys(overdueByChild).length - 5} more children
                </p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Children List */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <GlassCardTitle>Children Immunization Status</GlassCardTitle>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search children..."
                  className="input-neu pl-10 pr-4 py-2 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <GlassSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ComplianceStatus | 'all')}
                className="w-40"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'compliant', label: 'Compliant' },
                  { value: 'incomplete', label: 'Incomplete' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'exempt', label: 'Exempt' },
                ]}
              />
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <GlassTable>
            <GlassTableHeader>
              <GlassTableRow>
                <GlassTableHead>Child</GlassTableHead>
                <GlassTableHead>Age</GlassTableHead>
                <GlassTableHead>Status</GlassTableHead>
                <GlassTableHead>Progress</GlassTableHead>
                <GlassTableHead>Next Due</GlassTableHead>
                <GlassTableHead className="text-right">Actions</GlassTableHead>
              </GlassTableRow>
            </GlassTableHeader>
            <GlassTableBody>
              {filteredChildren.length === 0 ? (
                <GlassTableEmpty
                  colSpan={6}
                  message={searchTerm || statusFilter !== 'all'
                    ? 'No children match your filters'
                    : 'No children enrolled'
                  }
                />
              ) : (
                filteredChildren.map((child) => (
                  <GlassTableRow key={child.child_id}>
                    <GlassTableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {child.first_name} {child.last_name}
                        </p>
                        {child.provisional_enrollment && (
                          <ProvisionalBadge
                            endDate={child.provisional_end_date}
                            size="sm"
                          />
                        )}
                      </div>
                    </GlassTableCell>
                    <GlassTableCell>
                      <span className="text-gray-600 dark:text-gray-400">
                        {Math.floor(child.age_months / 12)}y {child.age_months % 12}m
                      </span>
                    </GlassTableCell>
                    <GlassTableCell>
                      <ImmunizationStatusBadge status={child.compliance_status} />
                    </GlassTableCell>
                    <GlassTableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              child.compliance_status === 'compliant'
                                ? 'bg-green-500'
                                : child.compliance_status === 'overdue'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{
                              width: child.vaccines_required > 0
                                ? `${(child.vaccines_complete / child.vaccines_required) * 100}%`
                                : '0%'
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {child.vaccines_complete}/{child.vaccines_required}
                        </span>
                      </div>
                    </GlassTableCell>
                    <GlassTableCell>
                      {child.next_due_vaccine ? (
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">
                            {child.next_due_vaccine}
                          </p>
                          {child.next_due_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {new Date(child.next_due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </GlassTableCell>
                    <GlassTableCell className="text-right">
                      <Link href={`/dashboard/immunizations/${child.child_id}`}>
                        <GlassButton variant="ghost" size="sm">
                          View
                        </GlassButton>
                      </Link>
                    </GlassTableCell>
                  </GlassTableRow>
                ))
              )}
            </GlassTableBody>
          </GlassTable>
        </GlassCardContent>
      </GlassCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 neu rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.compliance_rate || 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compliance Rate
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 neu rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.overdue || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Children Overdue
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 neu rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overdueList.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vaccines Needed
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 neu rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.exempt || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Exemptions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
