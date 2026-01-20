'use client'

import {
  UtensilsCrossed,
  Moon,
  Baby,
  Activity,
  Smile,
  Heart,
} from 'lucide-react'

interface DailySummaryStatsProps {
  mealsCount: number
  napsCount: number
  bathroomCount: number
  activitiesCount: number
  moodsCount: number
  healthCount: number
}

export function DailySummaryStats({
  mealsCount,
  napsCount,
  bathroomCount,
  activitiesCount,
  moodsCount,
  healthCount,
}: DailySummaryStatsProps) {
  const stats = [
    {
      label: 'Meals',
      value: mealsCount,
      icon: UtensilsCrossed,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: 'Naps',
      value: napsCount,
      icon: Moon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Bathroom',
      value: bathroomCount,
      icon: Baby,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Activities',
      value: activitiesCount,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Moods',
      value: moodsCount,
      icon: Smile,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Health',
      value: healthCount,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex flex-col items-center p-3 rounded-xl shadow-neu dark:shadow-neu-dark"
          >
            <div className={`p-2 rounded-lg ${stat.bgColor} mb-2`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
          </div>
        )
      })}
    </div>
  )
}
