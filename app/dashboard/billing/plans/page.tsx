'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Tag,
  Users,
  Clock,
  ChevronRight,
  Percent,
  Settings,
} from 'lucide-react'
import { billingPlansService } from '@/features/billing/services/billing-plans.service'
import type {
  BillingRateTemplate,
  BillingDiscount,
  ChildBillingEnrollment,
  ScheduleType,
  BillingFrequency,
} from '@/shared/types/billing-plans'
import {
  SCHEDULE_TYPE_LABELS,
  BILLING_FREQUENCY_LABELS,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_COLORS,
  AGE_GROUP_PRESETS,
} from '@/shared/types/billing-plans'
import { clsx } from 'clsx'

type TabType = 'rates' | 'discounts' | 'enrollments'

export default function BillingPlansPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rates')
  const [rateTemplates, setRateTemplates] = useState<BillingRateTemplate[]>([])
  const [discounts, setDiscounts] = useState<BillingDiscount[]>([])
  const [enrollments, setEnrollments] = useState<ChildBillingEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showRateForm, setShowRateForm] = useState(false)
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [editingRate, setEditingRate] = useState<BillingRateTemplate | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<BillingDiscount | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ratesData, discountsData, enrollmentsData] = await Promise.all([
        billingPlansService.getRateTemplates(false),
        billingPlansService.getDiscounts(false),
        billingPlansService.getEnrollments({ status: 'active' }),
      ])
      setRateTemplates(ratesData)
      setDiscounts(discountsData)
      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate template?')) return
    try {
      await billingPlansService.deleteRateTemplate(id)
      setRateTemplates(rateTemplates.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete rate:', error)
    }
  }

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return
    try {
      await billingPlansService.deleteDiscount(id)
      setDiscounts(discounts.filter(d => d.id !== id))
    } catch (error) {
      console.error('Failed to delete discount:', error)
    }
  }

  const formatAge = (months: number): string => {
    if (months < 12) return `${months}m`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`
  }

  const formatRate = (rate: number, frequency: BillingFrequency): string => {
    return `$${rate.toFixed(2)}/${frequency === 'weekly' ? 'wk' : frequency === 'biweekly' ? '2wk' : frequency === 'monthly' ? 'mo' : 'yr'}`
  }

  return (
    <div className="min-h-screen bg-neu-bg dark:bg-neu-bg-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-7 h-7 text-primary-500" />
              Billing Plans & Rates
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configure tuition rates, discounts, and child enrollments
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-1 mb-6 inline-flex">
          {[
            { key: 'rates', label: 'Rate Templates', icon: DollarSign },
            { key: 'discounts', label: 'Discounts', icon: Percent },
            { key: 'enrollments', label: 'Enrollments', icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-500/10 text-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Rate Templates Tab */}
            {activeTab === 'rates' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Rate Templates ({rateTemplates.length})
                  </h2>
                  <button
                    onClick={() => {
                      setEditingRate(null)
                      setShowRateForm(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl shadow-neu dark:shadow-neu-dark hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rate
                  </button>
                </div>

                {rateTemplates.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No rate templates configured</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Create rate templates to define tuition costs by age group
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rateTemplates.map(rate => (
                      <div
                        key={rate.id}
                        className={clsx(
                          'bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4',
                          !rate.is_active && 'opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {rate.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatAge(rate.age_range_start_months)} - {formatAge(rate.age_range_end_months)}
                            </p>
                          </div>
                          {!rate.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Schedule</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {SCHEDULE_TYPE_LABELS[rate.schedule_type]}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Rate</span>
                            <span className="font-semibold text-primary-600 dark:text-primary-400">
                              {formatRate(rate.base_rate, rate.billing_frequency)}
                            </span>
                          </div>
                          {rate.registration_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Registration</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                ${rate.registration_fee.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRate(rate)
                              setShowRateForm(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 shadow-neu dark:shadow-neu-dark rounded-xl hover:text-primary-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRate(rate.id)}
                            className="flex items-center justify-center p-2 text-red-500 shadow-neu dark:shadow-neu-dark rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Discounts Tab */}
            {activeTab === 'discounts' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Discounts ({discounts.length})
                  </h2>
                  <button
                    onClick={() => {
                      setEditingDiscount(null)
                      setShowDiscountForm(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl shadow-neu dark:shadow-neu-dark hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Discount
                  </button>
                </div>

                {discounts.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No discounts configured</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Create discounts for siblings, employees, military, etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discounts.map(discount => (
                      <div
                        key={discount.id}
                        className={clsx(
                          'bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4 flex items-center gap-4',
                          !discount.is_active && 'opacity-60'
                        )}
                      >
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {discount.name}
                            </h3>
                            {!discount.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {discount.discount_type === 'percentage'
                              ? `${discount.discount_value}% off`
                              : `$${discount.discount_value.toFixed(2)} off`}
                            {discount.applies_to_siblings && ` • Sibling discount`}
                            {discount.applies_to_staff && ` • Staff`}
                            {discount.applies_to_military && ` • Military`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingDiscount(discount)
                              setShowDiscountForm(true)
                            }}
                            className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscount(discount.id)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Enrollments Tab */}
            {activeTab === 'enrollments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Active Enrollments ({enrollments.length})
                  </h2>
                </div>

                {enrollments.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No active enrollments</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Enroll children in billing plans from their profile
                    </p>
                  </div>
                ) : (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Child
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Family
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Plan
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Rate
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Enrolled
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map(enrollment => (
                          <tr
                            key={enrollment.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {enrollment.child?.first_name} {enrollment.child?.last_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {enrollment.family?.name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {enrollment.rate_template?.name}
                            </td>
                            <td className="px-4 py-3 font-medium text-primary-600 dark:text-primary-400">
                              ${(enrollment.custom_rate || enrollment.rate_template?.base_rate || 0).toFixed(2)}/
                              {BILLING_FREQUENCY_LABELS[enrollment.rate_template?.billing_frequency || 'weekly'].toLowerCase()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={clsx(
                                  'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                                  enrollment.enrollment_status === 'active' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                                  enrollment.enrollment_status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                                  enrollment.enrollment_status === 'suspended' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                                  enrollment.enrollment_status === 'terminated' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                )}
                              >
                                {ENROLLMENT_STATUS_LABELS[enrollment.enrollment_status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(enrollment.enrolled_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Rate Form Modal */}
        {showRateForm && (
          <RateFormModal
            rate={editingRate}
            onClose={() => {
              setShowRateForm(false)
              setEditingRate(null)
            }}
            onSave={async (data) => {
              if (editingRate) {
                await billingPlansService.updateRateTemplate(editingRate.id, data)
              } else {
                await billingPlansService.createRateTemplate(data)
              }
              setShowRateForm(false)
              setEditingRate(null)
              loadData()
            }}
          />
        )}

        {/* Discount Form Modal */}
        {showDiscountForm && (
          <DiscountFormModal
            discount={editingDiscount}
            onClose={() => {
              setShowDiscountForm(false)
              setEditingDiscount(null)
            }}
            onSave={async (data) => {
              if (editingDiscount) {
                await billingPlansService.updateDiscount(editingDiscount.id, data)
              } else {
                await billingPlansService.createDiscount(data)
              }
              setShowDiscountForm(false)
              setEditingDiscount(null)
              loadData()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ==================== Rate Form Modal ====================

interface RateFormModalProps {
  rate: BillingRateTemplate | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

function RateFormModal({ rate, onClose, onSave }: RateFormModalProps) {
  const [formData, setFormData] = useState({
    name: rate?.name || '',
    description: rate?.description || '',
    age_range_start_months: rate?.age_range_start_months || 0,
    age_range_end_months: rate?.age_range_end_months || 60,
    schedule_type: rate?.schedule_type || 'full_time' as ScheduleType,
    billing_frequency: rate?.billing_frequency || 'weekly' as BillingFrequency,
    base_rate: rate?.base_rate || 0,
    registration_fee: rate?.registration_fee || 0,
    supply_fee_monthly: rate?.supply_fee_monthly || 0,
    days_per_week: rate?.days_per_week || 5,
    is_active: rate?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {rate ? 'Edit Rate Template' : 'Add Rate Template'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Infant Full-Time"
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age From (months)
              </label>
              <select
                value={formData.age_range_start_months}
                onChange={e => setFormData({ ...formData, age_range_start_months: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {AGE_GROUP_PRESETS.map(preset => (
                  <option key={preset.start} value={preset.start}>
                    {preset.start} months
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age To (months)
              </label>
              <select
                value={formData.age_range_end_months}
                onChange={e => setFormData({ ...formData, age_range_end_months: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {AGE_GROUP_PRESETS.map(preset => (
                  <option key={preset.end} value={preset.end}>
                    {preset.end} months
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Type
              </label>
              <select
                value={formData.schedule_type}
                onChange={e => setFormData({ ...formData, schedule_type: e.target.value as ScheduleType })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(SCHEDULE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Billing Frequency
              </label>
              <select
                value={formData.billing_frequency}
                onChange={e => setFormData({ ...formData, billing_frequency: e.target.value as BillingFrequency })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(BILLING_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Rate ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.base_rate}
              onChange={e => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registration Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.registration_fee}
                onChange={e => setFormData({ ...formData, registration_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supply Fee/Month ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.supply_fee_monthly}
                onChange={e => setFormData({ ...formData, supply_fee_monthly: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Active (available for new enrollments)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 shadow-neu dark:shadow-neu-dark rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== Discount Form Modal ====================

interface DiscountFormModalProps {
  discount: BillingDiscount | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

function DiscountFormModal({ discount, onClose, onSave }: DiscountFormModalProps) {
  const [formData, setFormData] = useState({
    name: discount?.name || '',
    description: discount?.description || '',
    discount_type: discount?.discount_type || 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: discount?.discount_value || 0,
    applies_to_siblings: discount?.applies_to_siblings || false,
    sibling_order: discount?.sibling_order || undefined,
    applies_to_staff: discount?.applies_to_staff || false,
    applies_to_military: discount?.applies_to_military || false,
    eligibility_code: discount?.eligibility_code || '',
    is_active: discount?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {discount ? 'Edit Discount' : 'Add Discount'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sibling Discount, Military Discount"
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Type
              </label>
              <select
                value={formData.discount_type}
                onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Applies To
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.applies_to_siblings}
                  onChange={e => setFormData({ ...formData, applies_to_siblings: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Siblings</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.applies_to_staff}
                  onChange={e => setFormData({ ...formData, applies_to_staff: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Staff/Employees</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.applies_to_military}
                  onChange={e => setFormData({ ...formData, applies_to_military: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Military Families</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Eligibility Code (optional)
            </label>
            <input
              type="text"
              value={formData.eligibility_code}
              onChange={e => setFormData({ ...formData, eligibility_code: e.target.value })}
              placeholder="e.g., EMPLOYEE10"
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="discount_is_active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="discount_is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 shadow-neu dark:shadow-neu-dark rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
