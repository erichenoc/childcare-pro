'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Search, RefreshCw, Filter, Clock,
  User, AlertTriangle, CheckCircle, Info, XCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/shared/lib/supabase/client'

interface LogEntry {
  id: string
  level: 'info' | 'warning' | 'error' | 'success'
  action: string
  description: string
  user_email: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const LEVEL_CONFIG = {
  info: { label: 'Info', color: 'bg-blue-100 text-blue-700', icon: Info },
  warning: { label: 'Advertencia', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: XCircle },
  success: { label: 'Éxito', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

// Mock data for demonstration
const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    level: 'success',
    action: 'user.login',
    description: 'Usuario inició sesión exitosamente',
    user_email: 'admin@example.com',
    metadata: { ip: '192.168.1.1' },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    level: 'info',
    action: 'org.created',
    description: 'Nueva organización registrada',
    user_email: 'owner@daycare.com',
    metadata: { org_name: 'Happy Kids Daycare' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    level: 'warning',
    action: 'payment.failed',
    description: 'Intento de pago fallido',
    user_email: 'billing@example.com',
    metadata: { amount: 99, reason: 'insufficient_funds' },
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    level: 'error',
    action: 'system.error',
    description: 'Error en el servidor de correo',
    user_email: null,
    metadata: { service: 'email', error: 'SMTP timeout' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  useEffect(() => {
    fetchLogs()
  }, [levelFilter])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      // In production, this would fetch from a logs table
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500))

      let filteredLogs = [...MOCK_LOGS]
      if (levelFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === levelFilter)
      }

      setLogs(filteredLogs)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    info: logs.filter(l => l.level === 'info' || l.level === 'success').length,
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              Logs del Sistema
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitorea la actividad del sistema
            </p>
          </div>
          <button
            onClick={fetchLogs}
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
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Errores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.errors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Advertencias</p>
                <p className="text-2xl font-bold text-gray-900">{stats.warnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Info/Éxito</p>
                <p className="text-2xl font-bold text-gray-900">{stats.info}</p>
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
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los niveles</option>
                <option value="error">Errores</option>
                <option value="warning">Advertencias</option>
                <option value="info">Info</option>
                <option value="success">Éxito</option>
              </select>
            </div>
          </div>

          {/* Logs List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay logs para mostrar</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const levelConfig = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${levelConfig.color}`}>
                        <levelConfig.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelConfig.color}`}>
                            {levelConfig.label}
                          </span>
                          <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {log.action}
                          </code>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                        {log.user_email && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user_email}
                          </p>
                        )}
                        {log.metadata && (
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-600 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
