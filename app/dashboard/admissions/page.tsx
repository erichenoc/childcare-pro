'use client'

import { useState, useEffect } from 'react'
import {
  UserPlus,
  Users,
  ClipboardList,
  Calendar,
  Phone,
  Mail,
  Baby,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
} from 'lucide-react'
import { admissionsService } from '@/features/admissions/services/admissions.service'
import type {
  AdmissionInquiry,
  AdmissionTour,
  WaitlistEntry,
  InquiryStatus,
  LeadSource,
} from '@/shared/types/admissions'
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  LEAD_SOURCE_LABELS,
  TOUR_STATUS_LABELS,
  TOUR_STATUS_COLORS,
  WAITLIST_PRIORITY_LABELS,
  WAITLIST_PRIORITY_COLORS,
} from '@/shared/types/admissions'
import { clsx } from 'clsx'

type TabType = 'inquiries' | 'tours' | 'waitlist'

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inquiries')
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>([])
  const [tours, setTours] = useState<AdmissionTour[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showInquiryForm, setShowInquiryForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [inquiriesData, toursData, waitlistData] = await Promise.all([
        admissionsService.getInquiries(),
        admissionsService.getUpcomingTours(),
        admissionsService.getWaitlist(),
      ])
      setInquiries(inquiriesData)
      setTours(toursData)
      setWaitlist(waitlistData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string): string => {
    const birthDate = new Date(dob)
    const today = new Date()
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
    if (months < 12) return `${months} months`
    const years = Math.floor(months / 12)
    return `${years} year${years > 1 ? 's' : ''}`
  }

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = searchQuery === '' ||
      `${inquiry.parent_first_name} ${inquiry.parent_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${inquiry.child_first_name} ${inquiry.child_last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === '' || inquiry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats
  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length
  const toursThisWeek = tours.length
  const waitlistCount = waitlist.length

  return (
    <div className="min-h-screen bg-neu-bg dark:bg-neu-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserPlus className="w-7 h-7 text-primary-500" />
              Admissions & Waitlist
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage inquiries, schedule tours, and track waitlist
            </p>
          </div>
          <button
            onClick={() => setShowInquiryForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl shadow-neu dark:shadow-neu-dark hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Inquiry
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newInquiriesCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">New Inquiries</p>
              </div>
            </div>
          </div>

          <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{toursThisWeek}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Tours</p>
              </div>
            </div>
          </div>

          <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{waitlistCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">On Waitlist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-1 mb-6 inline-flex">
          {[
            { key: 'inquiries', label: 'Inquiries', icon: Users, count: inquiries.length },
            { key: 'tours', label: 'Tours', icon: Calendar, count: tours.length },
            { key: 'waitlist', label: 'Waitlist', icon: ClipboardList, count: waitlist.length },
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
              <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    {Object.entries(INQUIRY_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {filteredInquiries.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No inquiries found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInquiries.map(inquiry => (
                      <InquiryCard key={inquiry.id} inquiry={inquiry} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tours Tab */}
            {activeTab === 'tours' && (
              <div>
                {tours.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No upcoming tours scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tours.map(tour => (
                      <TourCard key={tour.id} tour={tour} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Waitlist Tab */}
            {activeTab === 'waitlist' && (
              <div>
                {waitlist.length === 0 ? (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-8 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No children on waitlist</p>
                  </div>
                ) : (
                  <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">#</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Child</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Parent</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Priority</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Wait Time</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlist.map(entry => (
                          <tr
                            key={entry.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {entry.position}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {entry.inquiry?.child_first_name} {entry.inquiry?.child_last_name}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {entry.inquiry?.parent_first_name} {entry.inquiry?.parent_last_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {entry.inquiry?.child_date_of_birth && calculateAge(entry.inquiry.child_date_of_birth)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={clsx(
                                  'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                                  entry.priority === 'sibling' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                  entry.priority === 'vip' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                                  entry.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                                  entry.priority === 'normal' && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                )}
                              >
                                {WAITLIST_PRIORITY_LABELS[entry.priority]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                              {Math.floor((Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                              {entry.requested_start_date
                                ? new Date(entry.requested_start_date).toLocaleDateString()
                                : 'Flexible'}
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

        {/* Inquiry Form Modal */}
        {showInquiryForm && (
          <InquiryFormModal
            onClose={() => setShowInquiryForm(false)}
            onSave={async (data) => {
              await admissionsService.createInquiry(data)
              setShowInquiryForm(false)
              loadData()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ==================== Inquiry Card ====================

function InquiryCard({ inquiry }: { inquiry: AdmissionInquiry }) {
  const statusColorMap: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    tour_scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    tour_completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    waitlisted: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    offered: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    enrolled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4 hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
          <Baby className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {inquiry.child_first_name} {inquiry.child_last_name}
            </h3>
            <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', statusColorMap[inquiry.status] || statusColorMap.new)}>
              {INQUIRY_STATUS_LABELS[inquiry.status]}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Parent: {inquiry.parent_first_name} {inquiry.parent_last_name}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {inquiry.email}
            </span>
            {inquiry.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {inquiry.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(inquiry.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  )
}

// ==================== Tour Card ====================

function TourCard({ tour }: { tour: AdmissionTour }) {
  const inquiry = tour.inquiry
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  }

  return (
    <div className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4">
      <div className="flex items-start gap-4">
        <div className="text-center p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {new Date(tour.scheduled_date).toLocaleDateString('en-US', { month: 'short' })}
          </p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {new Date(tour.scheduled_date).getDate()}
          </p>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {inquiry?.parent_first_name} {inquiry?.parent_last_name}
            </h3>
            <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', statusColors[tour.status] || statusColors.scheduled)}>
              {TOUR_STATUS_LABELS[tour.status]}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Child: {inquiry?.child_first_name} {inquiry?.child_last_name}
          </p>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tour.scheduled_time?.slice(0, 5)}
            </span>
            <span>{tour.duration_minutes} min</span>
            {tour.tour_guide && (
              <span>
                Guide: {tour.tour_guide.first_name} {tour.tour_guide.last_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Inquiry Form Modal ====================

interface InquiryFormModalProps {
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

function InquiryFormModal({ onClose, onSave }: InquiryFormModalProps) {
  const [formData, setFormData] = useState({
    parent_first_name: '',
    parent_last_name: '',
    email: '',
    phone: '',
    child_first_name: '',
    child_last_name: '',
    child_date_of_birth: '',
    desired_start_date: '',
    schedule_type: 'full_time',
    lead_source: 'website' as LeadSource,
    notes: '',
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
            New Inquiry
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent First Name *
              </label>
              <input
                type="text"
                value={formData.parent_first_name}
                onChange={e => setFormData({ ...formData, parent_first_name: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Last Name *
              </label>
              <input
                type="text"
                value={formData.parent_last_name}
                onChange={e => setFormData({ ...formData, parent_last_name: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Child First Name *
              </label>
              <input
                type="text"
                value={formData.child_first_name}
                onChange={e => setFormData({ ...formData, child_first_name: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Child Last Name
              </label>
              <input
                type="text"
                value={formData.child_last_name}
                onChange={e => setFormData({ ...formData, child_last_name: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Child Date of Birth *
            </label>
            <input
              type="date"
              value={formData.child_date_of_birth}
              onChange={e => setFormData({ ...formData, child_date_of_birth: e.target.value })}
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desired Start Date
              </label>
              <input
                type="date"
                value={formData.desired_start_date}
                onChange={e => setFormData({ ...formData, desired_start_date: e.target.value })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lead Source
              </label>
              <select
                value={formData.lead_source}
                onChange={e => setFormData({ ...formData, lead_source: e.target.value as LeadSource })}
                className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
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
              {saving ? 'Saving...' : 'Save Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
