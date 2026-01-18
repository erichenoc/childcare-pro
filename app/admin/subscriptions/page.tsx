'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Search, RefreshCw, CheckCircle, Clock,
  AlertTriangle, X, Building2, Calendar, DollarSign
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/shared/lib/supabase/client'

interface Subscription {
  id: string
  organization_id: string
  organization_name: string
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  created_at: string
}

const STATUS_CONFIG = {
  active: { label: 'Activa', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trialing: { label: 'En Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  past_due: { label: 'Pago Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: X },
}

const PLAN_CONFIG = {
  free: { label: 'Gratis', color: 'bg-gray-100 text-gray-700', price: 0 },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', price: 49 },
  professional: { label: 'Pro', color: 'bg-purple-100 text-purple-700', price: 99 },
  enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-700', price: 199 },
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter])

  const fetchSubscriptions = async () => {
    setIsLoading(true)
    try {
      // Fetch organizations with subscription info
      let query = supabase
        .from('organizations')
        .select('id, name, plan_type, status, created_at, updated_at')

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Map to subscription format
      const subs: Subscription[] = (data || []).map(org => ({
        id: org.id,
        organization_id: org.id,
        organization_name: org.name,
        plan_type: org.plan_type || 'free',
        status: org.status === 'active' ? 'active' : org.status === 'trial' ? 'trialing' : 'cancelled',
        current_period_start: org.created_at,
        current_period_end: org.updated_at,
        created_at: org.created_at,
      }))

      if (statusFilter !== 'all') {
        setSubscriptions(subs.filter(s => s.status === statusFilter))
      } else {
        setSubscriptions(subs)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = searchTerm.toLowerCase()
    return sub.organization_name?.toLowerCase().includes(searchLower)
  })

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trialing: subscriptions.filter(s => s.status === 'trialing').length,
    mrr: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (PLAN_CONFIG[s.plan_type]?.price || 0), 0),
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
              <CreditCard className="w-7 h-7 text-blue-600" />
              Suscripciones
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestiona las suscripciones de las organizaciones
            </p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
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
                <p className="text-sm text-gray-500">Activas</p>
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
                <p className="text-sm text-gray-500">En Trial</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trialing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">MRR</p>
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
                  placeholder="Buscar por organización..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="trialing">En Trial</option>
                <option value="past_due">Pago Pendiente</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay suscripciones para mostrar</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Organización</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha Inicio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubscriptions.map((sub) => {
                    const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active
                    const planConfig = PLAN_CONFIG[sub.plan_type] || PLAN_CONFIG.free
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="font-medium text-gray-900">{sub.organization_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${planConfig.color}`}>
                            {planConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(planConfig.price)}/mes
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">
                              {format(new Date(sub.created_at), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true, locale: es })}
                            </p>
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
    </div>
  )
}
