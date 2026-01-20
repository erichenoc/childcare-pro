'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Filter, AlertTriangle, Clock, Eye, CheckCircle, XCircle } from 'lucide-react'
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTable,
  GlassTableHeader,
  GlassTableBody,
  GlassTableRow,
  GlassTableHead,
  GlassTableCell,
  GlassTableEmpty,
} from '@/shared/components/ui'
import { documentsService } from '@/features/documents/services/documents.service'
import {
  DocumentStatusBadge,
  DocumentSummaryCard,
  DocumentUploadModal,
} from '@/features/documents/components'
import type {
  Document,
  OrganizationDocumentSummary,
  ExpiringDocument,
  DocumentStatus,
  DocumentCategory,
  EntityType,
} from '@/shared/types/documents'
import { useTranslations } from '@/shared/lib/i18n'

export default function DocumentsPage() {
  const t = useTranslations()
  const [documents, setDocuments] = useState<Document[]>([])
  const [summary, setSummary] = useState<OrganizationDocumentSummary | null>(null)
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | ''>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [docsData, summaryData, expiringData] = await Promise.all([
        documentsService.getDocuments(),
        documentsService.getOrganizationSummary(),
        documentsService.getExpiringDocuments(30),
      ])
      setDocuments(docsData)
      setSummary(summaryData)
      setExpiringDocs(expiringData)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || doc.status === statusFilter
    const matchesCategory = !categoryFilter || doc.category === categoryFilter
    const matchesEntityType = !entityTypeFilter || doc.entity_type === entityTypeFilter
    return matchesSearch && matchesStatus && matchesCategory && matchesEntityType
  })

  const handleApprove = async (id: string) => {
    try {
      await documentsService.approveDocument(id)
      loadData()
    } catch (error) {
      console.error('Error approving document:', error)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      try {
        await documentsService.rejectDocument(id, reason)
        loadData()
      } catch (error) {
        console.error('Error rejecting document:', error)
      }
    }
  }

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'enrollment', label: 'Enrollment' },
    { value: 'medical', label: 'Medical' },
    { value: 'dcf', label: 'DCF Required' },
    { value: 'permission', label: 'Permission' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'financial', label: 'Financial' },
    { value: 'other', label: 'Other' },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
  ]

  const entityTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'child', label: 'Children' },
    { value: 'family', label: 'Families' },
    { value: 'staff', label: 'Staff' },
  ]

  const getCategoryLabel = (category: DocumentCategory) => {
    const cat = categoryOptions.find((c) => c.value === category)
    return cat?.label || category
  }

  const getEntityTypeLabel = (type: EntityType) => {
    const et = entityTypeOptions.find((e) => e.value === type)
    return et?.label || type
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t.nav.documents || 'Forms & Documents'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all documents and forms for DCF compliance
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </GlassButton>
      </div>

      {/* Summary Card */}
      <DocumentSummaryCard summary={summary} isLoading={isLoading} />

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <GlassCard className="border-l-4 border-l-yellow-500">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Clock className="w-5 h-5" />
              Documents Expiring Soon ({expiringDocs.length})
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2">
              {expiringDocs.slice(0, 5).map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between p-3 rounded-lg shadow-neu-inset dark:shadow-neu-dark-inset"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {doc.document_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.entity_name} ({doc.entity_type})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {doc.days_until_expiration} days remaining
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Expires: {formatDate(doc.expiration_date)}
                    </p>
                  </div>
                </div>
              ))}
              {expiringDocs.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                  And {expiringDocs.length - 5} more documents expiring...
                </p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Documents Table */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <GlassCardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              All Documents
            </GlassCardTitle>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <GlassInput
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <GlassSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | '')}
                className="w-40"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </GlassSelect>
              <GlassSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | '')}
                className="w-36"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </GlassSelect>
              <GlassSelect
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | '')}
                className="w-32"
              >
                {entityTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </GlassSelect>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          ) : (
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>Document</GlassTableHead>
                  <GlassTableHead>Category</GlassTableHead>
                  <GlassTableHead>Entity</GlassTableHead>
                  <GlassTableHead>Status</GlassTableHead>
                  <GlassTableHead>Expires</GlassTableHead>
                  <GlassTableHead className="text-right">Actions</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {filteredDocuments.length === 0 ? (
                  <GlassTableEmpty colSpan={6}>
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No documents found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload a document to get started
                    </p>
                  </GlassTableEmpty>
                ) : (
                  filteredDocuments.map((doc) => (
                    <GlassTableRow key={doc.id}>
                      <GlassTableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <FileText className="w-4 h-4 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {doc.name}
                            </p>
                            {doc.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getCategoryLabel(doc.category)}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                          {doc.entity_type}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <DocumentStatusBadge status={doc.status} size="sm" />
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(doc.expiration_date)}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            title="View"
                            onClick={() => {}}
                          >
                            <Eye className="w-4 h-4" />
                          </GlassButton>
                          {doc.status === 'submitted' && (
                            <>
                              <GlassButton
                                variant="ghost"
                                size="sm"
                                title="Approve"
                                onClick={() => handleApprove(doc.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </GlassButton>
                              <GlassButton
                                variant="ghost"
                                size="sm"
                                title="Reject"
                                onClick={() => handleReject(doc.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </GlassButton>
                            </>
                          )}
                        </div>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))
                )}
              </GlassTableBody>
            </GlassTable>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  )
}
