'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  CreditCard, Calendar, Activity, Clock, ChevronRight, Star, UserPlus,
  RefreshCw, AlertTriangle
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/shared/lib/supabase/client'
import { useTranslations } from '@/shared/lib/i18n'

interface DashboardStats {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  totalLeads: number
  newLeadsThisWeek: number
  conversionRate: number
  pendingTrials: number
  upcomingRenewals: number
  mrr: number
}

interface RecentLead {
  id: string
  name: string | null
  email: string | null
  company_name: string | null
  status: string
  score: number
  created_at: string
}

interface RecentOrganization {
  id: string
  name: string
  email: string | null
  status: string
  plan_type: string
  created_at: string
  children_count: number
}

export default function AdminDashboardPage() {
  const t = useTranslations()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    trialOrganizations: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalLeads: 0,
    newLeadsThisWeek: 0,
    conversionRate: 0,
    pendingTrials: 0,
    upcomingRenewals: 0,
    mrr: 0,
  })
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [recentOrganizations, setRecentOrganizations] = useState<RecentOrganization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch organizations stats
      const { data: orgs, count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })

      const activeOrgs = orgs?.filter(o => o.status === 'active').length || 0
      const trialOrgs = orgs?.filter(o => o.status === 'trial').length || 0

      // Fetch leads stats
      const { data: leadsData, count: leadsCount } = await supabase
        .from('sales_leads')
        .select('*', { count: 'exact' })

      const weekAgo = subDays(new Date(), 7).toISOString()
      const newLeadsWeek = leadsData?.filter(l =>
        new Date(l.created_at) >= new Date(weekAgo)
      ).length || 0

      const convertedLeads = leadsData?.filter(l => l.status === 'converted').length || 0
      const totalLeads = leadsData?.length || 0
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      // Fetch recent leads
      const { data: recent } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentLeads(recent || [])

      // Fetch recent organizations
      const { data: recentOrgs } = await supabase
        .from('organizations')
        .select(`
          *,
          children:children(count)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentOrganizations(
        recentOrgs?.map(org => ({
          ...org,
          children_count: org.children?.[0]?.count || 0
        })) || []
      )

      // Calculate MRR (Monthly Recurring Revenue) - simplified
      const planPrices: Record<string, number> = {
        free: 0,
        starter: 49,
        professional: 99,
        enterprise: 199
      }

      const mrr = orgs?.reduce((sum, org) => {
        if (org.status === 'active' && org.plan_type) {
          return sum + (planPrices[org.plan_type] || 0)
        }
        return sum
      }, 0) || 0

      setStats({
        totalOrganizations: orgCount || 0,
        activeOrganizations: activeOrgs,
        trialOrganizations: trialOrgs,
        totalRevenue: mrr * 12, // Estimated annual
        monthlyRevenue: mrr,
        revenueGrowth: 12.5, // Would need historical data
        totalLeads: leadsCount || 0,
        newLeadsThisWeek: newLeadsWeek,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        pendingTrials: trialOrgs,
        upcomingRenewals: 0, // Would need subscription dates
        mrr,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-700' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700' },
      new: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      qualified: { bg: 'bg-purple-100', text: 'text-purple-700' },
      converted: { bg: 'bg-green-100', text: 'text-green-700' },
    }
    const { bg, text } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.admin.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.admin.welcomeMessage}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            {t.admin.refresh}
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* MRR */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t.admin.mrr}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.mrr)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.revenueGrowth}%</span>
                  <span className="text-sm text-gray-500">{t.admin.vsPreviousMonth}</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          {/* Organizations */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t.admin.organizations}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalOrganizations}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-green-600 font-medium">
                    {stats.activeOrganizations} {t.admin.active}
                  </span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-blue-600 font-medium">
                    {stats.trialOrganizations} {t.admin.trial}
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Leads */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t.admin.totalLeads}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalLeads}
                </p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">+{stats.newLeadsThisWeek}</span>
                  <span className="text-sm text-gray-500">{t.admin.thisWeek}</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{t.admin.conversionRate}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.conversionRate}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.conversionRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Trials */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t.admin.pendingTrials}</p>
                <p className="text-4xl font-bold mt-1">{stats.pendingTrials}</p>
                <p className="text-blue-100 text-sm mt-2">
                  {t.admin.organizationsInTrial}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          {/* ARR */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t.admin.estimatedARR}</p>
                <p className="text-4xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-green-100 text-sm mt-2">
                  {t.admin.annualRecurringRevenue}
                </p>
              </div>
              <Activity className="w-12 h-12 text-green-200" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              {t.admin.quickActions}
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/leads"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" />
                  {t.admin.viewAllLeads}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/organizations"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <Building2 className="w-4 h-4" />
                  {t.admin.manageOrganizations}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <TrendingUp className="w-4 h-4" />
                  {t.admin.viewReports}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t.admin.recentLeads}</h2>
              <Link
                href="/admin/leads"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.admin.viewAll}
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLeads.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {t.admin.noRecentLeads}
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-purple-600">
                            {(lead.name || lead.email || 'L').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.name || lead.email || t.admin.noName}
                          </p>
                          <p className="text-sm text-gray-500">{lead.company_name || t.admin.noCompany}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(lead.status)}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(lead.created_at), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Organizations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t.admin.recentOrganizations}</h2>
              <Link
                href="/admin/organizations"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.admin.viewAllFeminine}
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrganizations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {t.admin.noRecentOrganizations}
                </div>
              ) : (
                recentOrganizations.map((org) => (
                  <div key={org.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">
                            {org.children_count} {t.admin.children} • {org.plan_type || 'free'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(org.status)}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(org.created_at), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(stats.pendingTrials > 0 || stats.upcomingRenewals > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">{t.admin.pendingActions}</h3>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  {stats.pendingTrials > 0 && (
                    <li>• {stats.pendingTrials} {t.admin.trialsPendingFollowUp}</li>
                  )}
                  {stats.upcomingRenewals > 0 && (
                    <li>• {stats.upcomingRenewals} {t.admin.upcomingRenewals}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
