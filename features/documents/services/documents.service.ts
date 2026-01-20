import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type {
  Document,
  DocumentFormData,
  DocumentTemplate,
  DocumentTemplateFormData,
  DocumentSignature,
  SignatureFormData,
  DocumentRequest,
  DocumentRequestFormData,
  DocumentCompliance,
  OrganizationDocumentSummary,
  EntityDocumentStatus,
  ExpiringDocument,
  DocumentFilters,
  EntityType,
  DocumentStatus,
} from '@/shared/types/documents'

export const documentsService = {
  // ==================== Templates ====================

  async getTemplates(filters?: { category?: string; applies_to?: EntityType }): Promise<DocumentTemplate[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('document_templates')
      .select('*')
      .or(`organization_id.eq.${orgId},organization_id.is.null`)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.applies_to) {
      query = query.eq('applies_to', filters.applies_to)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as DocumentTemplate[]
  },

  async getDcfRequiredTemplates(entityType: EntityType): Promise<DocumentTemplate[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .or(`organization_id.eq.${orgId},organization_id.is.null`)
      .eq('is_active', true)
      .eq('is_dcf_required', true)
      .eq('applies_to', entityType)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as DocumentTemplate[]
  },

  async createTemplate(template: DocumentTemplateFormData): Promise<DocumentTemplate> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        ...template,
        organization_id: orgId,
        is_system_template: false,
        created_by: user?.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as DocumentTemplate
  },

  // ==================== Documents ====================

  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('documents')
      .select(`
        *,
        template:document_templates(*),
        verifier:profiles!verified_by(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type)
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as Document[]
  },

  async getDocumentsByEntity(entityType: EntityType, entityId: string): Promise<Document[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        template:document_templates(*),
        verifier:profiles!verified_by(id, first_name, last_name),
        signatures:document_signatures(*)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Document[]
  },

  async getDocumentById(id: string): Promise<Document | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        template:document_templates(*),
        verifier:profiles!verified_by(id, first_name, last_name),
        signatures:document_signatures(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Document
  },

  async createDocument(document: DocumentFormData): Promise<Document> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...document,
        organization_id: orgId,
        status: 'pending',
        uploaded_by: user?.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as Document
  },

  async updateDocument(id: string, updates: Partial<DocumentFormData>): Promise<Document> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Document
  },

  async submitDocument(id: string): Promise<Document> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Document
  },

  async approveDocument(id: string, notes?: string): Promise<Document> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Document
  },

  async rejectDocument(id: string, reason: string): Promise<Document> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Document
  },

  async deleteDocument(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==================== Signatures ====================

  async addSignature(signature: SignatureFormData): Promise<DocumentSignature> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('document_signatures')
      .insert({
        ...signature,
        organization_id: orgId,
        profile_id: user?.id,
        signed_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as DocumentSignature
  },

  async getSignatures(documentId: string): Promise<DocumentSignature[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('document_signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('signed_at', { ascending: true })

    if (error) throw error
    return (data || []) as DocumentSignature[]
  },

  // ==================== Requests ====================

  async getRequests(entityType?: EntityType, entityId?: string): Promise<DocumentRequest[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('document_requests')
      .select(`
        *,
        template:document_templates(*)
      `)
      .eq('organization_id', orgId)
      .order('due_date', { ascending: true })

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as DocumentRequest[]
  },

  async createRequest(request: DocumentRequestFormData): Promise<DocumentRequest> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('document_requests')
      .insert({
        ...request,
        organization_id: orgId,
        status: 'pending',
        requested_by: user?.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as DocumentRequest
  },

  // ==================== Compliance ====================

  async getComplianceByEntity(entityType: EntityType, entityId: string): Promise<DocumentCompliance | null> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('document_compliance')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as DocumentCompliance
  },

  async getAllCompliance(entityType?: EntityType): Promise<EntityDocumentStatus[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('document_compliance')
      .select('*')
      .eq('organization_id', orgId)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: compliance, error } = await query

    if (error) throw error

    // Get entity names
    const results: EntityDocumentStatus[] = []

    for (const c of compliance || []) {
      let entityName = 'Unknown'

      if (c.entity_type === 'child') {
        const { data: child } = await supabase
          .from('children')
          .select('first_name, last_name')
          .eq('id', c.entity_id)
          .single()
        if (child) entityName = `${child.first_name} ${child.last_name}`
      } else if (c.entity_type === 'staff') {
        const { data: staff } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', c.entity_id)
          .single()
        if (staff) entityName = `${staff.first_name} ${staff.last_name}`
      } else if (c.entity_type === 'family') {
        const { data: family } = await supabase
          .from('families')
          .select('name')
          .eq('id', c.entity_id)
          .single()
        if (family) entityName = family.name
      }

      results.push({
        entity_type: c.entity_type,
        entity_id: c.entity_id,
        entity_name: entityName,
        compliance_status: c.compliance_status,
        total_required: c.total_required,
        total_approved: c.total_approved,
        missing_documents: c.missing_documents || [],
        expiring_documents: c.expiring_documents || [],
      })
    }

    return results
  },

  async getOrganizationSummary(): Promise<OrganizationDocumentSummary> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data: compliance, error } = await supabase
      .from('document_compliance')
      .select('compliance_status')
      .eq('organization_id', orgId)

    if (error) throw error

    const total = compliance?.length || 0
    const compliant = compliance?.filter(c => c.compliance_status === 'compliant').length || 0
    const pending = compliance?.filter(c => c.compliance_status === 'pending_review').length || 0
    const incomplete = compliance?.filter(c => c.compliance_status === 'incomplete').length || 0
    const overdue = compliance?.filter(c => c.compliance_status === 'overdue').length || 0

    return {
      total_entities: total,
      fully_compliant: compliant,
      pending_review: pending,
      incomplete,
      overdue,
      compliance_rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    }
  },

  async getExpiringDocuments(daysAhead: number = 30): Promise<ExpiringDocument[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'approved')
      .not('expiration_date', 'is', null)
      .gte('expiration_date', new Date().toISOString().split('T')[0])
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    if (error) throw error

    // Get entity names
    const results: ExpiringDocument[] = []

    for (const doc of documents || []) {
      let entityName = 'Unknown'

      if (doc.entity_type === 'child') {
        const { data: child } = await supabase
          .from('children')
          .select('first_name, last_name')
          .eq('id', doc.entity_id)
          .single()
        if (child) entityName = `${child.first_name} ${child.last_name}`
      } else if (doc.entity_type === 'staff') {
        const { data: staff } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', doc.entity_id)
          .single()
        if (staff) entityName = `${staff.first_name} ${staff.last_name}`
      } else if (doc.entity_type === 'family') {
        const { data: family } = await supabase
          .from('families')
          .select('name')
          .eq('id', doc.entity_id)
          .single()
        if (family) entityName = family.name
      }

      const expDate = new Date(doc.expiration_date)
      const today = new Date()
      const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      results.push({
        organization_id: doc.organization_id,
        document_id: doc.id,
        document_name: doc.name,
        entity_type: doc.entity_type,
        entity_id: doc.entity_id,
        expiration_date: doc.expiration_date,
        days_until_expiration: daysUntil,
        entity_name: entityName,
      })
    }

    return results
  },
}
