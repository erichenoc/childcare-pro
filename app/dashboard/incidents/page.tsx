'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  AlertTriangle,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
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
} from '@/shared/components/ui'
import { incidentsService, type IncidentWithRelations } from '@/features/incidents/services/incidents.service'

// Note: Options are now built dynamically inside the component to use translations

interface IncidentDisplay {
  id: string
  child: { id: string; name: string }
  type: string
  severity: string
  description: string
  location: string
  date: string
  reportedBy: { name: string }
  status: string
  parentNotified: boolean
  firstAid: string | null
}

export default function IncidentsPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [incidents, setIncidents] = useState<IncidentDisplay[]>([])
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, severe: 0 })

  // Build options with translations
  const typeOptions = [
    { value: '', label: t.common.all },
    { value: 'injury', label: t.incidents.injury },
    { value: 'illness', label: t.incidents.illness },
    { value: 'behavioral', label: t.incidents.behavior },
    { value: 'accident', label: t.incidents.accident },
    { value: 'other', label: t.incidents.other },
  ]

  const severityOptions = [
    { value: '', label: t.common.all },
    { value: 'low', label: t.incidents.minor },
    { value: 'medium', label: t.incidents.moderate },
    { value: 'high', label: t.incidents.severe },
  ]

  const statusOptions = [
    { value: '', label: t.common.allStatuses },
    { value: 'pending', label: t.incidents.open },
    { value: 'active', label: t.incidents.pendingReview },
    { value: 'inactive', label: t.incidents.resolved },
  ]

  const typeLabels: Record<string, string> = {
    injury: t.incidents.injury,
    illness: t.incidents.illness,
    behavioral: t.incidents.behavior,
    accident: t.incidents.accident,
    other: t.incidents.other,
  }

  const severityLabels: Record<string, string> = {
    low: t.incidents.minor,
    medium: t.incidents.moderate,
    high: t.incidents.severe,
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)

      const [incidentsData, statsData] = await Promise.all([
        incidentsService.getAll(),
        incidentsService.getStats(),
      ])

      // Transform incidents to display format
      const transformedIncidents: IncidentDisplay[] = incidentsData.map(i => ({
        id: i.id,
        child: {
          id: i.child?.id || '',
          name: i.child ? `${i.child.first_name} ${i.child.last_name}` : t.common.noResults,
        },
        type: i.incident_type,
        severity: i.severity || 'low',
        description: i.description,
        location: i.location || t.common.unassigned,
        date: i.occurred_at,
        reportedBy: {
          name: i.reporter ? `${i.reporter.first_name} ${i.reporter.last_name}` : t.communication.system,
        },
        status: i.status || 'pending',
        parentNotified: i.parent_notified || false,
        firstAid: i.action_taken,
      }))

      setIncidents(transformedIncidents)
      setStats(statsData)

    } catch (error) {
      console.error('Error loading incidents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter incidents
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || incident.type === selectedType
    const matchesSeverity = !selectedSeverity || incident.severity === selectedSeverity
    const matchesStatus = !selectedStatus || incident.status === selectedStatus

    return matchesSearch && matchesType && matchesSeverity && matchesStatus
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <GlassBadge variant="success" size="sm">{severityLabels[severity] || t.incidents.minor}</GlassBadge>
      case 'medium':
        return <GlassBadge variant="warning" size="sm">{severityLabels[severity] || t.incidents.moderate}</GlassBadge>
      case 'high':
        return <GlassBadge variant="error" size="sm">{severityLabels[severity] || t.incidents.severe}</GlassBadge>
      default:
        return <GlassBadge variant="default" size="sm">{severity}</GlassBadge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <GlassBadge variant="error" dot>{t.incidents.open}</GlassBadge>
      case 'active':
        return <GlassBadge variant="warning" dot>{t.incidents.pendingReview}</GlassBadge>
      case 'inactive':
        return <GlassBadge variant="success" dot>{t.incidents.resolved}</GlassBadge>
      default:
        return <GlassBadge variant="default">{status}</GlassBadge>
    }
  }

  const formatIncidentDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${formatDate(dateString)} - ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
  }

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
            {t.incidents.title}
          </h1>
          <p className="text-gray-500">
            {t.incidents.subtitle}
          </p>
        </div>

        <Link href="/dashboard/incidents/new">
          <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            {t.incidents.createIncident}
          </GlassButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">{t.billing.total}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-sm text-gray-500">{t.billing.pending}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-sm text-gray-500">{t.incidents.resolved}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.severe}</p>
              <p className="text-sm text-gray-500">{t.incidents.severe}</p>
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
                placeholder={t.incidents.searchIncidents}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GlassSelect
                options={typeOptions}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full"
              />
              <GlassSelect
                options={severityOptions}
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full"
              />
              <GlassSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">{t.incidents.noIncidentsFound}</p>
          </GlassCard>
        ) : (
          filteredIncidents.map((incident) => (
            <GlassCard key={incident.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900">{incident.child.name}</p>
                      <GlassBadge variant="default" size="sm">{typeLabels[incident.type] || incident.type}</GlassBadge>
                      {getSeverityBadge(incident.severity)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{formatIncidentDate(incident.date)}</span>
                      <span>📍 {incident.location}</span>
                      <span>👤 {incident.reportedBy.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  {getStatusBadge(incident.status)}
                  {incident.parentNotified && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t.incidents.parentNotified}
                    </span>
                  )}
                </div>
              </div>

              {incident.firstAid && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t.incidents.firstAid}:</span> {incident.firstAid}
                  </p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-blue-100 flex justify-end gap-2">
                <Link href={`/dashboard/incidents/${incident.id}`}>
                  <GlassButton variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    {t.common.view}
                  </GlassButton>
                </Link>
                <Link href={`/dashboard/incidents/${incident.id}/edit`}>
                  <GlassButton variant="ghost" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    {t.common.edit}
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
