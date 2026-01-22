'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Search, Filter, MoreVertical, Users, Baby,
  MapPin, Phone, Mail, Calendar, RefreshCw, Eye, Edit2,
  Trash2, AlertTriangle, CheckCircle, Clock, X, ChevronDown
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/shared/lib/supabase/client'
import { useTranslations } from '@/shared/lib/i18n'

interface Organization {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise' | null
  created_at: string
  updated_at: string
  children_count: number
  staff_count: number
  classrooms_count: number
  owner_name: string | null
  owner_email: string | null
}

const STATUS_CONFIG = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  suspended: { label: 'Suspendido', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: X },
}

const PLAN_CONFIG = {
  free: { label: 'Gratis', color: 'bg-gray-100 text-gray-700', price: 0 },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', price: 49 },
  professional: { label: 'Pro', color: 'bg-purple-100 text-purple-700', price: 99 },
  enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-700', price: 199 },
}

export default function AdminOrganizationsPage() {
  const t = useTranslations()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizations()
  }, [statusFilter, planFilter])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('organizations')
        .select(`
          *,
          children:children(count),
          staff:profiles(count),
          classrooms:classrooms(count)
        `)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (planFilter !== 'all') {
        query = query.eq('plan_type', planFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Fetch owner info for each org
      const orgsWithOwner = await Promise.all(
        (data || []).map(async (org) => {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('organization_id', org.id)
            .eq('role', 'owner')
            .single()

          return {
            ...org,
            children_count: org.children?.[0]?.count || 0,
            staff_count: org.staff?.[0]?.count || 0,
            classrooms_count: org.classrooms?.[0]?.count || 0,
            owner_name: ownerData ? `${ownerData.first_name} ${ownerData.last_name}` : null,
            owner_email: ownerData?.email || null,
          }
        })
      )

      setOrganizations(orgsWithOwner)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrgStatus = async (orgId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orgId)

      if (error) throw error
      fetchOrganizations()
    } catch (error) {
      console.error('Error updating organization:', error)
    }
  }

  const filteredOrganizations = organizations.filter((org) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.email?.toLowerCase().includes(searchLower) ||
      org.city?.toLowerCase().includes(searchLower) ||
      org.owner_name?.toLowerCase().includes(searchLower) ||
      org.owner_email?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: organizations.length,
    active: organizations.filter(o => o.status?.toLowerCase() === 'active').length,
    trial: organizations.filter(o => o.status?.toLowerCase() === 'trial').length,
    mrr: organizations.reduce((sum, org) => {
      if (org.status === 'active' && org.plan_type) {
        return sum + (PLAN_CONFIG[org.plan_type]?.price || 0)
      }
      return sum
    }, 0),
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              {t.admin.organizations}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.admin.manageAllDaycares}
            </p>
          </div>
          <button
            onClick={fetchOrganizations}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {t.admin.refresh}
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.admin.total}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.admin.activeFeminine}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.admin.inTrial}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 font-bold">$</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.admin.mrr}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.mrr)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.admin.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t.admin.allStatuses}</option>
                  <option value="active">{t.admin.activeMasculine}</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">{t.admin.suspended}</option>
                  <option value="cancelled">{t.admin.cancelled}</option>
                </select>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t.admin.allPlans}</option>
                  <option value="free">{t.admin.free}</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t.admin.noOrganizationsToShow}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.organization}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.owner}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.location}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.status}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.plan}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.metrics}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.date}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrganizations.map((org) => {
                    const statusConfig = STATUS_CONFIG[org.status] || STATUS_CONFIG.active
                    const planConfig = PLAN_CONFIG[org.plan_type || 'free'] || PLAN_CONFIG.free

                    return (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{org.name}</p>
                              {org.email && (
                                <p className="text-sm text-gray-500">{org.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{org.owner_name || t.admin.unassigned}</p>
                            {org.owner_email && (
                              <p className="text-xs text-gray-500">{org.owner_email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {org.city ? (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {org.city}, {org.state}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${planConfig.color}`}>
                            {planConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1" title="Niños">
                              <Baby className="w-4 h-4 text-pink-500" />
                              {org.children_count}
                            </span>
                            <span className="flex items-center gap-1" title="Staff">
                              <Users className="w-4 h-4 text-blue-500" />
                              {org.staff_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">
                              {format(new Date(org.created_at), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(org.created_at), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedOrg(org)
                                setShowDetailsModal(true)
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title={t.admin.viewDetails}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative group">
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block z-10">
                                {org.status !== 'active' && (
                                  <button
                                    onClick={() => updateOrgStatus(org.id, 'active')}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                                  >
                                    {t.admin.activate}
                                  </button>
                                )}
                                {org.status !== 'suspended' && (
                                  <button
                                    onClick={() => updateOrgStatus(org.id, 'suspended')}
                                    className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50"
                                  >
                                    {t.admin.suspend}
                                  </button>
                                )}
                                {org.status !== 'cancelled' && (
                                  <button
                                    onClick={() => updateOrgStatus(org.id, 'cancelled')}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    {t.admin.cancel}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-lg font-semibold text-white">{t.admin.organizationDetails}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedOrg.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(STATUS_CONFIG[selectedOrg.status] || STATUS_CONFIG.active).color}`}>
                        {(STATUS_CONFIG[selectedOrg.status] || STATUS_CONFIG.active).label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(PLAN_CONFIG[selectedOrg.plan_type || 'free'] || PLAN_CONFIG.free).color}`}>
                        {(PLAN_CONFIG[selectedOrg.plan_type || 'free'] || PLAN_CONFIG.free).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">{t.admin.contact}</h4>
                    {selectedOrg.email && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {selectedOrg.email}
                      </p>
                    )}
                    {selectedOrg.phone && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {selectedOrg.phone}
                      </p>
                    )}
                    {selectedOrg.address && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {selectedOrg.address}, {selectedOrg.city}, {selectedOrg.state}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase">{t.admin.owner}</h4>
                    <p className="text-gray-900 font-medium">{selectedOrg.owner_name || t.admin.notAssigned}</p>
                    {selectedOrg.owner_email && (
                      <p className="text-gray-600">{selectedOrg.owner_email}</p>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t.admin.metrics}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-pink-50 rounded-xl p-4 text-center">
                      <Baby className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{selectedOrg.children_count}</p>
                      <p className="text-sm text-gray-500">{t.admin.childrenLabel}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{selectedOrg.staff_count}</p>
                      <p className="text-sm text-gray-500">{t.admin.staffLabel}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <Building2 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{selectedOrg.classrooms_count}</p>
                      <p className="text-sm text-gray-500">{t.admin.classrooms}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t.admin.timeline}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {t.admin.created}: {format(new Date(selectedOrg.created_at), 'PPP', { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {t.admin.lastUpdated}: {format(new Date(selectedOrg.updated_at), 'PPP', { locale: es })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      updateOrgStatus(selectedOrg.id, selectedOrg.status === 'active' ? 'suspended' : 'active')
                      setShowDetailsModal(false)
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      selectedOrg.status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedOrg.status === 'active' ? t.admin.suspend : t.admin.activate}
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t.admin.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
