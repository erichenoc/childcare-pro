'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Syringe,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
  Loader2,
  FileText,
  Users,
  AlertTriangle,
  Baby,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
} from '@/shared/components/ui'
import { immunizationsService } from '@/features/immunizations/services/immunizations.service'
import {
  ImmunizationStatusBadge,
  ProvisionalBadge,
} from '@/features/immunizations/components'
import type {
  OrganizationImmunizationSummary,
  ChildImmunizationStatus,
  OverdueImmunization,
  ComplianceStatus,
} from '@/shared/types/immunizations'
import { useTranslations } from '@/shared/lib/i18n'

export default function ImmunizationsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<OrganizationImmunizationSummary | null>(null)
  const [children, setChildren] = useState<ChildImmunizationStatus[]>([])
  const [overdueList, setOverdueList] = useState<OverdueImmunization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'compliant'>('all')

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

  // Filter children based on search and tab
  const filteredChildren = children.filter(child => {
    const matchesSearch =
      child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesTab = true
    if (activeTab === 'overdue') {
      matchesTab = child.compliance_status === 'overdue' || child.compliance_status === 'incomplete'
    } else if (activeTab === 'compliant') {
      matchesTab = child.compliance_status === 'compliant' || child.compliance_status === 'exempt'
    }

    return matchesSearch && matchesTab
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
            {t.immunizations.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.immunizations.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" leftIcon={<Download className="w-4 h-4" />}>
            {t.immunizations.export}
          </GlassButton>
          <Link href="/dashboard/immunizations/requirements">
            <GlassButton variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
              {t.immunizations.dcfRequirements}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="col-span-2 md:col-span-1">
          <GlassCardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary?.total_children || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.immunizations.totalChildren}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {summary?.fully_compliant || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.immunizations.complete}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 mb-3">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary?.incomplete || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.immunizations.incomplete}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {summary?.overdue || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.immunizations.overdue}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-3">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {summary?.exempt || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.immunizations.exempt}</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Compliance Rate Bar */}
      <GlassCard>
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.immunizations.complianceRate}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary?.compliance_rate || 0}%
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (summary?.compliance_rate || 0) >= 90
                  ? 'bg-green-500'
                  : (summary?.compliance_rate || 0) >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${summary?.compliance_rate || 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {t.immunizations.childrenUpToDate
              .replace('{count}', String(summary?.fully_compliant || 0))
              .replace('{total}', String(summary?.total_children || 0))
            }
          </p>
        </GlassCardContent>
      </GlassCard>

      {/* Urgent Alert - Overdue */}
      {Object.keys(overdueByChild).length > 0 && (
        <GlassCard className="border-l-4 border-l-red-500">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <GlassCardTitle>{t.immunizations.overdueVaccines}</GlassCardTitle>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {overdueList.length} {t.immunizations.pendingVaccines}
              </span>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(overdueByChild).slice(0, 6).map(([childId, data]) => (
                <Link
                  key={childId}
                  href={`/dashboard/immunizations/${childId}`}
                  className="flex items-center justify-between p-4 rounded-xl shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {data.name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {data.vaccines.length} {data.vaccines.length > 1 ? t.immunizations.vaccinesPending : t.immunizations.vaccinePending}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
            {Object.keys(overdueByChild).length > 6 && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
                {t.immunizations.moreChildrenPending.replace('{count}', String(Object.keys(overdueByChild).length - 6))}
              </p>
            )}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Children List with Tabs */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <GlassCardTitle>{t.immunizations.childrenList}</GlassCardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{filteredChildren.length} {t.immunizations.children}</span>
              </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Quick Filter Tabs */}
              <div className="flex rounded-xl shadow-neu dark:shadow-neu-dark p-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t.immunizations.all}
                </button>
                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'overdue'
                      ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t.immunizations.pending}
                </button>
                <button
                  onClick={() => setActiveTab('compliant')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'compliant'
                      ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t.immunizations.compliant}
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.immunizations.searchChild}
                  className="w-full pl-10 pr-4 py-2 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset bg-neu-bg dark:bg-neu-bg-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {filteredChildren.length === 0 ? (
            <div className="text-center py-12">
              <Syringe className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || activeTab !== 'all'
                  ? t.immunizations.noChildrenFiltered
                  : t.immunizations.noChildrenRegistered
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChildren.map((child) => {
                const progressPercent = child.vaccines_required > 0
                  ? Math.round((child.vaccines_complete / child.vaccines_required) * 100)
                  : 0

                return (
                  <Link
                    key={child.child_id}
                    href={`/dashboard/immunizations/${child.child_id}`}
                    className="group p-4 rounded-xl shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          child.compliance_status === 'compliant'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : child.compliance_status === 'overdue'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : child.compliance_status === 'exempt'
                                ? 'bg-purple-100 dark:bg-purple-900/30'
                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          <Baby className={`w-5 h-5 ${
                            child.compliance_status === 'compliant'
                              ? 'text-green-600 dark:text-green-400'
                              : child.compliance_status === 'overdue'
                                ? 'text-red-600 dark:text-red-400'
                                : child.compliance_status === 'exempt'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.floor(child.age_months / 12)}a {child.age_months % 12}m
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <ImmunizationStatusBadge status={child.compliance_status} />
                        <span className="text-gray-500 dark:text-gray-400">
                          {child.vaccines_complete}/{child.vaccines_required}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            child.compliance_status === 'compliant'
                              ? 'bg-green-500'
                              : child.compliance_status === 'overdue'
                                ? 'bg-red-500'
                                : child.compliance_status === 'exempt'
                                  ? 'bg-purple-500'
                                  : 'bg-yellow-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {child.provisional_enrollment && (
                        <ProvisionalBadge endDate={child.provisional_end_date} size="sm" />
                      )}

                      {child.next_due_vaccine && child.compliance_status !== 'compliant' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.immunizations.next}: {child.next_due_vaccine}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
