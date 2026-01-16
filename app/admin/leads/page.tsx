'use client'

import { useState, useEffect } from 'react'
import {
  Users, Search, Filter, Phone, Mail, Calendar, MessageSquare,
  ChevronDown, ChevronRight, Star, Clock, Check, X,
  TrendingUp, Building2, MapPin, RefreshCw, Eye, Trash2,
  CalendarPlus, PhoneCall, Send
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  source: string
  status: string
  daycare_size: string | null
  location: string | null
  current_pain_points: string[] | null
  interested_features: string[] | null
  conversation_history: Array<{ role: string; content: string; timestamp?: string }> | null
  total_messages: number
  score: number
  priority: string
  notes: string | null
  created_at: string
  last_message_at: string | null
  appointments?: Appointment[]
}

interface Appointment {
  id: string
  title: string
  scheduled_date: string
  scheduled_time: string
  status: string
  duration_minutes: number
}

const STATUS_CONFIG = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: Star },
  contacted: { label: 'Contactado', color: 'bg-yellow-100 text-yellow-800', icon: PhoneCall },
  qualified: { label: 'Calificado', color: 'bg-purple-100 text-purple-800', icon: Check },
  demo_scheduled: { label: 'Demo Agendada', color: 'bg-indigo-100 text-indigo-800', icon: Calendar },
  trial_started: { label: 'Prueba Iniciada', color: 'bg-teal-100 text-teal-800', icon: TrendingUp },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-800', icon: Check },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-800', icon: X },
}

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'text-gray-500' },
  medium: { label: 'Media', color: 'text-yellow-500' },
  high: { label: 'Alta', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    qualified: 0,
    converted: 0
  })

  useEffect(() => {
    fetchLeads()
  }, [statusFilter])

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const url = statusFilter !== 'all'
        ? `/api/leads?status=${statusFilter}`
        : '/api/leads'

      const response = await fetch(url)
      const data = await response.json()

      if (data.leads) {
        setLeads(data.leads)

        // Calculate stats
        const newLeads = data.leads.filter((l: Lead) => l.status === 'new').length
        const qualified = data.leads.filter((l: Lead) => l.status === 'qualified').length
        const converted = data.leads.filter((l: Lead) => l.status === 'converted').length

        setStats({
          total: data.total || data.leads.length,
          new: newLeads,
          qualified,
          converted
        })
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchLeads()
        if (selectedLead?.id === leadId) {
          const updated = await response.json()
          setSelectedLead(updated.lead)
        }
      }
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  const deleteLead = async (leadId: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchLeads()
        if (selectedLead?.id === leadId) {
          setSelectedLead(null)
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  const scheduleAppointment = async (leadId: string, date: string, time: string) => {
    try {
      const lead = leads.find(l => l.id === leadId)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          scheduled_date: date,
          scheduled_time: time,
          lead_name: lead?.name,
          lead_email: lead?.email,
          lead_phone: lead?.phone
        })
      })

      if (response.ok) {
        fetchLeads()
        setShowScheduleModal(false)
        alert('¡Cita agendada exitosamente!')
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (lead.name?.toLowerCase().includes(searchLower) || '') ||
      (lead.email?.toLowerCase().includes(searchLower) || '') ||
      (lead.phone?.includes(searchTerm) || '') ||
      (lead.company_name?.toLowerCase().includes(searchLower) || '')
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Centro de Leads - ChildCare AI
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestiona y convierte tus prospectos en clientes
            </p>
          </div>
          <button
            onClick={fetchLeads}
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
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nuevos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Calificados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Convertidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="flex gap-6">
          {/* Leads List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="new">Nuevos</option>
                    <option value="contacted">Contactados</option>
                    <option value="qualified">Calificados</option>
                    <option value="demo_scheduled">Demo Agendada</option>
                    <option value="trial_started">Prueba Iniciada</option>
                    <option value="converted">Convertidos</option>
                    <option value="lost">Perdidos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay leads para mostrar</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lead</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mensajes</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map((lead) => {
                      const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
                      const priorityConfig = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{lead.name || 'Sin nombre'}</p>
                              {lead.company_name && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {lead.company_name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {lead.email && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </p>
                              )}
                              {lead.phone && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <statusConfig.icon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${lead.score}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${priorityConfig.color}`}>
                                {lead.score}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <MessageSquare className="w-4 h-4" />
                              {lead.total_messages || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm text-gray-900">
                                {format(new Date(lead.created_at), 'dd MMM', { locale: es })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedLead(lead) }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteLead(lead.id) }}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* Lead Details Panel */}
          {selectedLead && (
            <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Detalles del Lead</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Contacto</h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{selectedLead.name || 'Sin nombre'}</p>
                    {selectedLead.email && (
                      <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Mail className="w-4 h-4" />
                        {selectedLead.email}
                      </a>
                    )}
                    {selectedLead.phone && (
                      <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Phone className="w-4 h-4" />
                        {selectedLead.phone}
                      </a>
                    )}
                    {selectedLead.company_name && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        {selectedLead.company_name}
                      </p>
                    )}
                    {selectedLead.location && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {selectedLead.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Cambiar Estado</h3>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Acciones Rápidas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLead.phone && (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                      >
                        <Phone className="w-4 h-4" />
                        Llamar
                      </a>
                    )}
                    {selectedLead.email && (
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Send className="w-4 h-4" />
                        Email
                      </a>
                    )}
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition col-span-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Agendar Demo
                    </button>
                  </div>
                </div>

                {/* Pain Points */}
                {selectedLead.current_pain_points && selectedLead.current_pain_points.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Puntos de Dolor</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.current_pain_points.map((point, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interested Features */}
                {selectedLead.interested_features && selectedLead.interested_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Intereses</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.interested_features.map((feature, i) => (
                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Historial de Chat ({selectedLead.conversation_history.length} mensajes)
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                      {selectedLead.conversation_history.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg text-sm ${
                            msg.role === 'user'
                              ? 'bg-blue-100 text-blue-900 ml-4'
                              : 'bg-white text-gray-700 mr-4 border border-gray-200'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {msg.role === 'user' ? 'Cliente' : 'Ana (AI)'}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointments */}
                {selectedLead.appointments && selectedLead.appointments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Citas</h3>
                    <div className="space-y-2">
                      {selectedLead.appointments.map((apt) => (
                        <div key={apt.id} className="p-3 bg-purple-50 rounded-lg">
                          <p className="font-medium text-purple-900">{apt.title}</p>
                          <p className="text-sm text-purple-700">
                            {format(new Date(apt.scheduled_date), 'dd MMM yyyy', { locale: es })} - {apt.scheduled_time}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                            apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Appointment Modal */}
      {showScheduleModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agendar Demo</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              scheduleAppointment(
                selectedLead.id,
                formData.get('date') as string,
                formData.get('time') as string
              )
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
