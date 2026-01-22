'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Baby, Target, Star, BookOpen, Filter } from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { learningMilestonesService } from '@/features/learning-milestones/services/learning-milestones.service'
import {
  MilestoneSummaryGrid,
  OverallMilestoneProgress,
  MilestoneList,
  RecentAchievements,
} from '@/features/learning-milestones/components'
import type {
  ChildMilestone,
  MilestoneSummary,
  MilestoneCategory,
  MilestoneStatus,
} from '@/shared/types/learning-milestones'
import { useTranslations } from '@/shared/lib/i18n'

interface ChildBasic {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

export default function LearningMilestonesPage() {
  const t = useTranslations()
  const [children, setChildren] = useState<ChildBasic[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<MilestoneCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [milestones, setMilestones] = useState<ChildMilestone[]>([])
  const [summary, setSummary] = useState<MilestoneSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'overview' | 'milestones'>('overview')

  // Load children list
  useEffect(() => {
    async function loadChildren() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use profiles table (not staff) to get organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data } = await supabase
        .from('children')
        .select('id, first_name, last_name, date_of_birth')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('first_name')

      if (data) {
        setChildren(data)
        if (data.length > 0) {
          setSelectedChildId(data[0].id)
        }
      }
    }

    loadChildren()
  }, [])

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await learningMilestonesService.getMilestoneCategories()
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load milestones and summary for selected child
  const loadChildData = useCallback(async () => {
    if (!selectedChildId) return
    setLoading(true)
    try {
      const [milestonesData, summaryData] = await Promise.all([
        learningMilestonesService.getChildMilestones({
          child_id: selectedChildId,
          category_id: selectedCategoryId || undefined,
        }),
        learningMilestonesService.getChildMilestoneSummary(selectedChildId),
      ])
      setMilestones(milestonesData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load child data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedChildId, selectedCategoryId])

  useEffect(() => {
    loadChildData()
  }, [loadChildData])

  // Filter children by search
  const filteredChildren = children.filter((child) =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedChild = children.find((c) => c.id === selectedChildId)

  const calculateAge = (dob: string): string => {
    const birthDate = new Date(dob)
    const today = new Date()
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
    if (months < 12) {
      return `${months} ${t.learning.months}`
    }
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0
      ? t.learning.yearsMonths.replace('{years}', String(years)).replace('{months}', String(remainingMonths))
      : `${years} ${t.learning.years}`
  }

  const handleUpdateStatus = async (milestoneId: string, status: MilestoneStatus) => {
    try {
      await learningMilestonesService.updateChildMilestone(milestoneId, { status })
      await loadChildData()
    } catch (error) {
      console.error('Failed to update milestone:', error)
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName)
    if (category) {
      setSelectedCategoryId(category.id)
      setView('milestones')
    }
  }

  return (
    <div className="min-h-screen bg-neu-bg dark:bg-neu-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-primary-500" />
              {t.nav.learning}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t.learning.subtitle}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Children List */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4 sticky top-6">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Baby className="w-5 h-5" />
                {t.learning.children}
              </h2>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.learning.searchChildren}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Children list */}
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id)
                      setSelectedCategoryId('')
                      setView('overview')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 ${
                      selectedChildId === child.id
                        ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <p className="font-medium">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {calculateAge(child.date_of_birth)}
                    </p>
                  </button>
                ))}
                {filteredChildren.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                    {t.learning.noChildrenFound}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedChild ? (
              <>
                {/* Child Header */}
                <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        {t.learning.age}: {calculateAge(selectedChild.date_of_birth)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setView('overview')
                          setSelectedCategoryId('')
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          view === 'overview'
                            ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-500/10 text-primary-600'
                            : 'shadow-neu dark:shadow-neu-dark text-gray-600 dark:text-gray-400 hover:text-primary-600'
                        }`}
                      >
                        {t.learning.overview}
                      </button>
                      <button
                        onClick={() => setView('milestones')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          view === 'milestones'
                            ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-500/10 text-primary-600'
                            : 'shadow-neu dark:shadow-neu-dark text-gray-600 dark:text-gray-400 hover:text-primary-600'
                        }`}
                      >
                        {t.learning.allMilestones}
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : view === 'overview' ? (
                  <>
                    {/* Overall Progress */}
                    <OverallMilestoneProgress summaries={summary} className="mb-6" />

                    {/* Progress by Category */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary-500" />
                        {t.learning.progressByArea}
                      </h3>
                      <MilestoneSummaryGrid
                        summaries={summary}
                        onCategoryClick={handleCategoryClick}
                      />
                    </div>

                    {/* Recent Achievements */}
                    <RecentAchievements milestones={milestones} />
                  </>
                ) : (
                  <>
                    {/* Category Filter */}
                    <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="flex-1 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">{t.learning.allCategories}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Milestones List */}
                    <MilestoneList
                      milestones={milestones}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Baby className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t.learning.selectChildPrompt}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
