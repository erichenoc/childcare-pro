'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sun,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Edit,
  Loader2,
  MapPin,
  Clock,
  Palette,
  Trophy,
  GraduationCap,
  Music,
  ChefHat,
  Globe,
  X,
} from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import {
  programIncomeService,
  type SummerCampWeek,
  type SummerCampActivity,
  SUMMER_CAMP_THEMES,
} from '@/features/accounting/services/program-income.service'

const activityTypeIcons: Record<string, React.ReactNode> = {
  field_trip: <MapPin className="w-4 h-4" />,
  swimming: <Sun className="w-4 h-4" />,
  arts_crafts: <Palette className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
  educational: <GraduationCap className="w-4 h-4" />,
  special_event: <Music className="w-4 h-4" />,
  other: <Calendar className="w-4 h-4" />,
}

const activityTypeColors: Record<string, string> = {
  field_trip: 'bg-blue-100 text-blue-700',
  swimming: 'bg-cyan-100 text-cyan-700',
  arts_crafts: 'bg-pink-100 text-pink-700',
  sports: 'bg-green-100 text-green-700',
  educational: 'bg-purple-100 text-purple-700',
  special_event: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
}

export default function SummerCampPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [weeks, setWeeks] = useState<SummerCampWeek[]>([])
  const [selectedWeek, setSelectedWeek] = useState<SummerCampWeek | null>(null)
  const [activities, setActivities] = useState<SummerCampActivity[]>([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    activity_date: '',
    start_time: '09:00',
    end_time: '12:00',
    activity_type: 'arts_crafts' as const,
    location: '',
    additional_cost: 0,
    requires_permission: false,
  })

  useEffect(() => {
    loadWeeks()
  }, [selectedYear])

  useEffect(() => {
    if (selectedWeek) {
      loadActivities(selectedWeek.id)
    }
  }, [selectedWeek])

  async function loadWeeks() {
    setIsLoading(true)
    try {
      const data = await programIncomeService.getSummerCampWeeks(selectedYear)
      setWeeks(data)
      if (data.length > 0 && !selectedWeek) {
        setSelectedWeek(data[0])
      }
    } catch (error) {
      console.error('Error loading summer camp weeks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadActivities(weekId: string) {
    try {
      const data = await programIncomeService.getSummerCampActivities(weekId)
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const totalEnrollments = weeks.reduce((sum, w) => sum + w.current_enrollment, 0)
  const totalRevenue = weeks.reduce((sum, w) => sum + (w.current_enrollment * w.weekly_rate), 0)

  // Generate days for the selected week
  const getWeekDays = (week: SummerCampWeek) => {
    const days = []
    const start = new Date(week.start_date)
    for (let i = 0; i < 5; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day.toISOString().split('T')[0])
    }
    return days
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
        <div className="flex items-center gap-3">
          <Link href="/dashboard/accounting/program-income">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Summer Camp {selectedYear}</h1>
            <p className="text-gray-500">
              Gestión de semanas y actividades del campamento de verano
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={[2024, 2025, 2026, 2027].map(y => ({ value: String(y), label: String(y) }))}
            className="w-28"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard variant="clear" className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">10</p>
              <p className="text-sm text-gray-500">Semanas Totales</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
              <p className="text-sm text-gray-500">Total Inscripciones</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-500">Ingresos Proyectados</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Weeks List */}
        <div className="col-span-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                Semanas del Campamento
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {weeks.map((week) => (
                  <button
                    key={week.id}
                    onClick={() => setSelectedWeek(week)}
                    className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedWeek?.id === week.id ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Semana {week.week_number}</p>
                        <p className="text-sm text-yellow-600 font-medium">{week.theme}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(week.start_date).toLocaleDateString('es-US', { month: 'short', day: 'numeric' })} -
                          {new Date(week.end_date).toLocaleDateString('es-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          week.current_enrollment >= week.max_capacity * 0.9
                            ? 'bg-red-100 text-red-700'
                            : week.current_enrollment >= week.max_capacity * 0.7
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {week.current_enrollment}/{week.max_capacity}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(week.weekly_rate)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Week Details & Activities */}
        <div className="col-span-8">
          {selectedWeek ? (
            <div className="space-y-6">
              {/* Week Header */}
              <GlassCard className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <GlassCardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Semana {selectedWeek.week_number}</p>
                      <h2 className="text-2xl font-bold mt-1">{selectedWeek.theme}</h2>
                      <p className="text-yellow-100 mt-2">{selectedWeek.description}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(selectedWeek.start_date).toLocaleDateString('es-US', { month: 'long', day: 'numeric' })} -
                            {new Date(selectedWeek.end_date).toLocaleDateString('es-US', { month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{selectedWeek.current_enrollment} inscritos</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{formatCurrency(selectedWeek.weekly_rate)}</p>
                      <p className="text-yellow-100 text-sm">por semana</p>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Daily Activities */}
              <GlassCard>
                <GlassCardHeader>
                  <div className="flex items-center justify-between w-full">
                    <GlassCardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Actividades de la Semana
                    </GlassCardTitle>
                    <GlassButton size="sm" onClick={() => setShowActivityModal(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Actividad
                    </GlassButton>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  {/* Days Grid */}
                  <div className="grid grid-cols-5 gap-4">
                    {getWeekDays(selectedWeek).map((day, index) => {
                      const dayActivities = activities.filter(a => a.activity_date === day)
                      const dayName = new Date(day).toLocaleDateString('es-US', { weekday: 'short' })
                      const dayNum = new Date(day).getDate()

                      return (
                        <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 p-2 text-center border-b border-gray-200">
                            <p className="text-xs text-gray-500 uppercase">{dayName}</p>
                            <p className="text-lg font-bold text-gray-900">{dayNum}</p>
                          </div>
                          <div className="p-2 min-h-[150px] space-y-2">
                            {dayActivities.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center mt-4">Sin actividades</p>
                            ) : (
                              dayActivities.map((activity) => (
                                <div
                                  key={activity.id}
                                  className={`p-2 rounded-lg text-xs ${activityTypeColors[activity.activity_type]}`}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    {activityTypeIcons[activity.activity_type]}
                                    <span className="font-medium truncate">{activity.name}</span>
                                  </div>
                                  <p className="text-[10px] opacity-75">
                                    {activity.start_time} - {activity.end_time}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Default Activities for Theme */}
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      Actividades Sugeridas para "{selectedWeek.theme}"
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700">
                      {selectedWeek.theme === 'Ocean Adventures' && (
                        <>
                          <div>• Experimento de densidad del agua</div>
                          <div>• Manualidades de animales marinos</div>
                          <div>• Película: Buscando a Nemo</div>
                          <div>• Día de piscina con juegos</div>
                        </>
                      )}
                      {selectedWeek.theme === 'Space Explorers' && (
                        <>
                          <div>• Construir cohetes de cartón</div>
                          <div>• Planetario casero</div>
                          <div>• Experimento de cráteres lunares</div>
                          <div>• Película espacial</div>
                        </>
                      )}
                      {selectedWeek.theme === 'Art & Creativity' && (
                        <>
                          <div>• Pintura al aire libre</div>
                          <div>• Escultura con arcilla</div>
                          <div>• Collage grupal</div>
                          <div>• Exposición de arte</div>
                        </>
                      )}
                      {/* Default activities for other themes */}
                      {!['Ocean Adventures', 'Space Explorers', 'Art & Creativity'].includes(selectedWeek.theme) && (
                        <>
                          <div>• Actividades temáticas del día</div>
                          <div>• Manualidades relacionadas</div>
                          <div>• Juegos educativos</div>
                          <div>• Actividades al aire libre</div>
                        </>
                      )}
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="h-full flex items-center justify-center">
              <div className="text-center py-12">
                <Sun className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una semana para ver los detalles</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Activity Modal */}
      {showActivityModal && selectedWeek && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg">
            <GlassCardHeader>
              <div className="flex items-center justify-between w-full">
                <GlassCardTitle>Nueva Actividad</GlassCardTitle>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActivityModal(false)}
                >
                  <X className="w-4 h-4" />
                </GlassButton>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Actividad
                  </label>
                  <GlassInput
                    type="text"
                    placeholder="Ej: Experimento de volcanes"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <GlassSelect
                      value={newActivity.activity_date}
                      onChange={(e) => setNewActivity({ ...newActivity, activity_date: e.target.value })}
                      options={[
                        { value: '', label: 'Seleccionar día' },
                        ...getWeekDays(selectedWeek).map(day => ({
                          value: day,
                          label: new Date(day).toLocaleDateString('es-US', { weekday: 'long', day: 'numeric' })
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Actividad
                    </label>
                    <GlassSelect
                      value={newActivity.activity_type}
                      onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value as typeof newActivity.activity_type })}
                      options={[
                        { value: 'arts_crafts', label: 'Arte y Manualidades' },
                        { value: 'sports', label: 'Deportes' },
                        { value: 'swimming', label: 'Piscina/Agua' },
                        { value: 'educational', label: 'Educativo' },
                        { value: 'field_trip', label: 'Excursión' },
                        { value: 'special_event', label: 'Evento Especial' },
                        { value: 'other', label: 'Otro' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio
                    </label>
                    <GlassInput
                      type="time"
                      value={newActivity.start_time}
                      onChange={(e) => setNewActivity({ ...newActivity, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin
                    </label>
                    <GlassInput
                      type="time"
                      value={newActivity.end_time}
                      onChange={(e) => setNewActivity({ ...newActivity, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación (opcional)
                  </label>
                  <GlassInput
                    type="text"
                    placeholder="Ej: Parque Central, Salón de Arte"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Adicional (si aplica)
                  </label>
                  <GlassInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newActivity.additional_cost}
                    onChange={(e) => setNewActivity({ ...newActivity, additional_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_permission"
                    checked={newActivity.requires_permission}
                    onChange={(e) => setNewActivity({ ...newActivity, requires_permission: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor="requires_permission" className="text-sm text-gray-700">
                    Requiere permiso de los padres
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowActivityModal(false)}
                  >
                    Cancelar
                  </GlassButton>
                  <GlassButton
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => {
                      // TODO: Save activity
                      setShowActivityModal(false)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Actividad
                  </GlassButton>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
