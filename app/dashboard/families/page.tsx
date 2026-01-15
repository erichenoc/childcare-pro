'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Baby,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import { familiesService } from '@/features/families/services/families.service'
import type { Family } from '@/shared/types/database.types'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassAvatar,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassTableEmpty,
} from '@/shared/components/ui'

export default function FamiliesPage() {
  const t = useTranslations()
  const { formatCurrency } = useI18n()

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'active', label: t.common.active },
    { value: 'inactive', label: t.common.inactive },
  ]

  const balanceOptions = [
    { value: '', label: t.families.allBalances },
    { value: 'pending', label: t.families.withBalance },
    { value: 'clear', label: t.families.noBalance },
  ]

  const [families, setFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedBalance, setSelectedBalance] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, withBalance: 0, totalBalance: 0 })

  useEffect(() => {
    loadFamilies()
  }, [])

  async function loadFamilies() {
    try {
      setIsLoading(true)
      const [familiesData, statsData] = await Promise.all([
        familiesService.getAll(),
        familiesService.getStats(),
      ])
      setFamilies(familiesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.families.deleteFamilyConfirm)) return

    try {
      await familiesService.delete(id)
      setFamilies(families.filter(f => f.id !== id))
    } catch (error) {
      console.error('Error deleting family:', error)
    }
  }

  // Filter families based on search and filters
  const filteredFamilies = families.filter((family) => {
    const familyName = family.primary_contact_name
    const matchesSearch =
      familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (family.primary_contact_email || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !selectedStatus || family.status === selectedStatus
    const matchesBalance = !selectedBalance ||
      (selectedBalance === 'pending' && (family.balance || 0) > 0) ||
      (selectedBalance === 'clear' && (family.balance || 0) === 0)

    return matchesSearch && matchesStatus && matchesBalance
  })

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
          <h1 className="text-2xl font-bold text-gray-900">
            {t.families.title}
          </h1>
          <p className="text-gray-500">
            {t.families.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            {t.common.export}
          </GlassButton>
          <Link href="/dashboard/families/new">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.families.addFamily}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.families.totalFamilies}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.families.activeFamilies}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.withBalance}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.families.withBalance}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(stats.totalBalance)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.families.totalBalance}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <GlassInput
                placeholder={t.families.searchFamilies}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-48"
              />
              <GlassSelect
                options={balanceOptions}
                value={selectedBalance}
                onChange={(e) => setSelectedBalance(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Families List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredFamilies.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">{t.families.noFamiliesFound}</p>
          </GlassCard>
        ) : (
          filteredFamilies.map((family) => {
            const familyName = family.primary_contact_name
            return (
              <GlassCard key={family.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <GlassAvatar name={familyName} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {familyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t.nav.families}
                      </p>
                    </div>
                  </div>
                  {(family.balance || 0) > 0 && (
                    <GlassBadge variant="warning" size="sm">
                      {formatCurrency(family.balance || 0)}
                    </GlassBadge>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-blue-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{family.primary_contact_phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 truncate">{family.primary_contact_email || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-900">{family.address || '-'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/families/${family.id}`}>
                      <GlassButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        {t.common.view}
                      </GlassButton>
                    </Link>
                    <Link href={`/dashboard/families/${family.id}/edit`}>
                      <GlassButton variant="ghost" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        {t.common.edit}
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            )
          })
        )}
      </div>

      {/* Families Table - Desktop */}
      <div className="hidden md:block">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.families.familiesList}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="p-0">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>{t.nav.families}</GlassTableHead>
                  <GlassTableHead>{t.families.primaryContact}</GlassTableHead>
                  <GlassTableHead>{t.nav.children}</GlassTableHead>
                  <GlassTableHead>{t.billing.balance}</GlassTableHead>
                  <GlassTableHead>{t.families.portalAccess}</GlassTableHead>
                  <GlassTableHead className="text-right">{t.common.actions}</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {filteredFamilies.length === 0 ? (
                  <GlassTableEmpty title={t.families.noFamiliesFound} />
                ) : (
                  filteredFamilies.map((family) => {
                    const familyName = family.primary_contact_name
                    return (
                      <GlassTableRow key={family.id}>
                        <GlassTableCell>
                          <div className="flex items-center gap-3">
                            <GlassAvatar name={familyName} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {familyName}
                              </p>
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {family.address || '-'}
                              </p>
                            </div>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div>
                            <p className="text-gray-900">{familyName}</p>
                            <p className="text-sm text-gray-500">{family.primary_contact_phone || '-'}</p>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <GlassBadge variant="default" size="sm">
                            {t.families.viewChildren}
                          </GlassBadge>
                        </GlassTableCell>
                        <GlassTableCell>
                          {(family.balance || 0) > 0 ? (
                            <GlassBadge variant="warning">
                              {formatCurrency(family.balance || 0)}
                            </GlassBadge>
                          ) : (
                            <GlassBadge variant="success">
                              {t.billing.paid}
                            </GlassBadge>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <GlassBadge
                            variant={family.status === 'active' ? 'success' : 'default'}
                            dot
                          >
                            {family.status === 'active' ? t.common.active : t.common.inactive}
                          </GlassBadge>
                        </GlassTableCell>
                        <GlassTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/families/${family.id}`}>
                              <GlassButton variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </GlassButton>
                            </Link>
                            <Link href={`/dashboard/families/${family.id}/edit`}>
                              <GlassButton variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </GlassButton>
                            </Link>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              className="text-error hover:bg-error/10"
                              onClick={() => handleDelete(family.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </GlassButton>
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    )
                  })
                )}
              </GlassTableBody>
            </GlassTable>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
