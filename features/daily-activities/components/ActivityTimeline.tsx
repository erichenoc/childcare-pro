'use client'

import { useMemo } from 'react'
import {
  UtensilsCrossed,
  Moon,
  Baby,
  Activity,
  Smile,
  Heart,
  Clock,
} from 'lucide-react'
import type {
  MealRecord,
  NapRecord,
  BathroomRecord,
  ActivityRecord,
  MoodRecord,
  HealthObservation,
} from '@/shared/types/daily-activities'
import { MEAL_TYPE_LABELS, ACTIVITY_TYPE_LABELS, MOOD_EMOJIS } from '@/shared/types/daily-activities'
import { MoodBadge } from './MoodBadge'
import { AmountBadge, NapQualityBadge } from './AmountBadge'

interface TimelineItem {
  id: string
  type: 'meal' | 'nap' | 'bathroom' | 'activity' | 'mood' | 'health'
  time: string
  data: MealRecord | NapRecord | BathroomRecord | ActivityRecord | MoodRecord | HealthObservation
}

interface ActivityTimelineProps {
  meals: MealRecord[]
  naps: NapRecord[]
  bathroom: BathroomRecord[]
  activities: ActivityRecord[]
  moods: MoodRecord[]
  healthObservations: HealthObservation[]
}

const typeIcons = {
  meal: UtensilsCrossed,
  nap: Moon,
  bathroom: Baby,
  activity: Activity,
  mood: Smile,
  health: Heart,
}

const typeColors = {
  meal: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  nap: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  bathroom: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  activity: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  mood: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  health: 'text-red-500 bg-red-100 dark:bg-red-900/30',
}

export function ActivityTimeline({
  meals,
  naps,
  bathroom,
  activities,
  moods,
  healthObservations,
}: ActivityTimelineProps) {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...meals.map((m) => ({
        id: m.id,
        type: 'meal' as const,
        time: m.meal_time,
        data: m,
      })),
      ...naps.map((n) => ({
        id: n.id,
        type: 'nap' as const,
        time: n.start_time,
        data: n,
      })),
      ...bathroom.map((b) => ({
        id: b.id,
        type: 'bathroom' as const,
        time: b.record_time,
        data: b,
      })),
      ...activities.map((a) => ({
        id: a.id,
        type: 'activity' as const,
        time: a.activity_time,
        data: a,
      })),
      ...moods.map((m) => ({
        id: m.id,
        type: 'mood' as const,
        time: m.record_time,
        data: m,
      })),
      ...healthObservations.map((h) => ({
        id: h.id,
        type: 'health' as const,
        time: h.observation_time,
        data: h,
      })),
    ]

    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }, [meals, naps, bathroom, activities, moods, healthObservations])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const renderItemContent = (item: TimelineItem) => {
    switch (item.type) {
      case 'meal': {
        const meal = item.data as MealRecord
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {MEAL_TYPE_LABELS[meal.meal_type]}
            </p>
            {meal.food_served && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{meal.food_served}</p>
            )}
            {meal.amount_eaten && <AmountBadge amount={meal.amount_eaten} size="sm" className="mt-1" />}
          </div>
        )
      }
      case 'nap': {
        const nap = item.data as NapRecord
        const duration = nap.duration_minutes
          ? `${Math.floor(nap.duration_minutes / 60)}h ${nap.duration_minutes % 60}m`
          : nap.end_time
          ? 'Completed'
          : 'In progress...'
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Nap</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{duration}</p>
            {nap.quality && <NapQualityBadge quality={nap.quality} size="sm" className="mt-1" />}
          </div>
        )
      }
      case 'bathroom': {
        const record = item.data as BathroomRecord
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {record.record_type === 'diaper' ? 'Diaper Change' : record.record_type}
            </p>
            {record.diaper_condition && (
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {record.diaper_condition}
              </p>
            )}
            {record.potty_success !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {record.potty_success ? 'Successful' : 'Attempted'}
              </p>
            )}
          </div>
        )
      }
      case 'activity': {
        const activity = item.data as ActivityRecord
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {activity.activity_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ACTIVITY_TYPE_LABELS[activity.activity_type]}
            </p>
          </div>
        )
      }
      case 'mood': {
        const mood = item.data as MoodRecord
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Mood Check</p>
            <MoodBadge mood={mood.mood} size="sm" className="mt-1" />
          </div>
        )
      }
      case 'health': {
        const obs = item.data as HealthObservation
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {obs.observation_type.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {obs.description}
            </p>
          </div>
        )
      }
    }
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No activities recorded today</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {timelineItems.map((item) => {
        const Icon = typeIcons[item.type]
        const colorClass = typeColors[item.type]

        return (
          <div key={`${item.type}-${item.id}`} className="flex gap-3">
            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              {renderItemContent(item)}
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">
              {formatTime(item.time)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
